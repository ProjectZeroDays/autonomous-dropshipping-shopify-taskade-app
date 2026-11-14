# API Route Map & Webhook Endpoints

This document maps the Express server routes (`src/controllers/`) to the incoming webhooks and agent triggers used by Shopify and Taskade.

---

## Base URL
* **Development:** `http://localhost:3000/api/v1`
* **Production:** `https://your-domain.com/api/v1`

---

## Route Table

| Method | Endpoint | Description | Trigger Source |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health check and uptime monitor | Uptime Monitor / Manual |
| `POST` | `/webhooks/shopify/orders` | Ingests new Shopify order creation events | Shopify Webhook |
| `POST` | `/webhooks/shopify/fulfillment` | Ingests fulfillment and tracking updates | Shopify Webhook |
| `POST` | `/webhooks/taskade/dispatch` | Receives execution triggers from Taskade workflows | Taskade Automation |
| `POST` | `/agents/trigger` | Manually invoke an autonomous agent worker | Admin / CLI |
