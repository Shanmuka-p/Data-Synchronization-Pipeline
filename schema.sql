CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Ensure replica identity is set to FULL so Debezium captures the before-state on updates/deletes
ALTER TABLE public.products REPLICA IDENTITY FULL;