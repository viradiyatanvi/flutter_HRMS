const express = require('express');
const routes = express.Router();
const Courses = require('../models/CourseModel');
const { authenticateJWT } = require('../middleware/auth');
const path=require('path');
const fs=require('fs');
const User = require('../models/User');
const Enrollement = require('../models/EnrollementModel');
const Certificate = require('../models/CertificateModel');

// Admin
// addCourse
routes.post('/admin/addcourse', authenticateJWT,Courses.uploadImageFile, async (req, res) => {
    try {
        // console.log("hello", req.body); 

        const { title, description, duration, level } = req.body;

        if (!title || !description || !duration ) {
            return res.status(400).json({ msg: 'Invalid request body' });
        }
//  cover image
    const image=req.files['image'] ? Courses.ImgPath+'/'+req.files['image'][0].filename :'';
// content [pdf/video/image]
    const content = req.files['content'] ? req.files['content'].map(file => ({
            title: file.originalname,
            type: file.mimetype.includes('pdf') ? 'pdf' :
                  file.mimetype.includes('video') ? 'video' : 'other',
            url: Courses.ImgPath + '/' + file.filename,
            uploadedAt: new Date()
        })) : [];
        // add data
        const course = await Courses.create({
            title,
            description,
            duration,
            content,
            image ,
            level: level || 'Beginner',
            createdBy: req.user._id
        });

        return res.status(201).json({ msg: 'Added Successfully', data: course });
    } catch (err) {
        console.error(err);
      return res.status(500).json({ msg: 'Course Add Error', err });
    }
});
// delete Courses
routes.delete('/admin/deleteCourse/:id', authenticateJWT, async (req, res) => {
    try {
        const delId = req.params.id;
        const course = await Courses.findById(delId);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // Delete image file
        if (course.image) {
            const delPath = path.join(__dirname, '..', course.image);
            if (fs.existsSync(delPath)) fs.unlinkSync(delPath);
        }

        // Delete content files if multiple
        if (course.content && course.content.length > 0) {
            course.content.forEach(item => {
                const filePath = path.join(__dirname, '..', item.url);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }

        await Courses.findByIdAndDelete(delId);

        res.status(200).json({ msg: 'Course deleted successfully' });
    } catch (err) {
        console.error(err);
      res.status(500).json({ msg: 'Delete error', err });
    }
});
//update Course
routes.get('/admin/editCourse/:id',authenticateJWT,async(req,res)=>{
    try{
        let findData=await Courses.findById(req.params.id);
        // console.log(findData)
        return res.status(200).json({msg:'edit Data',data:findData})
    }catch(err){
        console.log(err)
    return res.status(500).json({msg:'edit page err',err:err})
    }
})
routes.put("/admin/updateCourse/:id",authenticateJWT,Courses.uploadImageFile,async (req, res) => {
    try {
      let findCourse = await Courses.findById(req.params.id);
      if (!findCourse) {
        return res.status(404).json({ msg: "Course not found" });
      }

      if (req.files) {
        // image update
        if (req.files.image) {
          try {
            if (findCourse.image) {
              const delPath = path.join(__dirname, "..", findCourse.image);
              if (fs.existsSync(delPath)) fs.unlinkSync(delPath);
            }
          } catch (err) {
            return res
             .status(200)
              .json({ msg: "Image Delete Error", data: err });
          }
          req.body.image = Courses.ImgPath + "/" + req.files.image[0].filename;
        }

        // content update
        if (req.files.content) {
          // purana content delete
          if (findCourse.content && findCourse.content.length > 0) {
            findCourse.content.forEach((item) => {
              const filePath = path.join(__dirname, "..", item.url);
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
          }

          // naya content add karo
          req.body.content = req.files.content.map((file) => ({
            title: req.body.contentTitle || "Untitled",
            type: req.body.contentType || "other",
            url: Courses.ImgPath + "/" + file.filename,
            uploadedAt: new Date(),
          }));
        }
      } else {
        // agar koi naya file nahi aaya to purana hi use karo
        req.body.image = findCourse.image;
        req.body.content = findCourse.content;
      }

      // ab update karo
      let updateData = await Courses.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      return res
        .status(200)
        .json({ msg: "Course updated successfully", data: updateData });
    } catch (err) {
      console.error(err);
  return res.status(500).json({ msg: "Update Err", err: err });
    }
  }
);
// allCourses
routes.get('/admin/allCourse',authenticateJWT,async(req,res)=>{
    try{
        let findCourse=await Courses.find();
        return res.status(200).json({msg:'All Courses',data:findCourse})
    }catch(err){
        return res.status(500).json({msg:'allCousrse page err',err:err})
    }
})
// enrolle user kon kis course me enrolle 
routes.get('/admin/enroll',authenticateJWT,async(req,res)=>{
    try{
        let AllEnroll=await Enrollement.find().populate('courseId').populate('userId');
    return res.status(200).json({msg:'all Enrollment',data:AllEnroll})
    }catch(err){
        return res.status(500).json({msg:'Enroll page err',err:err})
    }
})
// Create Certificate
routes.post('/admin/certificate/:userId/:courseId',authenticateJWT,Certificate.uploadImageFile,async(req,res)=>{
    try{
            let enrollment=await Enrollement.findOne({
                userId:req.params.userId,
                courseId:req.params.courseId
            })
            if(!enrollment  || enrollment.status !=='Completed'){
                return res.status(200).json({msg:'course Not completed Yet ,certificate not allowed'})
            }

            let newImg='';
            if(req.file){
                newImg=await Certificate.ImgPath+'/'+req.file.filename
            }
            req.body.certificateUrl=newImg
            let createCertificate=await Certificate.create({
                userId:req.params.userId,
                courseId:req.params.courseId,
                certificateUrl:newImg,
            })
        return res.status(200).json({msg:'Certificate Added Successfully',data:createCertificate})
    }catch(err){
        return res.status(500).json({msg:'Certificate Page Err',err:err})
    }
})
//certificate Verifiy agar verified false he to true karga
routes.put('/admin/verifiy/:id',authenticateJWT,async(req,res)=>{
    try{
            let certiId=req.params.id;
            let certificate=await Certificate.findById(certiId)
            certificate.verified=req.body.verified === true || req.body.verified === 'true';
            await certificate.save();
            return res.status(200).json({msg:'Verifiy successfully',data:certificate})
    }catch(err){
        return res.status(500).json({msg:'Cerificate Vrified Err',err:err})
    }
})
//report course
routes.get('/admin/report',authenticateJWT,async(req,res)=>{
    try{
        let totalCourses=await Courses.countDocuments();
        let totalEnrollement=await Enrollement.countDocuments();
        let completed=await Enrollement.countDocuments({status:'Completed'});
        let InProgress=await Enrollement.countDocuments({status:'In-Progress'});
        return res.status(200).json({msg:'All Report',data:{totalCourses,totalEnrollement,completed,InProgress}})

    }catch(err){
        console.log(err)
    return res.status(500).json({msg:'report page err',err:err})
    }
})
// Courses IsActive or not
routes.put('/admin/status/:id',authenticateJWT,async(req,res)=>{
    try{
        let courseId=req.params.id;
        let findCourse=await Courses.findById(courseId);
        findCourse.isActive= !findCourse.isActive;
        await findCourse.save();
        return res.status(200).json({msg:'Course Is Active',data:findCourse})
    }catch(err){
        return res.status(500).json({msg:'Course Active/InActive err',err:err})
    }
})
// user
// view Courses
routes.get('/user/viewCourse',authenticateJWT,async(req,res)=>{
    try{
            let findCourse=await Courses.find()
            return res.status(200).json({msg:'All Courses',data:findCourse})
    }catch(err){
        console.log(err)
    return res.status(500).json({msg:'View Course Page Err',err:err})
    }
})
// enroll
routes.post('/user/enroll/:courseId',authenticateJWT,async(req,res)=>{
    try{
        const courseId=req.params.courseId;
        const userId=req.user._id;
        const checkCourse=await Courses.findById(courseId)

        const existing=await Enrollement.findOne({userId,courseId})
        if(existing){
            return res.status(200).json({msg:'Already enrolled in this Courses'})
        }

        const enroll=await Enrollement.create({
            userId,
            courseId,
            enrollDate:new Date(),
            status:req.body.status || 'Enrolled'
        })
      
        return res.status(200).json({msg:'Enrollement created Successfully',data:enroll})
    }catch(err){
        return res.status(500).json({msg:'Enroll err',err:err})
    }
})
//My Progress
routes.get('/user/progress/:courseId',authenticateJWT,async(req,res)=>{
    try{
        const courseId=req.params.courseId;
        const userId=req.user._id;
        let findMyProgress=await Enrollement.findOne({courseId,userId});
        return res.status(200).json({msg:'My Progress',
                                 data:{progress:findMyProgress.progress,
                                        status:findMyProgress.status,
                                        completedContent:findMyProgress.completedContent
                                    }})
    }catch(err){
        return res.status(500).json({msg:'progress err',err:err})
    }
})
// Progress % updates
routes.put("/user/completdContent/:courseId/:contentId",authenticateJWT,async(req,res)=>{
try{
        const {courseId,contentId}=req.params;
    let userId=req.user._id
    let course=await Courses.findById(courseId);
    let enrollment=await Enrollement.findOne({userId,courseId});

    if(!enrollment.completedContent.includes(contentId)){
        enrollment.completedContent.push(contentId)
    }
    //calculate progress bar
    let total=course.content.length;
    const completed=enrollment.completedContent.length;
    enrollment.progress=Math.round((completed/total)*100);

    if(enrollment.progress>=100){
        enrollment.status='Completed'
    }else if(enrollment.progress>0){
        enrollment.status='In-Progress'
    }else{
        enrollment.status='Enrolled'
    }
    await enrollment.save();
    return res.status(200).json({msg:'Progress bar',data:enrollment})
}catch(err){
    console.log(err)
return res.status(500).json({msg:'Progress page err',err:err})
}
})
//My Course
routes.get('/user/myCourse',authenticateJWT,async(req,res)=>{
    try{
        let myCourses=await Enrollement.find({userId:req.user._id}).populate('courseId');
    return res.status(200).json({msg:'My Course',data:myCourses})
    }catch(err){
        return res.status(500).json({msg:'my course page err',err:err})
    }
})
// My Enrollement
routes.get('/user/myEnroll/:id',authenticateJWT,async(req,res)=>{
    try{
        let findMyEnroll=await Enrollement.findById(req.params.id)
        return res.status(200).json({msg:'My Enrolle',data:findMyEnroll})
    }catch(err){
        return res.status(500).json({msg:'My Enroll Page Error',err:err})
    }
})
// My Certificate
routes.get('/user/MyCertificate/:courseId',authenticateJWT,async(req,res)=>{
    try{
        let findMyCertificate=await Certificate.findOne({courseId:req.params.courseId,userId:req.user._id}).populate('courseId').populate('userId')
        return res.status(200).json({msg:'My Certificte',data:findMyCertificate})
    }catch(err){
        return res.status(500).json({msg:'MyCertificate Page Err',err:err})
    }
})
module.exports = routes;