const mongoose =  require('mongoose');

const moduleProgressSchema = new mongoose.Schema({
    userId:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    courseId:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'Course',
        required:true
    },
    moduleId:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'Module',
        required:true
    },

    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    videoIndex:{
        type:Number,
        default:0
    },
    totalVideos:{ type:Number,
        default:0},
    totalTests:{ type:Number,
        default:0},
    completedTest:{ type:Number,
        default:0},
    completedVideos:{ type:Number,
        default:0},
        
    percentageCompleted: {
      type: Number,
      default: 0,
    },
    
})

const ModuleProgress = mongoose.model("ModuleProgress", moduleProgressSchema);
module.exports = ModuleProgress;