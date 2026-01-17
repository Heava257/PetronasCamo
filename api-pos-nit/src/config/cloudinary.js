// api-pos-nit/src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'petronas-products', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [
      { 
        width: 1200, 
        height: 1200, 
        crop: 'limit', // Don't exceed dimensions
        quality: 'auto:good' // Automatic quality optimization
      }
    ],
    public_id: (req, file) => {
      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `${originalName}-${timestamp}`;
    }
  }
});

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Image deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    throw error;
  }
};

// Function to get Cloudinary URL
const getImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: options.transformation || [],
    ...options
  });
};

module.exports = {
  cloudinary,
  storage,
  deleteImage,
  getImageUrl
};