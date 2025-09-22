


// const mongoose = require('mongoose');
// const multer = require('multer');
// const path = require('path');

// const ImagePath = '/Uploads/Course';

// const courseSchema = mongoose.Schema({
//     title: {
//         type: String,
//         required: true
//     },
//     description: {
//         type: String,
//         required: true
//     },
//     duration: {
//         type: String, // ex: 3 Hours
//         required: true
//     },
//     content: [{
//         title: { type: String, required: true },
//         type: { type: String, enum: ['pdf', 'video', 'quiz', 'other'], required: true },
//         url: { type: String, required: true },
//         uploadedAt: { type: Date, default: Date.now }
//     }],
//     image: {
//         type: String,
//         default: ''
//     },
//     level: {
//         type: String,
//         enum: ['Beginner', 'Intermediate', 'Advanced'],
//         default: 'Beginner'
//     },
//     isActive: { // FIXED: was 'isactive'
//         type: Boolean,
//         default: true
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//     },
// }, { timestamps: true });

// const storageImage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(__dirname, '..', ImagePath));
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });

// courseSchema.statics.uploadImageFile = multer({
//     storage: storageImage,
//     limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
//     fileFilter: (req, file, cb) => {
//         if (file.fieldname === 'image') {
//             if (file.mimetype.startsWith('image/')) {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Only image files are allowed for course image'));
//             }
//         } else if (file.fieldname === 'content') {
//             const allowedTypes = ['application/pdf', 'video/mp4', 'video/avi', 'video/mov', 'image/jpeg', 'image/png'];
//             if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Only PDF, video, and image files are allowed for content'));
//             }
//         } else {
//             cb(new Error('Unexpected field'));
//         }
//     }
// }).fields([
//     { name: 'image', maxCount: 1 },
//     { name: 'content', maxCount: 10 }
// ]);

// courseSchema.statics.ImgPath = ImagePath;

// module.exports = mongoose.model('Courses', courseSchema);


const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const ImagePath = '/Uploads/Course';

const courseSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    content: [{
        title: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'video', 'quiz', 'other'], required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    image: {
        type: String,
        default: ''
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

const storageImage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', ImagePath));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

courseSchema.statics.uploadImageFile = multer({
    storage: storageImage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'image') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for course image'));
            }
        } else if (file.fieldname === 'content') {
            const allowedTypes = [
                'application/pdf', 
                'video/mp4', 'video/avi', 'video/mov', 'video/quicktime',
                'image/jpeg', 'image/png', 'image/gif'
            ];
            if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only PDF, video, and image files are allowed for content'));
            }
        } else {
            cb(new Error('Unexpected field'));
        }
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'content', maxCount: 10 }
]);

courseSchema.statics.ImgPath = ImagePath;

module.exports = mongoose.model('Courses', courseSchema);