# Real-Time Data Synchronization Pipeline

This project implements a Change Data Capture (CDC) pipeline using the CQRS pattern. It synchronizes data in real-time from a primary PostgreSQL database to a MongoDB read model using Debezium and Apache Kafka.

## Prerequisites
- Docker and Docker Compose installed
- Port `9000` (Write Service), `9001` (Read Service), and Docker infrastructure ports available.

## Quick Start
1. Clone the repository and navigate to the root directory.
2. Start the infrastructure and microservices:
   \`\`\`bash
   docker-compose up -d --build
   \`\`\`
3. Wait ~30 seconds for Kafka Connect to become healthy.
4. Register the Debezium connector:
   \`\`\`bash
   bash setup-debezium.sh
   \`\`\`

## Architecture
- **Write Service (Port 9000):** Node.js REST API handling CRUD operations on PostgreSQL.
- **CDC Pipeline:** Debezium monitors PostgreSQL WAL and streams changes to Kafka.
- **Read Service (Port 9001):** Node.js Kafka consumer that idempotently updates MongoDB and serves read queries.