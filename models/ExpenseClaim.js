const mongoose=require('mongoose');

const exprenseClaimSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    title:{
        type:String,
        required:true
    },
     claimDate:{
        type:Date,
        default:Date.now
    },
     status:{
        type:String,
        enum:['Pending','Approved','Rejected'],
        required:true
    },
     totalAmount:{
        type:Number,
        required:true
    },
},{timestamps:true})



module.exports=mongoose.model('ExpenseClaim',exprenseClaimSchema)