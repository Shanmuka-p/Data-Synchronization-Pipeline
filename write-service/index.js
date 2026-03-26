const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'products_db',
});

// Helper function to format the DB response to match the spec
const formatProduct = (row) => ({
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    category: row.category,
    stock: row.stock,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null
});

// 1. Create Product (POST /api/products)
app.post('/api/products', async (req, res) => {
    const { name, price, category, stock } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO public.products (name, price, category, stock) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, price, category, stock]
        );
        res.status(201).json(formatProduct(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Update Product (PUT /api/products/:id)
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, category, stock } = req.body;
    try {
        const result = await pool.query(
            `UPDATE public.products 
       SET name = $1, price = $2, category = $3, stock = $4, updated_at = NOW() 
       WHERE id = $5 AND deleted_at IS NULL 
       RETURNING *`,
            [name, price, category, stock, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(formatProduct(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Soft Delete Product (DELETE /api/products/:id)
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE public.products SET deleted_at = NOW() WHERE id = $1 RETURNING id`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Write Service running on port ${PORT}`);
});