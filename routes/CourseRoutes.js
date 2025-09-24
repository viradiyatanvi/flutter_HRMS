// const express = require('express');
// const routes = express.Router();
// const Courses = require('../models/CourseModel');
// const { authenticateJWT } = require('../middleware/auth');
// const path=require('path');
// const fs=require('fs');
// const User = require('../models/User');
// const Enrollement = require('../models/EnrollementModel');
// const Certificate = require('../models/CertificateModel');

// // Admin
// // addCourse
// routes.post('/admin/addcourse', authenticateJWT,Courses.uploadImageFile, async (req, res) => {
//     try {
//         // console.log("hello", req.body); 

//         const { title, description, duration, level } = req.body;

//         if (!title || !description || !duration ) {
//             return res.status(400).json({ msg: 'Invalid request body' });
//         }
// //  cover image
//     const image=req.files['image'] ? Courses.ImgPath+'/'+req.files['image'][0].filename :'';
// // content [pdf/video/image]
//     const content = req.files['content'] ? req.files['content'].map(file => ({
//             title: file.originalname,
//             type: file.mimetype.includes('pdf') ? 'pdf' :
//                   file.mimetype.includes('video') ? 'video' : 'other',
//             url: Courses.ImgPath + '/' + file.filename,
//             uploadedAt: new Date()
//         })) : [];
//         // add data
//         const course = await Courses.create({
//             title,
//             description,
//             duration,
//             content,
//             image ,
//             level: level || 'Beginner',
//             createdBy: req.user._id
//         });

//         return res.status(201).json({ msg: 'Added Successfully', data: course });
//     } catch (err) {
//         console.error(err);
//       return res.status(500).json({ msg: 'Course Add Error', err });
//     }
// });
// // delete Courses
// routes.delete('/admin/deleteCourse/:id', authenticateJWT, async (req, res) => {
//     try {
//         const delId = req.params.id;
//         const course = await Courses.findById(delId);
//         if (!course) return res.status(404).json({ msg: 'Course not found' });

//         // Delete image file
//         if (course.image) {
//             const delPath = path.join(__dirname, '..', course.image);
//             if (fs.existsSync(delPath)) fs.unlinkSync(delPath);
//         }

//         // Delete content files if multiple
//         if (course.content && course.content.length > 0) {
//             course.content.forEach(item => {
//                 const filePath = path.join(__dirname, '..', item.url);
//                 if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//             });
//         }

//         await Courses.findByIdAndDelete(delId);

//         res.status(200).json({ msg: 'Course deleted successfully' });
//     } catch (err) {
//         console.error(err);
//       res.status(500).json({ msg: 'Delete error', err });
//     }
// });
// //update Course
// routes.get('/admin/editCourse/:id',authenticateJWT,async(req,res)=>{
//     try{
//         let findData=await Courses.findById(req.params.id);
//         // console.log(findData)
//         return res.status(200).json({msg:'edit Data',data:findData})
//     }catch(err){
//         console.log(err)
//     return res.status(500).json({msg:'edit page err',err:err})
//     }
// })
// routes.put("/admin/updateCourse/:id",authenticateJWT,Courses.uploadImageFile,async (req, res) => {
//     try {
//       let findCourse = await Courses.findById(req.params.id);
//       if (!findCourse) {
//         return res.status(404).json({ msg: "Course not found" });
//       }

//       if (req.files) {
//         // image update
//         if (req.files.image) {
//           try {
//             if (findCourse.image) {
//               const delPath = path.join(__dirname, "..", findCourse.image);
//               if (fs.existsSync(delPath)) fs.unlinkSync(delPath);
//             }
//           } catch (err) {
//             return res
//              .status(200)
//               .json({ msg: "Image Delete Error", data: err });
//           }
//           req.body.image = Courses.ImgPath + "/" + req.files.image[0].filename;
//         }

//         // content update
//         if (req.files.content) {
//           // purana content delete
//           if (findCourse.content && findCourse.content.length > 0) {
//             findCourse.content.forEach((item) => {
//               const filePath = path.join(__dirname, "..", item.url);
//               if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//             });
//           }

//           // naya content add karo
//           req.body.content = req.files.content.map((file) => ({
//             title: req.body.contentTitle || "Untitled",
//             type: req.body.contentType || "other",
//             url: Courses.ImgPath + "/" + file.filename,
//             uploadedAt: new Date(),
//           }));
//         }
//       } else {
//         // agar koi naya file nahi aaya to purana hi use karo
//         req.body.image = findCourse.image;
//         req.body.content = findCourse.content;
//       }

//       // ab update karo
//       let updateData = await Courses.findByIdAndUpdate(
//         req.params.id,
//         req.body,
//         { new: true }
//       );

//       return res
//         .status(200)
//         .json({ msg: "Course updated successfully", data: updateData });
//     } catch (err) {
//       console.error(err);
//   return res.status(500).json({ msg: "Update Err", err: err });
//     }
//   }
// );
// // allCourses
// routes.get('/admin/allCourse',authenticateJWT,async(req,res)=>{
//     try{
//         let findCourse=await Courses.find();
//         return res.status(200).json({msg:'All Courses',data:findCourse})
//     }catch(err){
//         return res.status(500).json({msg:'allCousrse page err',err:err})
//     }
// })
// // enrolle user kon kis course me enrolle 
// routes.get('/admin/enroll',authenticateJWT,async(req,res)=>{
//     try{
//         let AllEnroll=await Enrollement.find().populate('courseId').populate('userId');
//     return res.status(200).json({msg:'all Enrollment',data:AllEnroll})
//     }catch(err){
//         return res.status(500).json({msg:'Enroll page err',err:err})
//     }
// })
// // Create Certificate
// routes.post('/admin/certificate/:userId/:courseId',authenticateJWT,Certificate.uploadImageFile,async(req,res)=>{
//     try{
//             let enrollment=await Enrollement.findOne({
//                 userId:req.params.userId,
//                 courseId:req.params.courseId
//             })
//             if(!enrollment  || enrollment.status !=='Completed'){
//                 return res.status(200).json({msg:'course Not completed Yet ,certificate not allowed'})
//             }

//             let newImg='';
//             if(req.file){
//                 newImg=await Certificate.ImgPath+'/'+req.file.filename
//             }
//             req.body.certificateUrl=newImg
//             let createCertificate=await Certificate.create({
//                 userId:req.params.userId,
//                 courseId:req.params.courseId,
//                 certificateUrl:newImg,
//             })
//         return res.status(200).json({msg:'Certificate Added Successfully',data:createCertificate})
//     }catch(err){
//         return res.status(500).json({msg:'Certificate Page Err',err:err})
//     }
// })
// //certificate Verifiy agar verified false he to true karga
// routes.put('/admin/verifiy/:id',authenticateJWT,async(req,res)=>{
//     try{
//             let certiId=req.params.id;
//             let certificate=await Certificate.findById(certiId)
//             certificate.verified=req.body.verified === true || req.body.verified === 'true';
//             await certificate.save();
//             return res.status(200).json({msg:'Verifiy successfully',data:certificate})
//     }catch(err){
//         return res.status(500).json({msg:'Cerificate Vrified Err',err:err})
//     }
// })
// //report course
// routes.get('/admin/report',authenticateJWT,async(req,res)=>{
//     try{
//         let totalCourses=await Courses.countDocuments();
//         let totalEnrollement=await Enrollement.countDocuments();
//         let completed=await Enrollement.countDocuments({status:'Completed'});
//         let InProgress=await Enrollement.countDocuments({status:'In-Progress'});
//         return res.status(200).json({msg:'All Report',data:{totalCourses,totalEnrollement,completed,InProgress}})

//     }catch(err){
//         console.log(err)
//     return res.status(500).json({msg:'report page err',err:err})
//     }
// })
// // Courses IsActive or not
// routes.put('/admin/status/:id',authenticateJWT,async(req,res)=>{
//     try{
//         let courseId=req.params.id;
//         let findCourse=await Courses.findById(courseId);
//         findCourse.isActive= !findCourse.isActive;
//         await findCourse.save();
//         return res.status(200).json({msg:'Course Is Active',data:findCourse})
//     }catch(err){
//         return res.status(500).json({msg:'Course Active/InActive err',err:err})
//     }
// })
// // user
// // view Courses
// routes.get('/user/viewCourse',authenticateJWT,async(req,res)=>{
//     try{
//             let findCourse=await Courses.find()
//             return res.status(200).json({msg:'All Courses',data:findCourse})
//     }catch(err){
//         console.log(err)
//     return res.status(500).json({msg:'View Course Page Err',err:err})
//     }
// })
// // enroll
// routes.post('/user/enroll/:courseId',authenticateJWT,async(req,res)=>{
//     try{
//         const courseId=req.params.courseId;
//         const userId=req.user._id;
//         const checkCourse=await Courses.findById(courseId)

//         const existing=await Enrollement.findOne({userId,courseId})
//         if(existing){
//             return res.status(200).json({msg:'Already enrolled in this Courses'})
//         }

//         const enroll=await Enrollement.create({
//             userId,
//             courseId,
//             enrollDate:new Date(),
//             status:req.body.status || 'Enrolled'
//         })
      
//         return res.status(200).json({msg:'Enrollement created Successfully',data:enroll})
//     }catch(err){
//         return res.status(500).json({msg:'Enroll err',err:err})
//     }
// })
// //My Progress
// routes.get('/user/progress/:courseId',authenticateJWT,async(req,res)=>{
//     try{
//         const courseId=req.params.courseId;
//         const userId=req.user._id;
//         let findMyProgress=await Enrollement.findOne({courseId,userId});
//         return res.status(200).json({msg:'My Progress',
//                                  data:{progress:findMyProgress.progress,
//                                         status:findMyProgress.status,
//                                         completedContent:findMyProgress.completedContent
//                                     }})
//     }catch(err){
//         return res.status(500).json({msg:'progress err',err:err})
//     }
// })
// // Progress % updates
// routes.put("/user/completdContent/:courseId/:contentId",authenticateJWT,async(req,res)=>{
// try{
//         const {courseId,contentId}=req.params;
//     let userId=req.user._id
//     let course=await Courses.findById(courseId);
//     let enrollment=await Enrollement.findOne({userId,courseId});

//     if(!enrollment.completedContent.includes(contentId)){
//         enrollment.completedContent.push(contentId)
//     }
//     //calculate progress bar
//     let total=course.content.length;
//     const completed=enrollment.completedContent.length;
//     enrollment.progress=Math.round((completed/total)*100);

//     if(enrollment.progress>=100){
//         enrollment.status='Completed'
//     }else if(enrollment.progress>0){
//         enrollment.status='In-Progress'
//     }else{
//         enrollment.status='Enrolled'
//     }
//     await enrollment.save();
//     return res.status(200).json({msg:'Progress bar',data:enrollment})
// }catch(err){
//     console.log(err)
// return res.status(500).json({msg:'Progress page err',err:err})
// }
// })
// //My Course
// routes.get('/user/myCourse',authenticateJWT,async(req,res)=>{
//     try{
//         let myCourses=await Enrollement.find({userId:req.user._id}).populate('courseId');
//     return res.status(200).json({msg:'My Course',data:myCourses})
//     }catch(err){
//         return res.status(500).json({msg:'my course page err',err:err})
//     }
// })
// // My Enrollement
// routes.get('/user/myEnroll/:id',authenticateJWT,async(req,res)=>{
//     try{
//         let findMyEnroll=await Enrollement.findById(req.params.id)
//         return res.status(200).json({msg:'My Enrolle',data:findMyEnroll})
//     }catch(err){
//         return res.status(500).json({msg:'My Enroll Page Error',err:err})
//     }
// })
// // My Certificate
// routes.get('/user/MyCertificate/:courseId',authenticateJWT,async(req,res)=>{
//     try{
//         let findMyCertificate=await Certificate.findOne({courseId:req.params.courseId,userId:req.user._id}).populate('courseId').populate('userId')
//         return res.status(200).json({msg:'My Certificte',data:findMyCertificate})
//     }catch(err){
//         return res.status(500).json({msg:'MyCertificate Page Err',err:err})
//     }
// })
// module.exports = routes;


const express = require('express');
const routes = express.Router();
const Courses = require('../models/CourseModel');
const { authenticateJWT } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Enrollement = require('../models/EnrollementModel');
const Certificate = require('../models/CertificateModel');

// Admin Routes
// Add Course
routes.post('/admin/addcourse', authenticateJWT, Courses.uploadImageFile, async (req, res) => {
    try {
        const { title, description, duration, level } = req.body;

        if (!title || !description || !duration) {
            return res.status(400).json({ msg: 'Title, description, and duration are required' });
        }

        // Cover image
        const image = req.files['image'] ? Courses.ImgPath + '/' + req.files['image'][0].filename : '';
        
        // Content files (pdf/video/image)
        const content = req.files['content'] ? req.files['content'].map(file => ({
            title: file.originalname,
            type: file.mimetype.includes('pdf') ? 'pdf' :
                  file.mimetype.includes('video') ? 'video' : 'other',
            url: Courses.ImgPath + '/' + file.filename,
            uploadedAt: new Date()
        })) : [];

        const course = await Courses.create({
            title,
            description,
            duration,
            content,
            image,
            level: level || 'Beginner',
            createdBy: req.user._id
        });

        return res.status(201).json({ msg: 'Course added successfully', data: course });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Failed to add course', err: err.message });
    }
});

// Delete Course
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

        // Delete content files
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
        res.status(500).json({ msg: 'Delete error', err: err.message });
    }
});

// Get Course for Edit
routes.get('/admin/editCourse/:id', authenticateJWT, async (req, res) => {
    try {
        let findData = await Courses.findById(req.params.id);
        if (!findData) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        return res.status(200).json({ msg: 'Course data', data: findData });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: 'Failed to fetch course', err: err.message });
    }
});

// Update Course
routes.put("/admin/updateCourse/:id", authenticateJWT, Courses.uploadImageFile, async (req, res) => {
    try {
        let findCourse = await Courses.findById(req.params.id);
        if (!findCourse) {
            return res.status(404).json({ msg: "Course not found" });
        }

        if (req.files) {
            // Update image
            if (req.files.image) {
                try {
                    if (findCourse.image) {
                        const delPath = path.join(__dirname, "..", findCourse.image);
                        if (fs.existsSync(delPath)) fs.unlinkSync(delPath);
                    }
                } catch (err) {
                    console.log("Image delete error:", err);
                }
                req.body.image = Courses.ImgPath + "/" + req.files.image[0].filename;
            }

            // Update content
            if (req.files.content) {
                if (findCourse.content && findCourse.content.length > 0) {
                    findCourse.content.forEach((item) => {
                        const filePath = path.join(__dirname, "..", item.url);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    });
                }

                req.body.content = req.files.content.map((file) => ({
                    title: file.originalname,
                    type: file.mimetype.includes('pdf') ? 'pdf' :
                          file.mimetype.includes('video') ? 'video' : 'other',
                    url: Courses.ImgPath + "/" + file.filename,
                    uploadedAt: new Date(),
                }));
            }
        } else {
            req.body.image = findCourse.image;
            req.body.content = findCourse.content;
        }

        let updateData = await Courses.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        return res.status(200).json({ msg: "Course updated successfully", data: updateData });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Update failed", err: err.message });
    }
});

// Get All Courses (Admin)
routes.get('/admin/allCourse', authenticateJWT, async (req, res) => {
    try {
        let findCourse = await Courses.find().populate('createdBy', 'name');
        return res.status(200).json({ msg: 'All Courses', data: findCourse });
    } catch (err) {
        return res.status(500).json({ msg: 'Failed to fetch courses', err: err.message });
    }
});


routes.get('/admin/enroll', authenticateJWT, async (req, res) => {
    try {
        let AllEnroll = await Enrollement.find()
            .populate('courseId')
            .populate('userId', 'name email');
        
        console.log('Raw enrollments from DB:', JSON.stringify(AllEnroll, null, 2));
        
        return res.status(200).json({ msg: 'All Enrollments', data: AllEnroll });
    } catch (err) {
        return res.status(500).json({ msg: 'Failed to fetch enrollments', err: err.message });
    }
});

// Create Certificate - Fixed Route
routes.post('/admin/certificate/:userId/:courseId', authenticateJWT, async (req, res) => {
    try {
        console.log('Certificate creation request:', {
            userId: req.params.userId,
            courseId: req.params.courseId,
            body: req.body
        });

        // Check if enrollment exists and course is completed
        let enrollment = await Enrollement.findOne({
            userId: req.params.userId,
            courseId: req.params.courseId
        }).populate('courseId').populate('userId');

        if (!enrollment) {
            return res.status(404).json({ 
                msg: 'Enrollment not found for this user and course' 
            });
        }

        if (enrollment.status !== 'Completed') {
            return res.status(400).json({ 
                msg: 'Course not completed yet, certificate not allowed',
                currentStatus: enrollment.status,
                progress: enrollment.progress
            });
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
            userId: req.params.userId,
            courseId: req.params.courseId
        });

        if (existingCertificate) {
            return res.status(400).json({ 
                msg: 'Certificate already exists for this enrollment',
                certificateId: existingCertificate._id
            });
        }

        // Create certificate without image for now
        // You can add default certificate image logic here later
        const certificateData = {
            userId: req.params.userId,
            courseId: req.params.courseId,
            certificateUrl: '', // Empty for now, can add default URL
            issueDate: new Date(),
            verified: false
        };

        let createCertificate = await Certificate.create(certificateData);

        // Populate the created certificate
        createCertificate = await Certificate.findById(createCertificate._id)
            .populate('courseId')
            .populate('userId', 'name email');

        console.log('Certificate created successfully:', createCertificate);

        return res.status(201).json({ 
            msg: 'Certificate created successfully', 
            data: createCertificate 
        });

    } catch (err) {
        console.error('Certificate creation error:', err);
        return res.status(500).json({ 
            msg: 'Certificate creation failed', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// routes/course.js
// routes.post('/admin/certificate', async (req, res) => {
//   try {
//     const { userId, courseId, certificateTemplate, verified } = req.body;

//     // Validate required fields
//     if (!userId || !courseId) {
//       return res.status(400).json({
//         success: false,
//         message: 'UserId and CourseId are required'
//       });
//     }

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Check if course exists
//     const course = await Courses.findById(courseId);
//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         message: 'Course not found'
//       });
//     }

//     // Check if certificate already exists
//     const existingCertificate = await Certificate.findOne({
//       userId: userId,
//       courseId: courseId
//     });

//     if (existingCertificate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Certificate already exists for this user and course'
//       });
//     }

//     // Create new certificate
//     const certificate = new Certificate({
//       userId: userId,
//       courseId: courseId,
//       certificateUrl: '', // You can generate this later
//       issueDate: new Date(),
//       verified: verified || false,
//       certificateTemplate: certificateTemplate || 'default'
//     });

//     await certificate.save();

//     // Populate the certificate with user and course data
//     await certificate.populate('userId', 'name email');
//     await certificate.populate('courseId', 'title duration');

//     res.status(201).json({
//       success: true,
//       message: 'Certificate created successfully',
//       data: certificate
//     });

//   } catch (error) {
//     console.error('Certificate creation error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });

// Fix the certificate creation endpoint - use this one only
routes.post('/admin/certificate', authenticateJWT, async (req, res) => {
    try {
        const { userId, courseId, certificateTemplate, verified } = req.body;

        console.log('Certificate creation request:', {
            userId: userId,
            courseId: courseId,
            body: req.body
        });

        // Validate required fields
        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'UserId and CourseId are required'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if course exists
        const course = await Courses.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if enrollment exists and course is completed
        let enrollment = await Enrollement.findOne({
            userId: userId,
            courseId: courseId
        }).populate('courseId').populate('userId');

        if (!enrollment) {
            return res.status(404).json({ 
                message: 'Enrollment not found for this user and course' 
            });
        }

        if (enrollment.status !== 'Completed') {
            return res.status(400).json({ 
                message: 'Course not completed yet, certificate not allowed',
                currentStatus: enrollment.status,
                progress: enrollment.progress
            });
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
            userId: userId,
            courseId: courseId
        });

        if (existingCertificate) {
            return res.status(400).json({ 
                message: 'Certificate already exists for this enrollment',
                certificateId: existingCertificate._id
            });
        }

        // Create certificate
        const certificateData = {
            userId: userId,
            courseId: courseId,
            certificateUrl: '', // Empty for now
            issueDate: new Date(),
            verified: verified || false,
            certificateTemplate: certificateTemplate || 'default'
        };

        let createCertificate = await Certificate.create(certificateData);

        // Populate the created certificate
        createCertificate = await Certificate.findById(createCertificate._id)
            .populate('courseId')
            .populate('userId', 'name email');

        console.log('Certificate created successfully:', createCertificate);

        return res.status(201).json({ 
            message: 'Certificate created successfully', 
            data: createCertificate 
        });

    } catch (err) {
        console.error('Certificate creation error:', err);
        return res.status(500).json({ 
            message: 'Certificate creation failed', 
            error: err.message
        });
    }
});

// Verify Certificate
routes.put('/admin/verify/:id', authenticateJWT, async (req, res) => {
    try {
        let certiId = req.params.id;
        let certificate = await Certificate.findById(certiId);
        if (!certificate) {
            return res.status(404).json({ msg: 'Certificate not found' });
        }
        
        certificate.verified = req.body.verified === true || req.body.verified === 'true';
        await certificate.save();
        return res.status(200).json({ msg: 'Certificate verified successfully', data: certificate });
    } catch (err) {
        return res.status(500).json({ msg: 'Certificate verification failed', err: err.message });
    }
});

// Course Report
routes.get('/admin/report', authenticateJWT, async (req, res) => {
    try {
        let totalCourses = await Courses.countDocuments();
        let totalEnrollement = await Enrollement.countDocuments();
        let completed = await Enrollement.countDocuments({ status: 'Completed' });
        let InProgress = await Enrollement.countDocuments({ status: 'In-Progress' });
        
        return res.status(200).json({
            msg: 'Course Report',
            data: { totalCourses, totalEnrollement, completed, InProgress }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: 'Failed to fetch report', err: err.message });
    }
});

// Toggle Course Status
routes.put('/admin/status/:id', authenticateJWT, async (req, res) => {
    try {
        let courseId = req.params.id;
        let findCourse = await Courses.findById(courseId);
        if (!findCourse) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        
        findCourse.isActive = !findCourse.isActive;
        await findCourse.save();
        return res.status(200).json({ msg: 'Course status updated', data: findCourse });
    } catch (err) {
        return res.status(500).json({ msg: 'Status update failed', err: err.message });
    }
});

// User Routes
// View Available Courses
routes.get('/user/viewCourse', authenticateJWT, async (req, res) => {
    try {
        let findCourse = await Courses.find({ isActive: true }).populate('createdBy', 'name');
        return res.status(200).json({ msg: 'Available Courses', data: findCourse });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: 'Failed to fetch courses', err: err.message });
    }
});

// Enroll in Course
routes.post('/user/enroll/:courseId', authenticateJWT, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user._id;
        
        const checkCourse = await Courses.findById(courseId);
        if (!checkCourse) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const existing = await Enrollement.findOne({ userId, courseId });
        if (existing) {
            return res.status(400).json({ msg: 'Already enrolled in this course' });
        }

        const enroll = await Enrollement.create({
            userId,
            courseId,
            enrollDate: new Date(),
            status: req.body.status || 'Enrolled'
        });

        return res.status(200).json({ msg: 'Enrollment created successfully', data: enroll });
    } catch (err) {
        return res.status(500).json({ msg: 'Enrollment failed', err: err.message });
    }
});

// Get My Progress
routes.get('/user/progress/:courseId', authenticateJWT, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user._id;
        
        let findMyProgress = await Enrollement.findOne({ courseId, userId });
        if (!findMyProgress) {
            return res.status(404).json({ msg: 'Enrollment not found' });
        }

        return res.status(200).json({
            msg: 'My Progress',
            data: {
                progress: findMyProgress.progress,
                status: findMyProgress.status,
                completedContent: findMyProgress.completedContent
            }
        });
    } catch (err) {
        return res.status(500).json({ msg: 'Failed to fetch progress', err: err.message });
    }
});

// Mark Content as Completed
routes.put("/user/completedContent/:courseId/:contentId", authenticateJWT, async (req, res) => {
    try {
        const { courseId, contentId } = req.params;
        let userId = req.user._id;
        
        let course = await Courses.findById(courseId);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        let enrollment = await Enrollement.findOne({ userId, courseId });
        if (!enrollment) {
            return res.status(404).json({ msg: 'Enrollment not found' });
        }

        if (!enrollment.completedContent.includes(contentId)) {
            enrollment.completedContent.push(contentId);
        }

        // Calculate progress
        let total = course.content.length;
        const completed = enrollment.completedContent.length;
        enrollment.progress = Math.round((completed / total) * 100);

        if (enrollment.progress >= 100) {
            enrollment.status = 'Completed';
        } else if (enrollment.progress > 0) {
            enrollment.status = 'In-Progress';
        } else {
            enrollment.status = 'Enrolled';
        }

        await enrollment.save();
        return res.status(200).json({ msg: 'Progress updated', data: enrollment });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: 'Failed to update progress', err: err.message });
    }
});

// Get My Courses
routes.get('/user/myCourse', authenticateJWT, async (req, res) => {
    try {
        let myCourses = await Enrollement.find({ userId: req.user._id })
            .populate('courseId')
            .populate('userId', 'name email');
        return res.status(200).json({ msg: 'My Courses', data: myCourses });
    } catch (err) {
        return res.status(500).json({ msg: 'Failed to fetch my courses', err: err.message });
    }
});

// Get My Enrollment
routes.get('/user/myEnroll/:id', authenticateJWT, async (req, res) => {
    try {
        let findMyEnroll = await Enrollement.findById(req.params.id)
            .populate('courseId')
            .populate('userId', 'name email');
        if (!findMyEnroll) {
            return res.status(404).json({ msg: 'Enrollment not found' });
        }
        return res.status(200).json({ msg: 'My Enrollment', data: findMyEnroll });
    } catch (err) {
        return res.status(500).json({ msg: 'Failed to fetch enrollment', err: err.message });
    }
});

// Get My Certificate
routes.get('/user/MyCertificate/:courseId', authenticateJWT, async (req, res) => {
    try {
        let findMyCertificate = await Certificate.findOne({
            courseId: req.params.courseId,
            userId: req.user._id
        }).populate('courseId').populate('userId', 'name email');
        
        if (!findMyCertificate) {
            return res.status(404).json({ msg: 'Certificate not found' });
        }
        
        return res.status(200).json({ msg: 'My Certificate', data: findMyCertificate });
    } catch (err) {
        return res.status(500).json({ msg: 'Failed to fetch certificate', err: err.message });
    }
});

module.exports = routes;