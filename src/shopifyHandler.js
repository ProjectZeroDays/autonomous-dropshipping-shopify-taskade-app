const crypto = require('crypto');

function handleShopifyWebhook(req, res) {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!hmacHeader || !secret) {
        return res.status(401).send('Unauthorized: Missing signature or secret');
    }

    try {
        const generatedHmac = crypto
            .createHmac('sha256', secret)
            .update(req.body)
            .digest('base64');

        const isMatch = crypto.timingSafeEqual(
            Buffer.from(hmacHeader, 'base64'),
            Buffer.from(generatedHmac, 'base64')
        );

        if (!isMatch) {
            return res.status(401).send('Unauthorized: Signature mismatch');
        }

        const payload = JSON.parse(req.body.toString('utf8'));
        console.log(`✅ Verified Shopify Webhook [${topic}]`);

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('❌ Error processing Shopify webhook:', error.message);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { handleShopifyWebhook };
