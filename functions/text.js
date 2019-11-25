class TextMessageProcessor {
    constructor(admin, client) {
        this.firebaseAdmin = admin;
        this.lineClient = client;
    }

    async saveAndReplyTextMessage(event) {
        await this.saveTextMessage(event);
        return this.replyTextMessage(event);
    }

    saveTextMessage(event) {
        const info = {
            source: event.source,
            timestamp: event.timestamp,
            message: event.message
        }
        return this.firebaseAdmin.database().ref("/texts").push(info);
    }

    replyTextMessage(event) {
        // create a echoing text message
        const echo = {
            type: 'text',
            text: event.message.text
        };
        // use reply API
        return this.lineClient.replyMessage(event.replyToken, echo);
    }
}
module.exports = TextMessageProcessor;