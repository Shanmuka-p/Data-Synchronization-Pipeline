# Real-Time Data Synchronization Pipeline

This project demonstrates a real-time data synchronization pipeline using Change Data Capture (CDC) and the Command Query Responsibility Segregation (CQRS) pattern. The system captures changes from a PostgreSQL database and streams them to a MongoDB read replica via Debezium and Kafka.

## Architecture

The architecture consists of the following components:

- **Write Service**: A Node.js application responsible for handling all write operations (Create, Update, Delete) to the PostgreSQL database.
- **PostgreSQL**: The primary database that stores the authoritative data.
- **Debezium**: A CDC tool that monitors the PostgreSQL write-ahead log (WAL) for any data changes.
- **Kafka**: A distributed streaming platform that receives change events from Debezium.
- **Read Service**: A Node.js application that consumes change events from Kafka and updates a MongoDB database, which serves as a read-optimized data store.
- **MongoDB**: The read database, providing fast and efficient query capabilities.

### Data Flow

1.  A write operation is sent to the **Write Service**.
2.  The **Write Service** persists the change to the **PostgreSQL** database.
3.  **Debezium** captures this change from the PostgreSQL WAL and publishes a message to a **Kafka** topic.
4.  The **Read Service** consumes the message from the Kafka topic and updates the **MongoDB** database.
5.  Read operations are served by the **Read Service** from the **MongoDB** database, ensuring that the write and read operations are separated.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### 1. Environment Configuration

Create a `.env` file from the example and customize the variables if needed:

```bash
cp .env.example .env
```

### 2. Build and Start Services

Build and start all the services in detached mode using Docker Compose:

```bash
docker-compose up -d --build
```

This command will start all the necessary services, including the `write-service`, `read-service`, PostgreSQL, MongoDB, Kafka, and Debezium.

### 3. Setup Debezium Connector

Wait for about 30 seconds for the Kafka Connect service to be ready, then run the following script to set up the Debezium PostgreSQL connector:

```bash
./setup-debezium.sh
```

This script registers the connector, which will start monitoring the `products` table in the PostgreSQL database.

## API Endpoints

### Write Service (`http://localhost:9000`)

- **Create a Product**
  - **POST** `/api/products`
  - **Body**: 
    ```json
    {
      "name": "Laptop",
      "price": 1200.00,
      "category": "Electronics",
      "stock": 50
    }
    ```

- **Update a Product**
  - **PUT** `/api/products/:id`
  - **Body**: 
    ```json
    {
      "name": "Gaming Laptop",
      "price": 1500.00,
      "category": "Electronics",
      "stock": 40
    }
    ```

- **Soft Delete a Product**
  - **DELETE** `/api/products/:id`

### Read Service (`http://localhost:9001`)

- **Search for Products**
  - **GET** `/api/products/search?query=<search_term>`

- **Get Products by Category**
  - **GET** `/api/products/category/:category`

- **Get Sync Status**
  - **GET** `/api/sync/status`

- **Reset Read Model**
  - **POST** `/api/sync/reset`

## Environment Variables

The following environment variables are used to configure the application. They are defined in the `.env.example` file.

| Variable                | Description                                        | Default Value        |
| ----------------------- | -------------------------------------------------- | -------------------- |
| `POSTGRES_DB`           | PostgreSQL database name.                          | `products_db`        |
| `POSTGRES_USER`         | PostgreSQL username.                               | `user`               |
| `POSTGRES_PASSWORD`     | PostgreSQL password.                               | `password`           |
| `MONGO_INITDB_DATABASE` | MongoDB database name.                             | `products_read_db`   |
| `WRITE_SERVICE_PORT`    | Port for the Write Service.                        | `9000`               |
| `READ_SERVICE_PORT`     | Port for the Read Service.                         | `9001`               |
| `KAFKA_BROKERS`         | Comma-separated list of Kafka brokers.             | `kafka:29092`        |
| `KAFKA_TOPIC`           | Kafka topic for product change events.             | `pg-server.public.products` |
