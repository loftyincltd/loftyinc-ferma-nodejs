/**
 * Created by michaeljava on 05/10/2017.
 */
var f = require('mongoose').model('forgot');
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];
var nid=require('nid')({alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', length: 8});
var mailgun = require('../../config/mailgun');
const User = require('mongoose').model('User');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * @swagger
 * /v1/auth/forgot/forgot-add:
 *   get:
 *     tags:
 *       - Users
 *     name: Forgot Password
 *     summary: Create forgot password token
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *             type: string
 *         description: Email of the user
 *       - in: query
 *         name: type
 *         schema:
 *             type: string
 *             enum: [lister, admin]
 *         description: Type of the user e.g lister, admin
 *     responses:
 *       '200':
 *         description: Token sent 
 *       '500':
 *         description: Db problem
 *       '403':
 *         description: Query params wrong
 */
exports.addForgot=function(req, res){
    const email = req.query['email'];
    const type = req.query['type'] ||'lister';
    var forgot=new f({
        email:email,
        token:nid(),
        class:'forgot',
        type,
        expire:Date.now()
    })
    forgot.save(function(err,fo){
        if(err){
            res.send({error: err});
        } else{
            res.send({success: true});

            User.findOne( {email, type},function(err,user){
                if(!err && user){
                    console.log(user)
                    var text= 'You have requested for a password reset and here is your reset token: \n\n '
                        + 'Token: '+ fo.token+' \n\n NB: If you  have not requested for a password reset please ignore this email and this email becomes invalid in 10 minutes;';
                    var from='Securedforme <admin@securedforme.com>';
                    var to= user.email;
                    var subject='Password Reset';
                    const msg = {
                        to,
                        from,
                        subject,
                        text,
                      //  html,
                      };
                      sgMail.send(msg)
                
                }
            })


        }
    });
};

exports.addEmail=function(email,type,  callback ){
    callback = typeof callback === 'undefined' ? function () {
    } : callback;
    var forgot=new f({
        email:email,
        token:nid(),
        expire:Date.now(),
        class:'email',
        type
    })
    forgot.save(function(err,fo){
        if(err){
            callback(err)
        } else{
            callback(null, true);
            User.findOne( {email, type},function(err,user){
                if(!err && user){
                    var text= 'This token is for your  email verification: \n\n '
                        + 'Token: '+ fo.token+' \n\n NB: If you are not trying to verify your email on secured4me please ignore this email and this email, It becomes invalid in 10 minutes;';
                    var from='Securedforme <admin@securedforme.com>';
                    var to= user.email;
                    var subject='Email Verification';

                    const msg = {
                        to,
                        from,
                        subject,
                        text,
                      //  html,
                      };
                      sgMail.send(msg).then((a)=>{
                      //  console.log(a);
                      }).catch((e)=>{
                       // console.log(e);
                      });
                }
            })


        }
    });
};

exports.getForgot= function (req, res) {
    const email = req.query['email'];
    const nid= req.query['nid'];
    f.findOne({email:email,token:nid}, function (err,fi) {
        if(err){
            res.send({error: err});
        } else{
            res.send({success: fi});
        }
    });
}
exports.getForgotI= function (email,nid,c,type,callback) {
    callback = typeof callback === 'undefined' ? function () {
    } : callback;

    f.findOne({email:email,token:nid, type, class:c}, callback);
}
exports.deleteForgot= function (req,res) {
    const email = req.query['email'];
    const nid= req.query['nid'];
    f.remove({email:email,token:nid},function(err){
        if(err){
            res.send({error: err});
        } else{
            res.send({success: true});
        }
    });
};