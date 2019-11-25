const functions = require("firebase-functions");
const line = require("@line/bot-sdk");
const cloudinary = require("cloudinary");

const admin = require("firebase-admin");
admin.initializeApp();

const config = {
    channelAccessToken: functions.config().line.channel_access_token,
    channelSecret: functions.config().line.channel_secret
};

const client = new line.Client(config);

exports.line = functions
    .region("asia-northeast1")
    .https.onRequest(async (request, response) => {
        try {
            const result = await Promise.all(request.body.events.map(handleEvent));
            response.json(result);
        } catch (err) {
            console.error(err);
            response.status(500).end;
        }
    });

cloudinary.config({
    cloud_name: functions.config().cloudinary.cloud_name,
    api_key: functions.config().cloudinary.api_key,
    api_secret: functions.config().cloudinary.api_secret,
})

const TextMessageProcessor = require("./text");
const textMessageProcessor = new TextMessageProcessor(admin, client);
const ImageProcessor = require("./image");
const imageProcessor = new ImageProcessor(admin, client, cloudinary);

/**
 * Lineからのメッセージ処理
 * @param {} event
 */
function handleEvent(event) {
    console.log(JSON.stringify(event));
    if (event.type !== "message") {
        return Promise.resolve(null);
    }

    const messageType = event.message.type;
    console.log(messageType)
    if (messageType === 'text') {
        return textMessageProcessor.saveAndReplyTextMessage(event);
    } else if (messageType === 'image') {
        return imageProcessor.saveImageContent(event);
    } else {
        console.log(JSON.stringify("Null"));
        return this.lineClient.replyMessage(event.replyToken, {
            type: 'text',
            text: '形式がマッチしていないか何らかのエラーです'
        })
    }

}