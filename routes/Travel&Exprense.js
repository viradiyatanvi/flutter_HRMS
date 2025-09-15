const express=require('express');
const routes=express.Router()
const { authenticateJWT } = require('../middleware/auth');
const ExprenseClaim=require('../models/ExpenseClaim');
const ExprenseItems = require('../models/ExprenseItems');
const path=require('path')
const fs=require('fs');

// claim create
routes.post('/user/claim',authenticateJWT,async(req,res)=>{
    try{
        let {title,totalAmount,status,claimDate}=req.body;
    let createClaim=await ExprenseClaim.create({
        userId:req.user._id,
        title,
        claimDate:Date.now(),
        status:'Pending',
        totalAmount
    })
    return res.status(200).json({msg:'successfully',data:createClaim})
    }catch(err){
        return res.status(500).json({msg:'AddClaim page Err',error:err.message})
    }
})


// In your backend route (routes.js)
routes.post('/user/claim/:claimId/items', authenticateJWT, ExprenseItems.uploadImageFile, async (req, res) => {
    try {
        console.log('=== EXPENSE ITEM ADD REQUEST ===');
        console.log('Headers:', req.headers);
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        console.log('File:', req.file);
        console.log('User:', req.user);

        let { type, amount, date, description } = req.body;
        let claimId = req.params.claimId;
        let newImg = '';
        
        // Check if claim exists
        const claimExists = await ExprenseClaim.findById(claimId);
        if (!claimExists) {
            console.log('Claim not found:', claimId);
            return res.status(404).json({ msg: 'Claim not found', error: 'Invalid claim ID' });
        }

        if (req.file) {
            newImg = ExprenseItems.ImgPath + '/' + req.file.filename;
            console.log('File saved at:', newImg);
        } else {
            console.log('No file uploaded');
        }

        console.log('Creating item with data:', {
            claimId, type, amount, date, description, billUrl: newImg
        });

        let createItems = await ExprenseItems.create({
            claimId,
            type,
            description,
            amount: parseFloat(amount),
            date: date ? new Date(date) : Date.now(),
            billUrl: newImg
        });
        
        console.log('Item created successfully:', createItems);
        return res.status(200).json({ msg: 'successfully', data: createItems });
        
    } catch (err) {
        console.error('ERROR in item creation:', err);
        console.error('Error stack:', err.stack);
        return res.status(500).json({ msg: 'server err', error: err.message });
    }
});


// view Claim with items
routes.get('/user/viewClaim/:claimId',authenticateJWT,async(req,res)=>{
        try{
                let claimId=req.params.claimId
            let findCalim=await ExprenseClaim.findById(claimId);
            const items=await ExprenseItems.find({claimId});
            return res.status(200).json({msg:'successfilly',data:{findCalim,items}})
        }catch(err){
            return res.status(500).json({msg:'server err',error:err.message})
        }
})
//MyCliam
routes.get('/user/myClaim',authenticateJWT,async(req,res)=>{
    try{
        let userId=req.user._id
    let findCalim=await ExprenseClaim.find({userId}).lean();
    for(let claim of findCalim){
        let items=await ExprenseItems.find({claimId:claim._id}).lean();
        claim.items=items
    }
    return res.status(200).json({msg:'successfilly',data:{findCalim}})
    }catch(err){
        return res.status(500).json({msg:'server err',error:err.message})
    }
})
// editClaim
routes.put('/user/editClaim/:id',authenticateJWT,async(req,res)=>{
 try{
       let findClaim=await ExprenseClaim.findById(req.params.id);
    

    let updateClaim=await ExprenseClaim.findByIdAndUpdate(req.params.id,req.body,{new:true});
    return res.status(200).json({msg:'success',data:updateClaim})
 }catch(err){
    return res.status(500).json({msg:'server err',error:err.message})
 }
})
//delete Claim
routes.delete('/user/deleteClaim/:id',authenticateJWT,async(req,res)=>{
   try{
         let claimId=req.params.id
    let findClaim=await ExprenseClaim.findById(req.params.id)
    let items=await ExprenseItems.find({claimId})

    for(let item of items){
        if(item.billUrl){
                try{
        let delPath=path.join(__dirname,'..',item.billUrl)
            fs.unlinkSync(delPath)
       }catch(err){
        console.log(err)
        return res.status(500).json({msg:'Image Err',error:err.message})
       }
        }
    }
            await ExprenseItems.deleteMany({claimId})
       let deleteData=await ExprenseClaim.findByIdAndDelete(req.params.id)
       return res.status(200).json({msg:'success',data:deleteData})
    
   }catch(err){
    return res.status(500).json({msg:'server err',error:err.message})
   }
})

// Admin
// view All Cliam With userand items

//http://localhost:8015/api/expense/admin/allClaim?status=Approved || ?userId=id || ?type=Other..,etc

routes.get('/admin/allClaim', authenticateJWT, async (req, res) => {
  try {
   // Sirf Admin/HR ko access
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    } 

    let { page = 1, limit = 20, userId, status, type } = req.query;
    page = Number(page);
    limit = Number(limit);

    // Claim-level filter
    let query = {};
    if (userId) query.userId = userId;
    if (status && status !== 'All') query.status = status;

    // Pehle claims fetch karo
    let claims = await ExprenseClaim.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Items fetch aur type filter apply karo
    for (let claim of claims) {
      let itemQuery = { claimId: claim._id };
      if (type) itemQuery.type = type;
      claim.items = await ExprenseItems.find(itemQuery).lean();
    }

    // Agar type filter diya hai, to sirf items wale claims rakho
    if (type) {
      claims = claims.filter(claim => claim.items.length > 0);
    }

    // Total count calculate karo (post-type-filter)
    const total = claims.length;

    return res.status(200).json({
      msg: 'success',
      data: claims,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});
// status Appoved/Rejected
routes.put('/admin/claim/:claimId/:status',authenticateJWT,async(req,res)=>{
   try{
     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    } 
   let {claimId,status}=req.params;
   const claim=await ExprenseClaim.findById(claimId);
   claim.status=status;
   await claim.save()
    return res.status(200).json({msg:'succesfully',data:claim})

   }catch(err){
    return res.status(500).json({msg:'server err',error:err.messgae})
   }
})


module.exports=routes;