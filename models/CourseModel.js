const mongoose=require('mongoose')
// Course
const multer=require('multer');
const path=require('path')
const ImagePath='/Uploads/Course'
const courseSchema=mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:String,//ex:-3 Hourse
        required:true
    },
      content: [{
        title: { type: String, required: true },
        type: { type: String, enum: ['pdf','video','quiz','other'], required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    image:{
        type:String,
        defaul:''
    },
    level:{
        type:String,
        enum:['Beginner','Intermediate','Advanced'],
        default:'Beginner'
    },
    isactive:{
        type:Boolean,
        default:true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
},{timestamps:true})

const storageImage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'..',ImagePath))
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+'-'+Date.now())
    }
})

courseSchema.statics.uploadImageFile=multer({storage:storageImage}).fields([
    {name:'image',maxCount:'1'},
    {name:'content',maxCount:10}
])
courseSchema.statics.ImgPath=ImagePath

module.exports=mongoose.model('Courses',courseSchema)