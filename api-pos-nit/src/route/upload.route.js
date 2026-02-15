// api-pos-nit/src/route/upload.route.js
const multer = require('multer');
const { validate_token } = require("../controller/auth.controller");
const { storage, deleteImage } = require('../config/cloudinary');

module.exports = (app) => {
  // Configure multer with Cloudinary storage
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  });

  // Upload single image
  app.post('/api/upload', validate_token(), upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: true,
          message: 'No file uploaded'
        });
      }

      res.json({
        error: false,
        message: 'Image uploaded successfully',
        data: {
          imageUrl: req.file.path,        // This is already using path (Cloudinary URL)
          filename: req.file.filename,    // Map to filename for generic compatibility
          publicId: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          format: req.file.format
        }
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to upload image',
        details: error.message
      });
    }
  });

  // Upload multiple images
  app.post('/api/upload-multiple', validate_token(), upload.array('images', 10), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: true,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = req.files.map(file => ({
        imageUrl: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        format: file.format
      }));

      res.json({
        error: false,
        message: `${req.files.length} images uploaded successfully`,
        data: uploadedFiles
      });

    } catch (error) {
      console.error('❌ Multiple upload error:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to upload images',
        details: error.message
      });
    }
  });

  // Delete image
  app.delete('/api/upload/:publicId', validate_token(), async (req, res) => {
    try {
      const { publicId } = req.params;

      // Decode publicId (it might be URL encoded)
      const decodedPublicId = decodeURIComponent(publicId);

      const result = await deleteImage(decodedPublicId);

      if (result.result === 'ok') {
        res.json({
          error: false,
          message: 'Image deleted successfully',
          data: result
        });
      } else {
        res.status(404).json({
          error: true,
          message: 'Image not found or already deleted'
        });
      }

    } catch (error) {
      console.error('❌ Delete error:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to delete image',
        details: error.message
      });
    }
  });

  // Get image URL with transformations
  app.get('/api/image/:publicId', validate_token(), (req, res) => {
    try {
      const { publicId } = req.params;
      const { width, height, crop } = req.query;

      const transformation = [];
      if (width || height) {
        transformation.push({
          width: parseInt(width) || undefined,
          height: parseInt(height) || undefined,
          crop: crop || 'limit'
        });
      }

      const imageUrl = getImageUrl(publicId, { transformation });

      res.json({
        error: false,
        data: {
          originalUrl: imageUrl,
          thumbnailUrl: getImageUrl(publicId, {
            transformation: [{ width: 200, height: 200, crop: 'fill' }]
          })
        }
      });

    } catch (error) {
      console.error('❌ Get image error:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to get image URL',
        details: error.message
      });
    }
  });
};
