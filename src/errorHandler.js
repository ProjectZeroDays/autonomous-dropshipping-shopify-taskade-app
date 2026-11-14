const { sendTelegramAlert } = require('./telegramNotifier');

function initializeGlobalErrorListeners() {
    process.on('uncaughtException', async (error) => {
        console.error('💥 FATAL EXCEPTION:', error);
        await sendTelegramAlert('CRITICAL: Uncaught Exception', error);
        setTimeout(() => process.exit(1), 1000);
    });

    process.on('unhandledRejection', async (reason) => {
        console.error('⚠️ UNHANDLED REJECTION:', reason);
        const errorObj = reason instanceof Error ? reason : new Error(String(reason));
        await sendTelegramAlert('WARNING: Unhandled Promise Rejection', errorObj);
    });
}

module.exports = { initializeGlobalErrorListeners };
