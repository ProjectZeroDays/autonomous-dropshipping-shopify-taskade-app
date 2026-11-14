const axios = require('axios');
const ZENDROP_API_BASE = 'https://api.zendrop.com/v1';

async function fulfillOrderWithZendrop(stripeSession, lineItems) {
    const zendropApiKey = process.env.ZENDROP_API_KEY;
    if (!zendropApiKey) return null;

    try {
        const shippingDetails = stripeSession.customer_details || {};
        const address = shippingDetails.address || {};

        const fulfillmentPayload = {
            external_order_id: stripeSession.id,
            shipping_address: {
                first_name: shippingDetails.name ? shippingDetails.name.split(' ')[0] : 'Valued',
                last_name: shippingDetails.name ? shippingDetails.name.split(' ').slice(1).join(' ') : 'Customer',
                address1: address.line1 || '123 Default St',
                city: address.city || 'Memphis',
                state: address.state || 'TN',
                country: address.country || 'US',
                zip: address.postal_code || '38103',
                email: shippingDetails.email || 'customer@example.com'
            },
            line_items: lineItems.map(item => ({ sku: item.sku, quantity: item.quantity }))
        };

        const response = await axios.post(`${ZENDROP_API_BASE}/orders`, fulfillmentPayload, {
            headers: { 'Authorization': `Bearer ${zendropApiKey}`, 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Zendrop Fulfillment Failed:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { fulfillOrderWithZendrop };
