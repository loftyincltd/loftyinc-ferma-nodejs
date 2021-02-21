var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('../config/config')[env];
/**
 * @swagger
 * definitions:
 *   User:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       first_name:
 *         type: string
 *       last_name:
 *         type: integer
 *       email:
 *         type: string
 *       password:
 *         type: string
 *         format: password
 *       required:
 *         - email
 *         - password
 */

var userSchema = mongoose.Schema({
    first_name: {type:String, required:'{PATH} is required!'},
    middle_name: {type:String,},
    last_name: {type:String, required:'{PATH} is required!'},
    username: {
        type: String,
        required: '{PATH} is required!',
        lowercase:true,
        trim:true,                
        unique: true, sparse: true
    },
    phone: {type:String,},
    bvn: {type:String,},
    bank: {type:String,},
    account: {type:String,},
    account_name: {type:String,},
    nin: {type:String,},
    security_questions: {type:[String],},
    security_answers: {type:[String],},
    salt: {type:String},
    hashed_pwd: {type:String},
    type:{type:String,required:'{PATH} is required!', default:'customer', enum:['customer','admin'], trim: true},
    address:{type:String },
    occupation: {type:String,},
    dob:{type:Date },
    bvn_verified:{type:Boolean,required:'{PATH} is required!',default:false},
    id_verified:{type:Boolean,required:'{PATH} is required!',default:false},
    super:{type:Boolean,required:'{PATH} is required!',default:false},
    fingerprint:{type:Boolean,required:'{PATH} is required!',default:false},
    verified:{type:Boolean,required:'{PATH} is required!',default:false},
    deleted:{type:Boolean,required:'{PATH} is required!',default:false},
    state: {type:String, enum:['ABIA','AKWA IBOM','ADAMAWA','ANAMBRA' 
        ,'BAUCHI','BAYELSA','BENUE','BORNO','CROSS RIVER', 'DELTA'
        ,'EBONYI','EDO','EKITI','ENUGU', 'GOMBE', 'IMO', 'JIGAWA' ,'KADUNA'
        ,'KANO','KATSINA','KEBBI','KOGI','KWARA','LAGOS','NASSARAWA',
        'NIGER','OGUN','ONDO','OSUN','OYO','PLATEAU','RIVERS','SOKOTO',
        'TARABA','YOBE','ZAMFARA','FCT'
        ]},
    lga: {type:String,},
    district: {type:String,},
    location: {
        type: { type: String },
        coordinates: [], //long, lat,
       },
},
{
    timestamps: true,
});
userSchema.index({first_name: 'text',last_name: 'text', phone:'text', username: 'text' });
userSchema.methods = {
    authenticate: function(passwordToMatch) {
        return bcrypt.hashSync( passwordToMatch, this.salt) === this.hashed_pwd;
    },

};
var User = mongoose.model('User', userSchema);
 
userSchema.pre("save", function(next) {
    if((this.email_verified && this.bvn_verified)&& !this.verified){
       this.verified = true;
    }
    next();
});
function createDefaultUsers() {
    User.find({}).exec(function(err, collection) {
        if(collection.length === 0) {
            var salt, hash;
           salt =   bcrypt.genSaltSync(8);
            hash=bcrypt.hashSync(process.env.ADMIN_PASS, salt, null);
            User.create({first_name:process.env.ADMIN_FIRST,
                last_name:process.env.ADMIN_LAST,
                username:process.env.ADMIN_USERNAME, salt: salt, hashed_pwd: hash, type:'admin', super:'true'});
        }
    });
};

exports.createDefaultUsers = createDefaultUsers;