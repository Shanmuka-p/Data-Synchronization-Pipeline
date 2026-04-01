# Real-Time Data Synchronization Pipeline

**Project Submission**

This project demonstrates a production-grade, real-time data synchronization pipeline using Change Data Capture (CDC) and the Command Query Responsibility Segregation (CQRS) pattern. The system captures changes from a PostgreSQL database and streams them to a MongoDB read replica via Debezium and Kafka.

---

## 🚀 Evaluator's Quick Start Guide

Follow these exact steps to clone, build, and test the entire pipeline from scratch.

### Step 1: Clone the Repository
Open your terminal and clone this project to your local machine:
\`\`\`bash
git clone https://github.com/Shanmuka-p/Data-Synchronization-Pipeline.git
cd Data-Synchronization-Pipeline
\`\`\`

### Step 2: Configure Environment Variables
Create your `.env` file from the provided template:
\`\`\`bash
cp .env.example .env
\`\`\`

### Step 3: Build and Start the Microservices
Ensure Docker Desktop is running, then spin up the 7-container infrastructure (Postgres, Mongo, Zookeeper, Kafka, Connect, Write-Service, and Read-Service):
\`\`\`bash
docker-compose up -d --build
\`\`\`
*Wait approximately 30-45 seconds for the Kafka Connect service to finish booting and become healthy.*

### Step 4: Initialize the CDC Pipeline
Register the Debezium connector so it begins monitoring the PostgreSQL Write-Ahead Log (WAL):
\`\`\`bash
bash setup-debezium.sh
\`\`\`
*You should receive a `201 Created` JSON response confirming the connector is registered.*

### Step 5: Test the End-to-End Synchronization
Copy and paste these exact commands to verify data is flowing from Postgres -> Kafka -> MongoDB. 

**A. Insert a product into the Write Service (PostgreSQL):**
\`\`\`bash
curl -X POST http://127.0.0.1:9000/api/products -H "Content-Type: application/json" -d "{\"name\":\"Mechanical Keyboard\",\"price\":120.50,\"category\":\"Electronics\",\"stock\":50}"
\`\`\`

**B. Query the Read Service (MongoDB) to verify synchronization:**
*Wait 2-3 seconds for the event to stream, then run:*
\`\`\`bash
curl -X GET "http://127.0.0.1:9001/api/products/search?query=Keyboard"
\`\`\`
*You should receive a JSON array containing the newly created Mechanical Keyboard.*

---

## 🏗️ Architecture & Data Flow



The architecture consists of the following components:
1.  **Write Service (Port 9000)**: A Node.js application responsible for handling all write operations to PostgreSQL.
2.  **PostgreSQL**: The primary, authoritative database.
3.  **Debezium**: A CDC tool monitoring the PostgreSQL WAL for data changes.
4.  **Kafka**: A distributed event streaming platform handling the Debezium payload.
5.  **Read Service (Port 9001)**: An idempotent Node.js Kafka consumer that updates MongoDB.
6.  **MongoDB**: The denormalized, read-optimized data store.

---

## 📡 Full API Reference

### Write Service (`http://127.0.0.1:9000`)
Handles all "Command" operations.

- **Create a Product**
  - **POST** `/api/products`
  - **Body**: `{"name": "Laptop", "price": 1200.00, "category": "Electronics", "stock": 50}`
- **Update a Product**
  - **PUT** `/api/products/:id`
  - **Body**: `{"name": "Gaming Laptop", "price": 1500.00, "category": "Electronics", "stock": 40}`
- **Soft Delete a Product**
  - **DELETE** `/api/products/:id` *(Sets `deleted_at` timestamp rather than hard deleting)*

### Read Service (`http://127.0.0.1:9001`)
Handles all "Query" operations and sync monitoring.

- **Search Products (Filters out soft-deleted items)**
  - **GET** `/api/products/search?query=<search_term>`
- **Filter by Category**
  - **GET** `/api/products/category/:category`
- **Check Kafka Sync Status**
  - **GET** `/api/sync/status`
- **Trigger Full Re-sync (Database Rebuild)**
  - **POST** `/api/sync/reset` *(Drops MongoDB and resets Kafka consumer to offset 0)*

---

## ⚙️ Environment Variables Reference
Located in `.env.example`:

| Variable                | Description                                        | Default Value |
| ----------------------- | -------------------------------------------------- | ------------- |
| `POSTGRES_DB`           | PostgreSQL database name.                          | `products_db` |
| `MONGO_INITDB_DATABASE` | MongoDB database name.                             | `products_read_db` |
| `WRITE_SERVICE_PORT`    | Port for the Node.js Write Service.                | `9000`        |
| `READ_SERVICE_PORT`     | Port for the Node.js Read Service.                 | `9001`        |