const mongoose=require('mongoose');

const multer=require('multer');
const path=require('path')
const ImagePath='/Uploads/Items'
const exprenseItemsSchema=mongoose.Schema({
    claimId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'ExpenseClaim'
    },
    type:{
        type:String,
        enum:['Food','Travel','Accommodation','Other'],
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
     date:{
        type:Date,
        default:Date.now
    },
     description:{
        type:String,
        required:true
    },
    billUrl:{
        type:String,
        // required:true
    },
},{timestamps:true})

// const storageImage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = path.join(__dirname, '..', ImagePath);
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, 'bill-' + Date.now() + ext);
//   }
// });

const storageImage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', ImagePath);
    console.log('Upload directory:', dir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Created directory:', dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = 'bill-' + Date.now() + ext;
    console.log('Saving file as:', filename);
    cb(null, filename);
  }
});

// Add file filter to see what's being uploaded
const fileFilter = (req, file, cb) => {
  console.log('File received:', file);
  console.log('Field name:', file.fieldname);
  cb(null, true);
};

exprenseItemsSchema.statics.uploadImageFile = multer({
  storage: storageImage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('billImage');


exprenseItemsSchema.statics.uploadImageFile=multer({storage:storageImage}).single('billUrl')

exprenseItemsSchema.statics.ImgPath=ImagePath


module.exports=mongoose.model('ExpenseItems',exprenseItemsSchema)