require('dotenv').config();
const express = require('express');
const { handleStripeWebhook } = require('./stripeHandler');
const { handleShopifyWebhook } = require('./shopifyHandler');
const { commitFileToGitHub } = require('./taskadeToGitHub');
const { initializeGlobalErrorListeners } = require('./errorHandler');

initializeGlobalErrorListeners();

const app = express();

app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.post('/webhook/shopify', express.raw({ type: 'application/json' }), handleShopifyWebhook);

app.post('/webhook/taskade', express.json(), async (req, res) => {
    try {
        const taskadeEvent = req.body;
        const rowData = taskadeEvent.data || taskadeEvent;
        const rowId = rowData.id || 'sync-state';
        const filePath = `data/taskade-sync-${rowId}.json`;
        
        const fileContent = JSON.stringify({
            syncedAt: new Date().toISOString(),
            source: "Taskade Autonomous Agent",
            data: rowData
        }, null, 2);

        await commitFileToGitHub(
            filePath,
            fileContent,
            `chore(taskade): auto-sync database row ${rowId}`
        );

        res.status(200).json({ received: true, committed: true });
    } catch (error) {
        console.error('❌ Failed to process Taskade webhook:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Worker process ${process.pid} started on port ${PORT}`);
        if (process.send) process.send('ready');
    });
}
