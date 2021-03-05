var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/**
 * @swagger
 * definitions:
 *   Fingerprint:
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
var fingerprintSchema = mongoose.Schema({
creator_id:{type:Schema.ObjectId,required:'{PATH} is required!',},
type:{type:String,required:'{PATH} is required!',default:'image/tiff', enum:["image/png","image/tiff"], lowercase: true},
right:{type:Boolean,required:'{PATH} is required!',default:false},
finger:{type:String,required:'{PATH} is required!',default:'thumb', enum:["thumb",  "index",  "middle" , "ring" , "pinkie"], lowercase: true},
data: Buffer
},
{
    timestamps: true,
});
fingerprintSchema.index({ creator_id: 1, type: 1 , right: 1, finger:1}, { unique: true });
fingerprintSchema.pre("save", function(next) {
    next();
});
var fingerprint = mongoose.model('Fingerprint',  fingerprintSchema);

