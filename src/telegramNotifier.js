const axios = require('axios');

async function sendTelegramAlert(errorTitle, errorObject, additionalMetadata = {}) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;

    const timestamp = new Date().toISOString();
    const errorMessage = errorObject instanceof Error ? errorObject.message : String(errorObject);

    const telegramMessage = `🚨 *SYSTEM ALERT*\n*Event:* ${errorTitle}\n*Time:* \`${timestamp}\`\n*Error:* ${errorMessage}`;

    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: 'Markdown'
        });
    } catch (telegramError) {
        console.error('❌ Failed to send Telegram notification:', telegramError.message);
    }
}

module.exports = { sendTelegramAlert };
