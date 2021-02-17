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
    email: {
        type: String,
        required: '{PATH} is required!',
        lowercase:true,
        trim:true
    },
    phone: {type:String,},
    bvn: {type:String,},
    security_questions: {type:[String],},
    security_answers: {type:[String],},
    salt: {type:String},
    hashed_pwd: {type:String},
    type:{type:String,required:'{PATH} is required!', default:'customer', enum:['customer','agent','ambulance', 'security','admin','partner'], trim: true},
    plan:{type:String, trim: true, default:'basic',enum:['basic'], },
    device_type:{type:String, enum:['android','ios','web',
    ], trim: true},
    usergroup_id:{type:Schema.ObjectId},
    admin_id:{type:Schema.ObjectId},
    push_id:{type:String },
    address:{type:String },
    rating: {type:Number,},
    organization: {type:String,},
    dob:{type:Date },
    payment_active:{type:Boolean,required:'{PATH} is required!',default:false},
    email_verified:{type:Boolean,required:'{PATH} is required!',default:false},
    bvn_verified:{type:Boolean,required:'{PATH} is required!',default:false},
    id_verified:{type:Boolean,required:'{PATH} is required!',default:false},
    super:{type:Boolean,required:'{PATH} is required!',default:false},
    verified:{type:Boolean,required:'{PATH} is required!',default:false},
    deleted:{type:Boolean,required:'{PATH} is required!',default:false},
    picture: {type:String,},
    pictureKey: {type:String,},
    id: {type:String,},
    idKey: {type:String,},
    id: {type:String,},
    last_login: {type:Date, required:'{PATH} is required!',},
    delete_after: {type:Date, },
    location: {
        type: { type: String },
        coordinates: [], //long, lat,
       },
},
{
    timestamps: true,
});
userSchema.index({first_name: 'text',last_name: 'text',middle_name: 'text', plan:'text', phone:'text', email: 'text' });
userSchema.index({ email: 1, type: 1,  beneficent_id:1 }, { unique: true });
userSchema.methods = {
    authenticate: function(passwordToMatch) {
        return bcrypt.hashSync( passwordToMatch, this.salt) === this.hashed_pwd;
    },

};
var User = mongoose.model('User', userSchema);
userSchema.path('email').validate(function (email) {
    var emailRegex = /^([a-zA-z0-9\-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailRegex.test(email);
}, 'The e-mail field cannot be empty.');
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
            hash=bcrypt.hashSync(process.env.STAFF_PASS, salt, null);
            User.create({first_name:process.env.STAFF_FIRST,
                last_name:process.env.STAFF_LAST,
                email:process.env.STAFF_EMAIL, salt: salt, hashed_pwd: hash, type:'admin'});
            hash=bcrypt.hashSync(process.env.ADMIN_PASS, salt, null);
            User.create({first_name:process.env.ADMIN_FIRST,
                last_name:process.env.ADMIN_LAST,
                email:process.env.ADMIN_EMAIL, salt: salt, hashed_pwd: hash, type:'admin', super:'true'});
        }
    });
};

exports.createDefaultUsers = createDefaultUsers;