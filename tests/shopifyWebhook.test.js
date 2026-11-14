const request = require('supertest');
const crypto = require('crypto');

process.env.SHOPIFY_WEBHOOK_SECRET = 'test_shopify_secret_123';

const express = require('express');
const { handleShopifyWebhook } = require('../src/shopifyHandler');

const app = express();
app.post('/webhook/shopify', express.raw({ type: 'application/json' }), handleShopifyWebhook);

describe('POST /webhook/shopify - HMAC Signature Verification', () => {
    const generateValidHmac = (rawBody, secret) => {
        return crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    };

    test('It should successfully verify valid HMAC signature', async () => {
        const payload = JSON.stringify({ id: 123, topic: 'orders/create' });
        const hmac = generateValidHmac(Buffer.from(payload), process.env.SHOPIFY_WEBHOOK_SECRET);

        const res = await request(app)
            .post('/webhook/shopify')
            .set('x-shopify-hmac-sha256', hmac)
            .set('x-shopify-topic', 'orders/create')
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ received: true });
    });

    test('It should reject invalid HMAC signature', async () => {
        const payload = JSON.stringify({ id: 123 });
        const hmac = generateValidHmac(Buffer.from(payload), 'wrong_secret');

        const res = await request(app)
            .post('/webhook/shopify')
            .set('x-shopify-hmac-sha256', hmac)
            .send(payload);

        expect(res.status).toBe(401);
    });
});
