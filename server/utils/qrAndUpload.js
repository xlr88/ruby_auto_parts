const cloudinary = require('./cloudinary'); // Import the already configured cloudinary
const QRCode = require('qrcode');

const generateQrCodeAndUpload = async (data) => {
  try {
    const qrCodeImageBuffer = await QRCode.toBuffer(data, { type: 'png' });

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'qrcodes' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result.secure_url);
        }
      ).end(qrCodeImageBuffer);
    });
  } catch (error) {
    console.error('Error generating QR code or uploading to Cloudinary:', error);
    throw new Error('Failed to generate QR code or upload.');
  }
};

module.exports = { generateQrCodeAndUpload };
