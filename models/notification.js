var mongoose = require('mongoose');
var Schema = mongoose.Schema;



/**
 * @swagger
 * definitions:
 *   Notification:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       type:
 *         type: string
 *       class:
 *         type: string
 *       content:
 *         type: string
 *       required:
 *         - id
 *         - content
 */
var notifSchema = mongoose.Schema({
    content:{type: String,required:'{PATH} is required!'},
    title:{type: String,required:'{PATH} is required!'},
    today: {type:Date},
    task_id:{type:Schema.ObjectId},
    type:{type:String,required:'{PATH} is required!', default:'message', enum:['message','reminder',], trim: true},
    item:{type:Object,},
    owner:{type:Schema.ObjectId,required:'{PATH} is required!'},
    deleted:{type:Boolean,required:'{PATH} is required!',default:false},
},
{
    timestamps: true,
});
notifSchema.pre("save", function(next) {
    next();
});
var notif = mongoose.model('Notification',  notifSchema);