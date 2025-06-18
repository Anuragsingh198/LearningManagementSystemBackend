const  mongoose =  require('mongoose')


const certificateSchema =   new mongoose.Schema({
    user :{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    certificateType:{
        type: String ,
        required:true
    },
    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Course'

    },
    certificateUrl : {
        type:String,
    },
    issueDate:{
        type: Date,
    },
    isGenerated:{
        type:Boolean,
        default:false
    }
})

const  Certificate = mongoose.model( "certificate" , certificateSchema)
module.exports = Certificate;