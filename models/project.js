var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/**
 * @swagger
 * definitions:
 *   Project:
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
var projectSchema = mongoose.Schema({
    description:{type: String},
    title:{type: String},
creator_id:{type:Schema.ObjectId,required:'{PATH} is required!',},
deleted:{type:Boolean,required:'{PATH} is required!',default:false},
},
{
    timestamps: true,
});
projectSchema.pre("save", function(next) {
    next();
});
var project = mongoose.model('Project',  projectSchema);