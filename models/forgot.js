/**
 * Created by michaeljava on 05/10/2017.
 */
var mongoose = require('mongoose');
var forgotSchema = mongoose.Schema({
    email: {type:String, required:'{PATH} is required!'},
    token:{type:String, required:'{PATH} is required!'},
    expire:{type: Date, expires: '600s'},//'30s' '24h' '7d'
    class:{type:String,required:'{PATH} is required!', default:'forgot', enum:['forgot','email',], trim: true},
    type:{type:String,required:'{PATH} is required!', default:'lister', enum:['lister','kin','law', 'beneficiary','admin'], trim: true},
    deleted:{type:Boolean,required:'{PATH} is required!',default:false},
},
{
    timestamps: true,
});

forgotSchema.index({  email: 1,token:1}, { unique: true });
forgotSchema.path('email').validate(function (email) {
    var emailRegex = /^([a-zA-z0-9\-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailRegex.test(email);
}, 'The e-mail field cannot be empty.');




var forgot = mongoose.model('forgot', forgotSchema);
