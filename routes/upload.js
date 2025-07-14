const express = require('express');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const Vendor = require('../models/Vendor');
const Project = require('../models/Project');

const router = express.Router();

// Upload vendor documents
router.post('/vendor/:id/documents', auth, upload.array('documents', 5), async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const documents = req.files.map(file => ({
      name: file.originalname,
      type: req.body.type || 'other',
      url: `/uploads/vendors/${file.filename}`,
      uploadDate: new Date()
    }));

    vendor.documents.push(...documents);
    await vendor.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: documents
    });

  } catch (error) {
    console.error('Upload vendor documents error:', error);
    res.status(500).json({ message: 'Server error while uploading documents' });
  }
});

// Upload project documents
router.post('/project/:id/documents', auth, upload.array('documents', 5), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const documents = req.files.map(file => ({
      name: file.originalname,
      type: req.body.type || 'other',
      url: `/uploads/projects/${file.filename}`,
      uploadDate: new Date()
    }));

    project.documents.push(...documents);
    await project.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: documents
    });

  } catch (error) {
    console.error('Upload project documents error:', error);
    res.status(500).json({ message: 'Server error while uploading documents' });
  }
});

// Upload quote documents for vendor in project
router.post('/project/:projectId/vendor/:vendorId/quote', auth, upload.array('documents', 3), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const vendorLink = project.linkedVendors.find(
      link => link.vendor.toString() === req.params.vendorId
    );

    if (!vendorLink) {
      return res.status(404).json({ message: 'Vendor not linked to this project' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const documents = req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/projects/${file.filename}`,
      uploadDate: new Date()
    }));

    if (!vendorLink.quote) {
      vendorLink.quote = {};
    }
    if (!vendorLink.quote.documents) {
      vendorLink.quote.documents = [];
    }

    vendorLink.quote.documents.push(...documents);
    await project.save();

    res.json({
      message: 'Quote documents uploaded successfully',
      documents: documents
    });

  } catch (error) {
    console.error('Upload quote documents error:', error);
    res.status(500).json({ message: 'Server error while uploading quote documents' });
  }
});

// Upload user avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'File must be an image' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user avatar
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error while uploading avatar' });
  }
});

// Delete document
router.delete('/document', auth, async (req, res) => {
  try {
    const { documentUrl, type, entityId } = req.body;

    if (!documentUrl || !type || !entityId) {
      return res.status(400).json({ message: 'Document URL, type, and entity ID are required' });
    }

    // Extract filename from URL
    const filename = path.basename(documentUrl);
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove document reference from database
    if (type === 'vendor') {
      await Vendor.findByIdAndUpdate(entityId, {
        $pull: { documents: { url: documentUrl } }
      });
    } else if (type === 'project') {
      await Project.findByIdAndUpdate(entityId, {
        $pull: { documents: { url: documentUrl } }
      });
    }

    res.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error while deleting document' });
  }
});

// Get file
router.get('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(path.resolve(filePath));

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Server error while retrieving file' });
  }
});

// Error handling middleware for multer
router.use(handleMulterError);

module.exports = router;
