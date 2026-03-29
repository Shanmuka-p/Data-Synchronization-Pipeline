#!/bin/bash

echo "Registering Debezium PostgreSQL connector..."

curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" http://localhost:8083/connectors/ -d '{
  "name": "products-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres",
    "database.port": "5432",
    "database.user": "user",
    "database.password": "password",
    "database.dbname": "products_db",
    "topic.prefix": "pg-server",
    "table.include.list": "public.products",
    "tombstones.on.delete": "true",
    "plugin.name": "pgoutput",
    "decimal.handling.mode": "double"
  }
}'

echo -e "\n\nConnector registration request sent."