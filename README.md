# 🔄 Real-Time Data Synchronization Pipeline

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

**Project Submission**


## 📖 Project Overview
This project is a production-grade microservices architecture demonstrating **Command Query Responsibility Segregation (CQRS)** and **Event Sourcing**. It separates the heavy lifting of writing data from the speed of reading data. 

When a user writes to the primary database (PostgreSQL), **Debezium** instantly captures that change via the Write-Ahead Log (WAL) and streams it through **Apache Kafka** to a **MongoDB** read-replica. This ensures search queries are lightning-fast, and the read database is kept eventually consistent in real-time.

---

## 🏗️ Architecture & Data Flow

1. **Write Service (Command):** A Node.js API receives a write request and updates **PostgreSQL**.
2. **Change Data Capture (CDC):** **Debezium** monitors the PostgreSQL WAL for row-level changes (Insert/Update/Delete).
3. **Event Streaming:** Debezium publishes the change event as a JSON payload to an **Apache Kafka** topic.
4. **Read Service (Query):** An idempotent Node.js consumer listens to Kafka and syncs the data into **MongoDB**.
5. **Client Queries:** Clients fetch ultra-fast search results directly from MongoDB.

---

## 🚀 Evaluator's Quick Start Guide

Follow these exact steps to clone, build, and test the entire pipeline from scratch.

### Step 1: Clone the Repository
```bash
git clone https://github.com/Shanmuka-p/Data-Synchronization-Pipeline.git
cd Data-Synchronization-Pipeline
```

### Step 2: Configure Environment Variables
Create your `.env` file from the provided template:
```bash
cp .env.example .env
```

### Step 3: Build and Start the Microservices
Ensure Docker Desktop is running, then spin up the 7-container infrastructure:
```bash
docker-compose up -d --build
```
Wait approximately 30-45 seconds for the Zookeeper, Kafka, and Kafka Connect services to finish booting.

### Step 4: Initialize the CDC Pipeline
Register the Debezium connector so it begins monitoring PostgreSQL:
```bash
bash setup-debezium.sh
```
You should receive a 201 Created JSON response confirming the connector is registered.

### Step 5: Test the End-to-End Synchronization
Copy and paste these exact commands to verify data is flowing across the distributed system.

**A. Insert a product into the Write Service (Port 9000):**
```bash
curl -X POST http://127.0.0.1:9000/api/products -H "Content-Type: application/json" -d "{\"name\":\"Mechanical Keyboard\",\"price\":120.50,\"category\":\"Electronics\",\"stock\":50}"
```

**B. Query the Read Service (Port 9001) to verify synchronization:**
Wait 2-3 seconds for the event to stream, then run:
```bash
curl -X GET "http://127.0.0.1:9001/api/products/search?query=Keyboard"
```
You should receive a JSON array containing the newly created product directly from MongoDB.

---

## ✨ Key Enterprise Features Implemented
- **Idempotent Consumers:** The Read Service uses MongoDB's `findOneAndUpdate` with upserts. It can process the exact same Kafka message 1,000 times safely without duplicating data.
- **Soft Deletes:** Deleting a record via the API updates a `deleted_at` timestamp rather than destroying the row, preserving data for analytics while filtering it out of active Read Service searches.
- **Disaster Recovery (Offset Reset):** The system features a `/api/sync/reset` endpoint. If MongoDB is wiped, this triggers Kafka to replay the entire event history from offset 0, completely rebuilding the database from scratch.

---

## 📡 API Reference

### Write Service (http://127.0.0.1:9000)
| Method | Endpoint | Description | Body Example |
|---|---|---|---|
| POST | `/api/products` | Create a new product | `{"name": "Laptop", "price": 1200.00, "category": "Electronics", "stock": 50}` |
| PUT | `/api/products/:id` | Update existing product | `{"name": "Gaming Laptop", "price": 1500.00}` |
| DELETE | `/api/products/:id` | Soft delete product | N/A |

### Read Service (http://127.0.0.1:9001)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products/search?query=x` | Search active products (filters soft-deleted) |
| GET | `/api/products/category/:id` | Filter by category |
| GET | `/api/sync/status` | View consumer lag and processed events |
| POST | `/api/sync/reset` | Drop MongoDB and rebuild from Kafka |

---

## ⚙️ Environment Variables Reference
| Variable | Description | Default Value |
|---|---|---|
| POSTGRES_DB | PostgreSQL database name | products_db |
| MONGO_INITDB_DATABASE | MongoDB database name | products_read_db |
| WRITE_SERVICE_PORT | Port for the Command API | 9000 |
| READ_SERVICE_PORT | Port for the Query API | 9001 |
| KAFKA_BROKERS | Internal Docker Kafka routing | kafka:29092 |
