const path = require('path');
const os = require('os');
const fs = require('fs');

class ImageProcessor {

    /**
     * コンストラクタ
     * 
     * @param {*} admin 
     * @param {*} client 
     * @param {*} cloudinary 
     */
    constructor(admin, client, cloudinary) {
        this.firebaseAdmin = admin;
        this.lineClient = client;
        this.cloudinary = cloudinary;
    }

    async saveImageContent(event) {
        const imagePath = await this.getLineImageContent(event.message.id);
        const [file, metadata] = await this.uploadImageContent(imagePath);
        await this.saveMessageInfo(event, file.name);
        console.log(JSON.stringify("画像のアップロード終了"));
        return this.lineClient.replyMessage(event.replyToken, {
            type: 'text',
            text: '画像をアップロードしました'
        })
    }

    async getLineImageContent(messageId) {
        const ext = '.jpg';
        const tmpPath = path.join(os.tmpdir(), messageId + ext);
        const stream = await this.lineClient.getMessageContent(messageId)
        return new Promise((resolve, reject) => {
            const writable = fs.createWriteStream(tmpPath);
            stream.pipe(writable);
            stream.on('end', () => {
                resolve(tmpPath);
            });
            stream.on('error', reject);
        });
    }

    async uploadImageContent(imagePath) {
        const cloudinaryInfo = await this.uploadImageToCloudinary(imagePath);
        await this.firebaseAdmin.database().ref("/cloudinary").push(cloudinaryInfo);
        return this.firebaseAdmin.storage().bucket().upload(imagePath);
    }

    saveMessageInfo(info, image) {
        var savedInfo = {
            source: info.source,
            timestamp: info.timestamp,
            image: image,
        }
        return this.firebaseAdmin.database().ref('/messages').push(savedInfo);
    }

    uploadImageToCloudinary(imagePath) {
        return new Promise((resolve, reject) => {
            this.cloudinary.v2.uploader.upload(imagePath, (err, result) => {
                if (err) return reject(err);
                return resolve(result);
            });
        });
    }
}
module.exports = ImageProcessor;