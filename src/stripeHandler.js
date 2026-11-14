const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { calculateNetProfit } = require('./financialCalculator');
const { fulfillOrderWithZendrop } = require('./zendropFulfillment');
const TASKADE_API_BASE = 'https://www.taskade.com/api/v1';

async function updateTaskadeBIRow(financialMetrics, customerEmail) {
    const token = process.env.TASK_API_TOKEN;
    const projectId = process.env.TASKADE_PROJECT_ID;
    const rowId = process.env.TASKADE_ROW_ID;

    if (!token || !projectId || !rowId) return;

    try {
        const payload = {
            contentType: "text/markdown",
            content: `Sale: $${financialMetrics.grossSales} | Net: $${financialMetrics.netProfit} (${financialMetrics.netMargin}%) (${customerEmail})`,
            customFields: {
                "Gross Sales ($)": financialMetrics.grossSales,
                "Net Profit ($)": financialMetrics.netProfit,
                "Net Profit Margin (%)": financialMetrics.netMargin,
                "Total Expenses ($)": financialMetrics.totalExpenses,
                "Optimization Action": "Active Sale & Margin Logged"
            }
        };

        await axios.put(`${TASKADE_API_BASE}/projects/${projectId}/tasks/${rowId}`, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('❌ Taskade API Update Failed:', error.response?.data || error.message);
    }
}

async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
        const dataObject = event.data.object;
        const grossSales = dataObject.amount_total ? dataObject.amount_total / 100 : dataObject.amount / 100;
        const customerEmail = dataObject.customer_details?.email || dataObject.receipt_email || 'N/A';

        const wholesaleCOGS = parseFloat(dataObject.metadata?.wholesale_cost || '12.50');
        const shippingCost = parseFloat(dataObject.metadata?.shipping_cost || '4.00');

        const financialMetrics = calculateNetProfit(grossSales, wholesaleCOGS, shippingCost);
        await updateTaskadeBIRow(financialMetrics, customerEmail);

        try {
            const lineItems = [{ sku: dataObject.metadata?.sku || 'DEFAULT-SKU', quantity: 1 }];
            await fulfillOrderWithZendrop(dataObject, lineItems);
        } catch (fulfillmentError) {
            console.error('❌ Zendrop fulfillment dispatch error:', fulfillmentError.message);
        }
    }

    res.status(200).json({ received: true });
}

module.exports = { handleStripeWebhook, updateTaskadeBIRow };
