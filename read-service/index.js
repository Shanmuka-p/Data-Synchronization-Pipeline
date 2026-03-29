const express = require('express');
const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- MongoDB Setup ---
const mongoUri = `mongodb://${process.env.MONGO_HOST || 'mongo'}:27017/${process.env.MONGO_DB || 'products_read_db'}`;
mongoose.connect(mongoUri).then(() => console.log('Connected to MongoDB')).catch(console.error);

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: String,
    price: Number,
    category: String,
    stock: Number,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date
});
const Product = mongoose.model('Product', productSchema);

// --- Kafka Setup ---
const kafka = new Kafka({
    clientId: 'read-service',
    brokers: [(process.env.KAFKA_BROKERS || 'kafka:29092')]
});
const consumer = kafka.consumer({ groupId: 'products-read-group' });
const topic = process.env.KAFKA_TOPIC || 'pg-server.public.products';

let syncState = { consumerLag: 0, lastProcessedOffset: 0, totalEventsProcessed: 0 };

// --- CDC Processing Logic ---
const runConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            syncState.lastProcessedOffset = message.offset;
            syncState.totalEventsProcessed++;

            if (!message.value) {
                if (message.key) {
                    const keyData = JSON.parse(message.key.toString());
                    if (keyData && keyData.payload && keyData.payload.id) {
                        await Product.deleteOne({ id: keyData.payload.id });
                    }
                }
                return;
            }

            const event = JSON.parse(message.value.toString());
            const payload = event.payload;
            if (!payload) return;

            const op = payload.op;

            if (op === 'c' || op === 'u' || op === 'r') {
                const after = payload.after;
                if (!after) return;
                await Product.findOneAndUpdate(
                    { id: after.id },
                    {
                        id: after.id,
                        name: after.name,
                        price: after.price,
                        category: after.category,
                        stock: after.stock,
                        createdAt: after.created_at ? new Date(after.created_at / 1000) : null,
                        updatedAt: after.updated_at ? new Date(after.updated_at / 1000) : null,
                        deletedAt: after.deleted_at ? new Date(after.deleted_at / 1000) : null
                    },
                    { upsert: true, new: true }
                );
            } else if (op === 'd') {
                const before = payload.before;
                if (before && before.id) {
                    await Product.deleteOne({ id: before.id });
                }
            }
        },
    });
};
runConsumer().catch(console.error);

// --- API Endpoints ---
app.get('/api/products/search', async (req, res) => {
    const { query } = req.query;
    const regex = new RegExp(query, 'i');
    const products = await Product.find({
        $or: [{ name: regex }, { category: regex }],
        deletedAt: null
    });
    res.json(products);
});

app.get('/api/products/category/:category', async (req, res) => {
    const products = await Product.find({ category: req.params.category, deletedAt: null });
    res.json(products);
});

app.get('/api/sync/status', (req, res) => res.json(syncState));

app.post('/api/sync/reset', async (req, res) => {
    try {
        await Product.deleteMany({});
        consumer.seek({ topic, partition: 0, offset: '0' });
        res.status(202).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset sync' });
    }
});

const PORT = process.env.PORT || 8081;
// Explicitly binding to 0.0.0.0 to prevent Windows connection resets!
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Read Service running on port ${PORT}`);
});