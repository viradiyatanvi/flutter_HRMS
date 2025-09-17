const mongoose=require('mongoose')
const multer=require('multer');
const path=require('path')
const ImagePath='/Uploads/Certificate'
const certificateSchema=mongoose.Schema({
    courseId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Courses',
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    certificateUrl:{
        type:String,
        required:true
    },
    issueDate:{
        type:Date,
        default:Date.now
    },
    verified:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

const storageImage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'..',ImagePath))
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+'-'+Date.now())
    }
})
certificateSchema.statics.uploadImageFile=multer({storage:storageImage}).single('certificateUrl')
certificateSchema.statics.ImgPath=ImagePath

module.exports=mongoose.model('Certificate',certificateSchema)