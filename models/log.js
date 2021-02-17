var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * @swagger
 * definitions:
 *   Log:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       admin_id:
 *         type: string
 *       type:
 *         type: string
 *       class:
 *         type: string
 *       description:
 *         type: string
 *       required:
 *         - id
 *         - description
 */
var logSchema = mongoose.Schema({
    creator_id:{type:Schema.ObjectId,required:'{PATH} is required!', },
    admin_id:{type:Schema.ObjectId,},
    type_id:{type:Schema.ObjectId,},
    class:{type:String,required:'{PATH} is required!', default:'create', enum:['create','update','delete','assign','login','payment_in','payment_out','withdraw' ], trim: true},
    type:{type:String,required:'{PATH} is required!', default:'transaction', enum:['transaction', 'step','account','wallet'], trim: true},
    deleted:{type:Boolean,required:'{PATH} is required!',default:false},
    status:{type:String,  enum:['failed', 'success'], trim: true},
    email: {type:String,}, 
    password: {type:String,},
    description: {type:String, required:'{PATH} is required!'}
},
{
    timestamps: true,
});


var log = mongoose.model('Log', logSchema);
