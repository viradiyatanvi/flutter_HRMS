const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const { authenticateJWT } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for user maintenance attachments
const maintenanceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../Uploads/Maintenance');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `maintenance-${uniqueSuffix}-${file.originalname}`);
  }
});

const uploadMaintenance = multer({
  storage: maintenanceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).array('attachments', 5);

// Get assets allocated to current user
router.get('/my-assets', authenticateJWT, async (req, res) => {
  try {
    const assets = await Asset.find({
      allocatedTo: req.user._id,
      isActive: true
    })
      .populate('allocatedTo', 'firstName lastName email')
      .sort({ allocationDate: -1 });

    res.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error('Error fetching user assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your assets',
      error: error.message
    });
  }
});

// Report maintenance issue
router.post('/maintenance', authenticateJWT, uploadMaintenance, async (req, res) => {
  try {
    const { assetId, issueType, issueDescription, priority } = req.body;

    // Verify the asset is allocated to the user
    const asset = await Asset.findOne({
      _id: assetId,
      allocatedTo: req.user._id,
      isActive: true
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found or not allocated to you'
      });
    }

    const maintenanceData = {
      asset: assetId,
      reportedBy: req.user._id,
      createdBy: req.user._id,
      issueType,
      issueDescription,
      priority: priority || 'Medium'
    };

    if (req.files && req.files.length > 0) {
      maintenanceData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path
      }));
    }

    const maintenance = new Maintenance(maintenanceData);
    await maintenance.save();

    // Update asset status to under maintenance
    await Asset.findByIdAndUpdate(assetId, {
      currentStatus: 'Under Maintenance'
    });

    await maintenance.populate('asset', 'assetName assetId');

    res.status(201).json({
      success: true,
      message: 'Maintenance issue reported successfully',
      maintenance
    });
  } catch (error) {
    console.error('Error reporting maintenance issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting maintenance issue',
      error: error.message
    });
  }
});

// Get maintenance history for user's assets
router.get('/my-maintenance', authenticateJWT, async (req, res) => {
  try {
    const userAssets = await Asset.find({
      allocatedTo: req.user._id,
      isActive: true
    }).select('_id');

    const assetIds = userAssets.map(asset => asset._id);

    const maintenance = await Maintenance.find({
      asset: { $in: assetIds }
    })
      .populate('asset', 'assetName assetId serialNumber')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      maintenance
    });
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance history',
      error: error.message
    });
  }
});

// Get maintenance details by ID
router.get('/maintenance/:id', authenticateJWT, async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('asset', 'assetName assetId serialNumber allocatedTo')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reportedBy', 'firstName lastName email');

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // Check if the maintenance record belongs to user's asset
    if (maintenance.asset.allocatedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this maintenance record'
      });
    }

    res.json({
      success: true,
      maintenance
    });
  } catch (error) {
    console.error('Error fetching maintenance details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance details',
      error: error.message
    });
  }
});

module.exports = router;