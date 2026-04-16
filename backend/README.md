# Elysia with Bun runtime

## Getting Started
To get started with this template, simply paste this command into your terminal:
```bash
bun create elysia ./elysia-example
```

## Development
To start the development server run:
```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## Seeding the Database
To populate the database with initial data (Admin, Customers, Delivery partners, and Inventory), run:
```bash
bunx prisma db seed
```

## Default Credentials
All users share the same password: `123456`

| Name | Role | Phone | Email |
|------|------|-------|-------|
| Admin User | ADMIN | `1234567890` | `admin@water.com` |
| John Customer | CUSTOMER | `0987654321` | `john@example.com` |
| Alice Customer | CUSTOMER | `1112223333` | `alice@example.com` |
| Bob Delivery | DELIVERY | `5556667777` | `bob@delivery.com` |
| Charlie Delivery | DELIVERY | `8889990000` | `charlie@delivery.com` |
