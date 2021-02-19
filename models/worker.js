var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/**
 * @swagger
 * definitions:
 *   Worker:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       description:
 *         type: string
 *       request_id:
 *         type: integer
 *       required:
 *         - request_id
 *         - description
 */
var workerSchema = mongoose.Schema({
creator_id:{type:Schema.ObjectId,required:'{PATH} is required!',},
project_id:{type:Schema.ObjectId,required:'{PATH} is required!',},
user_id:{type:Schema.ObjectId,},
deleted:{type:Boolean,required:'{PATH} is required!',default:false},
},
{
    timestamps: true,
});
workerSchema.pre("save", function(next) {
    next();
});
var worker = mongoose.model('Worker',  workerSchema);