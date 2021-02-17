/**
 * Created by michaeljava on 29/06/2018.
 */
'use strict';
const User = require('mongoose').model('User');
var Access = require('mongoose').model('access');
var Payment = require('mongoose').model('Payment');
var mongoose = require('mongoose');
var nid=require('nid')({alphabet:'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*?', length: 15});
const bcrypt   = require('bcrypt-nodejs');
const jwt     = require('jsonwebtoken');
var pdf = require('html-pdf');
const Asset = require('mongoose').model('Asset');
const Log =require('mongoose').model('Log');
const _       = require('lodash');
var nid=require('nid')({alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', length: 20});
var CryptoJS = require("crypto-js");
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];
var mailgun = require('../../config/mailgun')
var ObjectId = require('mongodb').ObjectID;
var fs= require('fs');
var forgot = require('./Forgot.js');
var ejs= require('ejs');
var fcm = require('../../config/fcm');
var Notif = require('mongoose').model('Notification');
var mailgun = require('../../config/mailgun');
var UserGroup = require('mongoose').model('UserGroup');
var AWS = require('aws-sdk');
const path = require('path');
const IAM_USER_KEY = config.awsaccess;
const IAM_USER_SECRET = config.awssecret;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const pp_secret = 'sk_test_c20e24b66af47f0efd6d7dfb28b83321c2b3f207';
const pp_public = 'pk_test_f8d11a7b97b6744b5bddfe9dcc0669f7314b0cdf';
var request = require('request');
const Subscription = require('mongoose').model('Subscription');


function createToken(user, exp) {
    const dat = {
        exp: exp|| Math.floor(Date.now() / 1000) + (60 * 60),
        data: pick(user)
    }
    return jwt.sign(dat, config.secret);
}
function pick(user){
    return _.pick(user, 'type','relation','death_certificate','super','usergroup_id','admin_id', 'deleted', 'address','bvn','verified','email_verified','bvn_verified','email','phone','first_name','last_name','middle_name','_id','relation','company_id', 'plan','picture','payment_active','address', 'security_questions',
    'security_answers', 'bvn','lawyer_id','beneficent_id','beneficent_deceased', 'organization','rating', 'plan', 'payment_due','last_login')
}
const validUser= function (u){
   return (u.verified && u.type==='client' && u.deleted ===false )||
   (u.type==='kin' && u.deleted ===false  && u.beneficent_deceased ); 
}

const validUserPay= function (u){
    return u.verified && u.payment_active && u.type==='client' && u.deleted ===false;
 }
const validAdmin = function (u){
    return (u.type === 'staff' || u.type === 'admin'|| u.super) && u.deleted ===false;
 }


const canLogin = function(u){
     if(
     u.type === 'admin' || u.type === 'client' 
     && (  !(u.type === 'admin' ) && u.verified )
     ){
         return true;
     } else{
         return false;
     }
 }
/**
 * @swagger
 * /v1/auth/user/login:
 *   post:
 *     tags:
 *       - Users
 *     name: Login
 *     summary: Logs in a user
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *             type:
 *               type: string
 *               enum: [client, admin]
 *         required:
 *           - email
 *           - password
 *         example:   # Sample object
 *           email: michaelfemi81@gmail.com
 *           password: "123456" 
 *           type: client
 *     responses:
 *       '200':
 *         description: User found and logged in successfully
 *       '401':
 *         description: Bad username, not found in db
 *       '403':
 *         description: Username and password don't match
 */
exports.login = function(req, res,next){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }

if(userData.email  && userData.password){
    const q={
        email: userData.email, deleted: false
    }
    if(userData.type){
        q.type = userData.type;
    } else {
        q.type='client'
    }
   let giant =  [
            
    {
        "$match": q
    },
    {$sort: {createdAt: -1, updatedAt:-1}},

   
    ];
   /**  if(userData.type === 'client'){
        giant.push( {
            "$lookup": {
                "from": "subscriptions",
                "localField": "plan",
                "foreignField": "name",
                "as": "planDetails"
            }
        });
    } else if(userData.type === 'admin'){
        giant.push( {
            "$lookup": {
                "from": "usergroups",
                "localField": "usergroup_id",
                "foreignField": "_id",
                "as": "planDetails"
            }
        });
    }**/
    User.aggregate(
      giant,function(err,users){
        // bcrypt.compare()
        if(err){

            res.send({error: err});
        }
        else{

            if(users.length <=0){
                res.send({error: "user does not exist"});
                //createLog(req, 'account','login', resp._id,resp.name)
            }
            else{
                const user = users[0]
                let feautures =[]
                if(user && user.planDetails && user.planDetails[0]){
                    if(user.planDetails[0].carry_over_features && user.planDetails[0].features){
                        feautures= [... user.planDetails[0].features,...  user.planDetails[0].carry_over_features ]
                    } else if(user.planDetails[0].features){
                        feautures= user.planDetails[0].features
                    } else if(user.planDetails[0].permissions){
                        feautures= user.planDetails[0].permissions
                    }
                 
                }
                bcrypt.compare(userData.password,user.hashed_pwd,function(err,resp){
                    if(err){
                        console.log(err)
                        res.send({error: err});

                    }
                    else{
                        if(resp){
                            
                            let tSend =  pick(user);
                            tSend.features = feautures
                            if(user && user.planDetails && user.planDetails[0] && user.planDetails[0].permissions){
                                tSend.adminGroup =  user.planDetails[0].name;
                            }
                         
                            let extra = (60 * 60 * 24 * 365 * 1000 );
                            const exp = Math.floor(Date.now() / 1000) + extra;
                            var token = createToken(tSend, exp);
                            var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                            res.send({user_token: ciphertext.toString()
                            ,user:
                              tSend
                            });
                            if(userData.type==='client'){
                                let name= user.last_name + (user.middle_name?' '+user.middle_name+' ':' ')+""
                                + user.first_name;
                                createLog({user: {data:tSend}}, 'account','login',null,name)
                            }
                            User.findOne({
                                _id: user._id
                            }, function(err, uu){
                                 if(!err && uu){
                                    uu.last_login = new Date();
                                    if(userData.device_type && userData.push_id){
                                        uu.device_type=userData.device_type;
                                        uu.push_id = userData.push_id;
                                        uu.save();
                                        
                                    } else{
                                        uu.save()
                                    }
                                
                                 }
                            })
                          
                        
                           
                        }
                        else{
                            res.send({error: "password does not match"});
                        }
                    }
                }) ;
            }

        }



    });
} else{

    res.status(403).send({error:'Invalid Request'});
}


};
/**
 * @swagger
 * /v1/auth/user/login:
 *   get:
 *     tags:
 *       - Users
 *     name: GET User
 *     security:
 *       - bearerAuth: []
 *     summary: Get the user details
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     responses:
 *       '200':
 *         description: User details
 *       '500':
 *         description: Db Error
 */
exports.getSingleUser=function(req, res, next){
    const u = req.user ? req.user.data: {};
    if(u && u._id){
        User.findOne({
            _id: u._id
        }, function(err, user){
            if(err){
                res.status(500).send({error: err});
            } else{
                if(u.type=='admin'){
                    UserGroup.findOne({
                        _id: user.usergroup_id
                    },function(err, resp){
                        if(err){
                            res.status(500).send({error: err});
                        }else{
                            let features=[];
                            let tSend =  pick(user);
                            if(resp){
                                features =  resp.permissions

                            
                                tSend.features = features
                                tSend.adminGroup = resp.name
                            } 
                            let extra = (60 * 60 * 24 * 365 * 1000 );
                           const exp = Math.floor(Date.now() / 1000) + extra;
                          var token = createToken(tSend, exp);
                           var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                          res.send({user_token: ciphertext.toString()
                         ,user:
                          tSend
                         });

                        }
                    })
                } else{
                    Subscription.findOne({
                        name: user.plan
                    },function(err, resp){
                        if(err){
                            res.status(500).send({error: err});
                        }else{
                            let features=[];
                            let tSend =  pick(user);
                            if(resp){
                                features = [... resp.features, ... resp.carry_over_features];
                            
                                tSend.features = features
                            } 
                            let extra = (60 * 60 * 24 * 365 * 1000 );
                           const exp = Math.floor(Date.now() / 1000) + extra;
                          var token = createToken(tSend, exp);
                           var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                          res.send({user_token: ciphertext.toString()
                         ,user:
                          tSend
                         });

                        }
                    })
                }
            }
        })
    } else{
        res.status(403).send({error:'Invalid Request'});
    }
}

/**
 * @swagger
 * /v1/auth/user/client:
 *   get:
 *     tags:
 *       - Users
 *     name: GET User
 *     security:
 *       - bearerAuth: []
 *     summary: Get the user details
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: id
 *         description: The id of the user
 *     consumes:
 *       - application/json
 *     responses:
 *       '200':
 *         description: User details
 *       '500':
 *         description: Db Error
 */
exports.getSingleclient=function(req, res, next){
    const u = req.user ? req.user.data: {};
    const id= req.query['id'];
    if(u && u._id && validAdmin(u)){
        User.findOne({
            _id: id
        }, function(err, resp){
            if(err){
                res.status(500).send({error: err});
            } else{
                res.send({user: pick(resp)});
            }
        })
    } else{
        res.status(403).send({error:'Invalid Request'});
    }
}



/**
 * @swagger
 * /v1/auth/user/changePass:
 *   post:
 *     tags:
 *       - Users
 *     name: Update User Password
 *     security:
 *       - bearerAuth: []
 *     summary: Get the user details
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         properties:
 *             old:
 *               type: string
 *               format: password
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - old
 *           - password
 *     responses:
 *       '200':
 *         description: Password Changed Successsfully
 *       '500':
 *         description: Db Error
 */
exports.upass = function(req, res,next){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const u = req.user ? req.user.data: {};
    User.findOne({_id: u._id},function(err,user){
        // bcrypt.compare()
        if(err){

            res.status(500).send({error: err});
        }
        else{

            if(user===null){
                res.send({error: "user does not exist"});
            }
            else{
                bcrypt.compare(userData.old,user.hashed_pwd,function(err,resp){
                    if(err){
                      
                        res.status(500).send({error: err});

                    }
                    else{

                        if(resp){
                            user.salt=bcrypt.genSaltSync(8);
                            user.hashed_pwd=bcrypt.hashSync(userData.password, u.salt, null);
                            user.save(function(err,resp2){
                                if(err){
                                    res.status(500).send({error: err});
                                } else{
                                    res.send({success: resp2});
                                }
                            })
                        }
                        else{
                            res.send({error: "password does not match"});
                        }
                    }

                }) ;
            }

        }



    });

};

/**
 * @swagger
 * /v1/auth/user/changeSecurity:
 *   post:
 *     tags:
 *       - Users
 *     name: Update User Security Questions
 *     security:
 *       - bearerAuth: []
 *     summary: Update Security Questions
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         properties:
 *             password:
 *               type: string
 *               format: password
 *             questions:
 *               type: string
 *               format: array
 *             answers:
 *               type: string
 *               format: array
 *         required:
 *           - password
 *     responses:
 *       '200':
 *         description: Security Questions Changed Successsfully
 *       '500':
 *         description: Db Error
 */
exports.usec = function(req, res,next){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const u = req.user ? req.user.data: {};
    User.findOne({_id: u._id},function(err,user){
        // bcrypt.compare()
        if(err){

            res.status(500).send({error: err});
        }
        else{

            if(user===null){
                res.send({error: "user does not exist"});
            }
            else{
                bcrypt.compare(userData.password,user.hashed_pwd,function(err,resp){
                    if(err){
                      
                        res.status(500).send({error: err});

                    }
                    else{

                        if(resp){
                            const q = user.security_questions ;
                            if(!q){
                                q=[];
                            };
                            const a = userData.answers;
                            if(!a){
                                a=[];
                            };
                            try {
                                userData.questions = typeof userData.questions ==='string'?JSON.parse(userData.questions):userData.questions;
                                userData.answers = typeof userData.answers ==='string'?JSON.parse(userData.answers):userData.answers;
                            } catch (e){
                                console.log(e);
                            }

                            user.security_questions = userData.questions;
                            user.security_answers = userData.answers
                        
                            user.save(function(err,resp2){
                                if(err){
                                    res.status(500).send({error: err});
                                } else{
                                    res.send({success: resp2});
                                }
                            })
                        }
                        else{
                            res.send({error: "password does not match"});
                        }
                    }

                }) ;
            }

        }



    });

};


/**
 * @swagger
 * /v1/auth/user/pay:
 *   post:
 *     tags:
 *       - Users
 *     name: Confirm  a Payment
 *     security:
 *       - bearerAuth: []
 *     summary: Confirm  a Payment
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         properties:
 *             transaction_id:
 *               type: string
 *         required:
 *           - transaction_id
 *     responses:
 *       '200':
 *         description: Payment Successfull
 *       '500':
 *         description: Db Error
 */
exports.pay = function(req, res,next){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const u = req.user ? req.user.data: {};
    console.log(userData)
    if(userData.transaction_id  && u && validUser(u)){
        var options = { method: 'GET',
        url: 'https://api.paystack.co/transaction/'+userData.transaction_id,
        headers:
        {Authorization: 'Bearer '+ pp_secret } };

    request(options, function (error, response, body) {
        console.log(error, body)
        if (error) {
            res.status(500).send({error: error})
        } else{
            body = typeof body==='string' ? JSON.parse(body): body;
            if(body.status && body.data){
                
                const paid = new Date(body.data.paidAt|| body.data.paid_at) || new Date();
                paid.setFullYear(paid.getFullYear()+1);
                User.find({
                    beneficent_id: u._id,
                    
                },function(err, all){
                    if(!err && all){
                        all.forEach(function(elt){
                            elt.payment_due = paid;
                            elt.payment_active = true;
                            elt.plan =  body.data.plan.name;
                            elt.save();
                        })
                    }
                })
                User.findOne({
                   _id: u._id
                }, function(err, user0){
                    if(err){
                        res.status(500).send({error: err})
                    } else{
                        if(user0 && user0._id){
                            user0.payment_due = paid;
                            user0.payment_active = true;
                            user0.plan =  body.data.plan.name;
                            user0.save(function(err, user){
                                if(err){
                                    res.status(500).send({error: err})
                                } else{
                                    Subscription.findOne({
                                        name: user.plan
                                    },function(err, resp){
                                        if(err){
                                            res.status(500).send({error: err});
                                        }else{
                                            let features=[];
                                            let tSend =  pick(user);
                                            if(resp){
                                                features = [... resp.features, ... resp.carry_over_features];
                                            
                                                tSend.features = features
                                                const p =new Payment({
                                                    creator_id: user._id,
                                                    plan: body.data.plan.name,
                                                    renewal:  paid
                                                    , amount: resp.amount
                           
                           
                                                })
                                                 p.save();
                                            } 
                                            let extra = (60 * 60 * 24 * 365 * 1000 );
                                           const exp = Math.floor(Date.now() / 1000) + extra;
                                          var token = createToken(tSend, exp);
                                           var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                                          res.send({user_token: ciphertext.toString()
                                         ,user:
                                          tSend
                                         });
    
                                        }
                                    })
                                    
                               
                                }
                            })
                        } else{
                            res.status(500).send({error: 'Something wrong happend'})
                        }
                        

                    }
                })
            } else{
                res.status(500).send({error: 'Something wrong happened'})
            }
        }

    });
    }else{
        res.status(403).send({error:'please add transaction_id and make sure you are logged in'})
    }

};

  
/**
 * @swagger
 * /v1/auth/user/allpayments:
 *   get:
 *     tags:
 *       - Users
 *     name: Get list of payments 
 *     summary: Payment List
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Number of items to return. Default is 10
 *         value: 10
 *       - in: query
 *         name: skip
 *         description: Number of items to skip. 
 *       - in: query
 *         name: plan
 *         description: Filter by plan. 
 *       - in: query
 *         name: id
 *         description: id of the client. 
 *       - in: query
 *         name: all
 *         description: If this value is set the api is unpaginated
 *     responses:
 *       '200':
 *         description: Subscription List
 *       '403':
 *         description: Invalid Request
 */
exports.getPaidList = function(req, res, next){
    const limit= parseInt(req.query['limit'], 10)||10;
    const skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    const id = req.query['id'];
    const all = req.query['all'];
    const plan = req.query['plan'];
    const currentuser = req.user ? req.user.data: {};
    if(validUser(currentuser) || validAdmin(currentuser)){
       let q={};
       if(currentuser.type ==='client'){
           q.creator_id = u._id
       } else if(id){
           q.creator_id = id
       }

       if(plan){
           q.plan = plan;
       }
        if(count){
            
            Payment.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            if(all){
                Payment.find(q,{},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).sort({amount: 1,updatedAt:-1,createdAt: -1, });
            } else{
               Payment.find(q,{},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).limit(limit).skip(skip).sort({amount: 1,updatedAt:-1,createdAt: -1, });
            }
            
        }

    }else{
        res.status(403).send({error:'Invalid Request'});
    }

    
}
/**
 * @swagger
 * /v1/auth/user/signup:
 *   post:
 *     tags:
 *       - Users
 *     name: Register
 *     summary: Register a new user
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             type:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - username
 *           - email
 *           - password
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */

exports.createUser = function(req, res, next) {
    var userData = req.body;

    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    let c_name= '';
    let pass =userData.password||nid();
    if(userData.email && userData.first_name && userData.last_name && pass) {
        const u ={};
        u.email = userData.email.toLowerCase();
        u.salt=bcrypt.genSaltSync(8);       
            u.hashed_pwd=bcrypt.hashSync(userData.password, u.salt, null)
        


        u.first_name =userData.first_name;
        u.last_name =userData.last_name;
        u.phone =userData.phone;
        u.type = userData.type||'client'
        

        User.create(u, function(err, user) {
            if(err) {
                if(err.toString().indexOf('E11000') > -1) {

                    err = new Error('Duplicate Email');
                }

                res.status(400).send({error:err.toString()});
            } else{
                
                Subscription.findOne({
                    name: user.plan
                },function(err, resp){
                    if(err){
                        res.status(500).send({error: err});
                    }else{
                        let features=[];
                        let tSend =  pick(user);
                        if(resp){
                            features = [... resp.features, ... resp.carry_over_features];
                        
                            tSend.features = features
                        } 
                        let extra = (60 * 60 * 24 * 365 * 1000 );
                       const exp = Math.floor(Date.now() / 1000) + extra;
                      var token = createToken(tSend, exp);
                       var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                      res.send({user_token: ciphertext.toString()
                     ,user:
                      tSend
                     });

                    }
                })
                forgot.addEmail(user.email);
                if(userData.device_type && userData.push_id){
                    user.device_type=userData.device_type;
                    user.push_id = userData.push_id;
                    user.save();
                }
            }

        });


    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};

/**
 * @swagger
 * /v1/auth/user/createuser:
 *   post:
 *     tags:
 *       - Users
 *     name: Register
 *     summary: Register a new user
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             type:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - username
 *           - email
 *           - password
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */

exports.createSomeUSer = function(req, res, next) {
    var userData = req.body;
    const currentuser = req.user ? req.user.data: {};
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    let pass =userData.password||nid();
    if(validAdmin(currentuser) && userData.email && userData.first_name && userData.last_name && pass) {
        const u ={};
        u.email = userData.email.toLowerCase();
        u.salt=bcrypt.genSaltSync(8);       
            u.hashed_pwd=bcrypt.hashSync(pass, u.salt, null)
        


        u.first_name =userData.first_name;
        u.last_name =userData.last_name;
        u.phone =userData.phone;
      //  u.bvn =userData.bvn;
      //bvn not save should be verified
        u.type = userData.type||'client'
        u.bvn_verified= true;
        u.id_verified = true;
        u.email_verified=true;
        

        User.create(u, function(err, user) {
            if(err) {
                if(err.toString().indexOf('E11000') > -1) {

                    err = new Error('Duplicate Email');
                }

                res.status(400).send({error:err.toString()});
            } else{
                 
                res.send({
                success:
                pick(user)
             });
             var text= 'A '+type+' account has been created for you and your user details are stated below: \n\n '
             + 'Email: '+ user.email+'\n Password: '+pass+ '\n\n ';
               var from='Secured4me <admin@securedforme.com>';
            var to= user.email;
            var subject='New User';
           const msg = {
             to,
             from,
             subject,
             text,
           //  html,
           };
           sgMail.send(msg)
                
            }

        });


    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};


/**
 * @swagger
 * /v1/auth/user:
 *   put:
 *     tags:
 *       - Users
 *     name: Update
 *     summary: Update the authenticated user details
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             middle_name:
 *               type: string
 *             address:
 *               type: string
 *             phone:
 *               type: string
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */
exports.updateUser = function(req, res) {
    var userUpdates = req.body;
    if(typeof  userUpdates === 'string' || userUpdates instanceof String ){
        userUpdates = JSON.parse(userUpdates) ;
    }
    const user = req.user ? req.user.data : {};
    // const otp = req.query['otp'];
     if(user && user._id){
         User.findOne({_id: user._id}, function(err, user1){
            if(err){
                res.send({error: err});
            } else{
                 if(userUpdates.dob && !user1.dob){
                    user1.dob = typeof 
                    userUpdates.dob === 'object' ? userData.dob
                    :typeof userUpdates.dob === 'string'? 
                    new Date(userUpdates.dob ):userUpdates.dob ;
                 }
                 if(userUpdates.gender){
                    user1.gender = userUpdates.gender;
                }
                if(userUpdates.first_name){
                    user1.first_name = userUpdates.first_name;
                }
                if(userUpdates.last_name){
                    user1.last_name = userUpdates.last_name;
                }
                if(userUpdates.middle_name){
                    user1.middle_name = userUpdates.middle_name;
                }
                if(userUpdates.address){
                    user1.address = userUpdates.address;
                }
                if(userUpdates.plan){
                    user1.plan = userUpdates.plan;
                }
                if(userUpdates.admin){
                    user1.plan = userUpdates.plan;
                }
                if(userUpdates.phone){
                    user1.phone = userUpdates.phone;
                }
                if(userUpdates.longitude && userUpdates.latitude){
                    user1.location =  {type: "Point",
                    coordinates: [userUpdates.longitude,  userUpdates.latitude ]
                }
                    
                }
                user1.save(function(err2, user2){
                    if(err2){
                        res.send({error: err2});
                    } else{
                      
                        let tSend =  pick(user2);
                        let extra = (60 * 60 * 24 * 365 * 1000 );
                        const exp = Math.floor(Date.now() / 1000) + extra;
                       var token = createToken(tSend, exp);
                        var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                       res.send({user_token: ciphertext.toString()
                      ,user:
                       tSend
                      });
                       
                    }
                })
               
               
            }
           
         })

     }

};



/**
 * @swagger
 * /v1/auth/user/profile_pic:
 *   post:
 *     tags:
 *       - Users
 *     name: change profile picture
 *     summary: change profile picture
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: picture
 *         type: file
 *         description: profile picture
 *     responses:
 *       '200':
 *         description: Picture updated
 *       '401':
 *         description: UnAuthorizes
 */
exports.updateProfilePic = function(req,res,next){
    const user = req.user ? req.user.data: {};
    console.log(user, req.files)
    if(user && req.files) {
        var id = user._id;
        let s3bucket = new AWS.S3({
            accessKeyId: IAM_USER_KEY,
            secretAccessKey: IAM_USER_SECRET,

        });
        var tmp_path = req.files[Object.keys(req.files)[0]].path;
        var src = fs.createReadStream(tmp_path);
        src.on('error', function (err) {
            console.log('File Error', err);
        });
        var uploadParams = {Bucket: 'secured4me', Key: '', Body: '', ACL: 'public-read'};
        uploadParams.Body = src;
        uploadParams.Key = "profile_pictures/" + id +'/'+ ((req.files[Object.keys(req.files)[0]]).originalname|| req.files[Object.keys(req.files)[0]].name);

        User.findOne({_id:id}, function(err, u){
            if(err){
                res.send({error: err});
            } else{
                if(u.pictureKey){
                    var params = {
                        Bucket: 'secured4me',
                        Key: u.pictureKey
                    };
                    s3bucket.deleteObject(params,function(err, data){
                        if(!err){
                            s3bucket.upload(uploadParams, function (err, data) {
                                if (err) {
                                    console.log("Error", err);
                                }
                                if (data) {
                                    
                                    u.picture = data.Location;
                                    u.pictureKey= data.Key;
                                    u.save(function(err2, user){
                                        if(err2){
                                           res.send({error: err2});
                                        } else{
                                            Subscription.findOne({
                                                name: user.plan
                                            },function(err, resp){
                                                if(err){
                                                    res.status(500).send({error: err});
                                                }else{
                                                    let features=[];
                                                    let tSend =  pick(user);
                                                    if(resp){
                                                        features = [... resp.features, ... resp.carry_over_features];
                                                    
                                                        tSend.features = features
                                                    } 
                                                    let extra = (60 * 60 * 24 * 365 * 1000 );
                                                   const exp = Math.floor(Date.now() / 1000) + extra;
                                                  var token = createToken(tSend, exp);
                                                   var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                                                  res.send({user_token: ciphertext.toString()
                                                 ,user:
                                                  tSend
                                                 });
            
                                                }
                                            })
                                            
                                            
                                           
                                        }
                                    })
            
                                }
                            });
                        }
                    })
                
                } else{
                    s3bucket.upload(uploadParams, function (err, data) {
                        if (err) {
                            console.log("Error", err);
                        }
                        if (data) {
                            
                            u.picture = data.Location;
                            u.pictureKey= data.Key;
                            u.save(function(err2, user){
                                if(err2){
                                   res.send({error: err2});
                                } else{
                                    Subscription.findOne({
                                        name: user.plan
                                    },function(err, resp){
                                        if(err){
                                            res.status(500).send({error: err});
                                        }else{
                                            let features=[];
                                            let tSend =  pick(user);
                                            if(resp){
                                                features = [... resp.features, ... resp.carry_over_features];
                                            
                                                tSend.features = features
                                            } 
                                            let extra = (60 * 60 * 24 * 365 * 1000 );
                                           const exp = Math.floor(Date.now() / 1000) + extra;
                                          var token = createToken(tSend, exp);
                                           var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                                          res.send({user_token: ciphertext.toString()
                                         ,user:
                                          tSend
                                         });
    
                                        }
                                    })
                                    
                                    
                                   
                                }
                            })
    
                        }
                    });
                }
               
            }
        })

    }else{
        res.status(401).send({error:'Unauthorized'});
    }
}





/**
 * @swagger
 * /v1/auth/user/picture_id:
 *   post:
 *     tags:
 *       - Users
 *     name: change my id
 *     summary: change my id
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: picture
 *         type: file
 *         description: User Id photo
 *     responses:
 *       '200':
 *         description: User Id photo updated
 *       '401':
 *         description: UnAuthorizes
 */
exports.updatePictureId = function(req,res,next){
    const user = req.user ? req.user.data: {};
    console.log(user, req.files)
    if(user && req.files) {
        var id = user._id;
        let s3bucket = new AWS.S3({
            accessKeyId: IAM_USER_KEY,
            secretAccessKey: IAM_USER_SECRET,

        });
        var tmp_path = req.files[Object.keys(req.files)[0]].path;
        var src = fs.createReadStream(tmp_path);
        src.on('error', function (err) {
            console.log('File Error', err);
        });
        var uploadParams = {Bucket: 'secured4me', Key: '', Body: '', ACL: 'public-read'};
        uploadParams.Body = src;
        uploadParams.Key = "ids/" + id +'/'+ ((req.files[Object.keys(req.files)[0]]).originalname|| req.files[Object.keys(req.files)[0]].name);

        User.findOne({_id:id}, function(err, u){
            if(err){
                res.send({error: err});
            } else{
                if(u.pictureKey){
                    var params = {
                        Bucket: 'secured4me',
                        Key: u.idKey
                    };
                    s3bucket.deleteObject(params,function(err, data){
                        if(!err){
                            s3bucket.upload(uploadParams, function (err, data) {
                                if (err) {
                                    console.log("Error", err);
                                }
                                if (data) {
                                    
                                    u.id = data.Location;
                                    u.idKey= data.Key;
                                    u.save(function(err2, user){
                                        if(err2){
                                           res.send({error: err2});
                                        } else{
                                            Subscription.findOne({
                                                name: user.plan
                                            },function(err, resp){
                                                if(err){
                                                    res.status(500).send({error: err});
                                                }else{
                                                    let features=[];
                                                    let tSend =  pick(user);
                                                    if(resp){
                                                        features = [... resp.features, ... resp.carry_over_features];
                                                    
                                                        tSend.features = features
                                                    } 
                                                    let extra = (60 * 60 * 24 * 365 * 1000 );
                                                   const exp = Math.floor(Date.now() / 1000) + extra;
                                                  var token = createToken(tSend, exp);
                                                   var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                                                  res.send({user_token: ciphertext.toString()
                                                 ,user:
                                                  tSend
                                                 });
            
                                                }
                                            })
                                            
                                           
                                        }
                                    })
            
                                }
                            });
                        }
                    })
                
                } else{
                    s3bucket.upload(uploadParams, function (err, data) {
                        if (err) {
                            console.log("Error", err);
                        }
                        if (data) {
                            
                            u.id = data.Location;
                            u.idKey= data.Key;
                            u.save(function(err2, user){
                                if(err2){
                                   res.send({error: err2});
                                } else{
                                    Subscription.findOne({
                                        name: user.plan
                                    },function(err, resp){
                                        if(err){
                                            res.status(500).send({error: err});
                                        }else{
                                            let features=[];
                                            let tSend =  pick(user);
                                            if(resp){
                                                features = [... resp.features, ... resp.carry_over_features];
                                            
                                                tSend.features = features
                                            } 
                                            let extra = (60 * 60 * 24 * 365 * 1000 );
                                           const exp = Math.floor(Date.now() / 1000) + extra;
                                          var token = createToken(tSend, exp);
                                           var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                                          res.send({user_token: ciphertext.toString()
                                         ,user:
                                          tSend
                                         });
    
                                        }
                                    })
                                    
                                   
                                }
                            })
    
                        }
                    });
                }
               
            }
        })

    }else{
        res.status(401).send({error:'Unauthorized'});
    }
}




/**
 * @swagger
 * /v1/auth/user/admin:
 *   post:
 *     tags:
 *       - Users
 *     name: Create new admin
 *     summary: Create new admin
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: picture
 *         type: file
 *         description: The Picture of the beneficiary or next of kin
 *       - in: formData
 *         name: first_name
 *         type: string
 *       - in: formData
 *         name: password
 *         type: string
 *         description: The beneficiary or next of kin first name
 *       - in: formData
 *         name: last_name
 *         type: string
 *         description: The beneficiary or next of kin last name name
 *       - in: formData
 *         name: usergroup_id
 *         type: string
 *         description: The usergroup_id of the admin
 *       - in: formData
 *         name: phone
 *         type: string
 *         description: The Phone
 *       - in: formData
 *         name: email
 *         type: string
 *         description: The Email Address
 *       - in: formData
 *         name: address
 *         type: string
 *         description: The house address
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */
exports.createAdmin = function(req, res, next) {
    var userData = req.body;

    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const currentuser = req.user ? req.user.data: {};
    if(validAdmin(currentuser) && userData.email && currentuser && currentuser._id && 
       userData.first_name && userData.last_name ) {
        const u ={};
        u.email = userData.email.toLowerCase();
        u.first_name =userData.first_name;
        u.last_name =userData.last_name;
        u.middle_name =userData.middle_name;
        u.phone =userData.phone;
        u.salt=bcrypt.genSaltSync(8);       
        u.hashed_pwd=bcrypt.hashSync(userData.password, u.salt, null)
        u.address = userData.address;
        u.usergroup_id = userData.usergroup_id;
        u.type =  'admin' 
        
        

        User.create(u, function(err, user) {
            if(err) {
                if(err.toString().indexOf('E11000') > -1) {

                    err = new Error('Duplicate Email');
                }

                res.status(400).send({error:err.toString()});
            } else{
               res.send({success: pick(user)})
               addPicture(req,user._id,);
            }

        });


    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};




/**
 * @swagger
 * /v1/auth/user/assign:
 *   get:
 *     tags:
 *       - Users
 *     name: Assign Admin to User
 *     summary: Assign Admin to User
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: admin_id
 *         type: string
 *         description: The admin_id of the admin
 *       - in: query
 *         name: user_id
 *         type: string
 *         description: The id of the client
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */
exports.AssignAdminclient = function(req, res, next) {
    var userData = req.body;

    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }

    const user_id = req.query['user_id'];
    const admin_id = req.query['admin_id'];
    const currentuser = req.user ? req.user.data: {};
    
    if(currentuser && currentuser._id && (validAdmin(currentuser)) && user_id && admin_id) {
 
        User.findOne({_id: user_id, type:'client'}, function(err0,u){
            if(err0) {
                res.status(500).send({error:err0})
            } else if(u){
                
                u.admin_id = admin_id;
              
              
                  
              
               
                u.save(function(err, user) {
                    if(err) {
                        if(err.toString().indexOf('E11000') > -1) {
        
                            err = new Error('Duplicate Email');
                        }
        
                        res.status(400).send({error:err.toString()});
                    } else{
                       res.send({success: pick(user)})
                    }
        
                });
              
              
                
            
           } else{
            
                res.status(404).send({error:'User not found'});
            
           }
           
        })
    }  else{
        res.status(403).send({error:'Invalid Request'});
    }
}

/**
 * @swagger
 * /v1/auth/user/beneficiary:
 *   put:
 *     tags:
 *       - Users
 *     name: Create next of kin or beneficiary
 *     summary: Create next of kin or beneficiary
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: user_id
 *         description: The Id of the beneficiary or next of kin
 *       - in: formData
 *         name: picture
 *         type: file
 *         description: The Picture of the beneficiary or next of kin
 *       - in: formData
 *         name: first_name
 *         type: string
 *         description: The beneficiary or next of kin first name
 *       - in: formData
 *         name: last_name
 *         type: string
 *         description: The beneficiary or next of kin last name name
 *       - in: formData
 *         name: relation
 *         type: string
 *         value: brother
 *         description: The beneficiary or next of kin relationship to the client 
 *       - in: formData
 *         name: type
 *         type: string
 *         enum: [kin, beneficiary]
 *         description: The type being created which can be kin or beneficiary
 *       - in: formData
 *         name: bvn
 *         type: string
 *         description: The Bvn
 *       - in: formData
 *         name: phone
 *         type: string
 *         description: The Phone
 *       - in: formData
 *         name: email
 *         type: string
 *         description: The Email Address
 *       - in: formData
 *         name: address
 *         type: string
 *         description: The house address
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */
exports.updateBeneKin = function(req, res, next) {
    var userData = req.body;

    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }

    const user_id = req.query['user_id'];
    const currentuser = req.user ? req.user.data: {};
    
    if(currentuser && currentuser._id && (validUser (currentuser) || validAdmin(currentuser))) {
        let id=  currentuser._id;
        if(user_id ){
          id = user_id;
        }
       
        User.findOne({_id: id}, function(err0,u){
            if(err0) {
                res.status(500).send({error:err0})
            } else if(u){
                

                if(userData.email){
                    u.email = userData.email.toLowerCase();
                }
                if(userData.type &&  (userData.type ==='kin' || userData.type ==='beneficiary')){
                    u.type = userData.type||'beneficiary' //beneficiary or kin
                }
                if(userData.first_name){
                    u.first_name =userData.first_name;
                }
                if( userData.last_name ){
                    u.last_name =userData.last_name;
                }
                if( userData.middle_name ){
                    u.middle_name =userData.middle_name;
                }
                if(userData.phone){
                    u.phone =userData.phone;
                }
                //if(userData.bvn){
                  //  u.bvn = userData.bvn;
               // }
                if(userData.relation){
                    u.relation = userData.relation;
                }
                if( userData.address){
                    u.address = userData.address;
                }
                u.save(function(err, user) {
                    if(err) {
                        if(err.toString().indexOf('E11000') > -1) {
        
                            err = new Error('Duplicate Email');
                        }
        
                        res.status(400).send({error:err.toString()});
                    } else{
                       res.send({success: pick(user)})
                       updatePicture(req,user._id,);
                    }
        
                });
              
              
                
            
           } else{
            
                res.status(404).send({error:'User not found'});
            
           }
           
        })
        

      


    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};


/**
 * @swagger
 * /v1/auth/user/admin:
 *   put:
 *     tags:
 *       - Users
 *     name: Update admin
 *     summary: Update admin
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: user_id
 *         description: The Id of the beneficiary or next of kin
 *       - in: formData
 *         name: picture
 *         type: file
 *         description: The Picture of the beneficiary or next of kin
 *       - in: formData
 *         name: first_name
 *         type: string
 *         description: The beneficiary or next of kin first name
 *       - in: formData
 *         name: last_name
 *         type: string
 *         description: The beneficiary or next of kin last name name
 *       - in: formData
 *         name: usergroup_id
 *         type: string
 *         description: The User Group Id
 *       - in: formData
 *         name: phone
 *         type: string
 *         description: The Phone
 *       - in: formData
 *         name: email
 *         type: string
 *         description: The Email Address
 *       - in: formData
 *         name: address
 *         type: string
 *         description: The house address
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */
exports.updateAdmin = function(req, res, next) {
    var userData = req.body;

    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }

    const user_id = req.query['user_id'];
    const currentuser = req.user ? req.user.data: {};
    
    if(currentuser && currentuser._id && (validAdmin(currentuser))) {
        let id=  currentuser._id;
        if(user_id ){
          id = user_id;
        }
       
        User.findOne({_id: id}, function(err0,u){
            if(err0) {
                res.status(500).send({error:err0})
            } else if(u){
                

                if(userData.email){
                    u.email = userData.email.toLowerCase();
                }
                if(userData.first_name){
                    u.first_name =userData.first_name;
                }
                if( userData.last_name ){
                    u.last_name =userData.last_name;
                }
                if( userData.middle_name ){
                    u.middle_name =userData.middle_name;
                }
                if(userData.phone){
                    u.phone =userData.phone;
                }
                if(userData.usergroup_id){
                    u.usergroup_id = userData.usergroup_id
                }
              
                if( userData.address){
                    u.address = userData.address;
                }
                u.save(function(err, user) {
                    if(err) {
                        if(err.toString().indexOf('E11000') > -1) {
        
                            err = new Error('Duplicate Email');
                        }
        
                        res.status(400).send({error:err.toString()});
                    } else{
                       res.send({success: pick(user)})
                       updatePicture(req,user._id,);
                    }
        
                });
              
              
                
            
           } else{
            
                res.status(404).send({error:'User not found'});
            
           }
           
        })
        

      


    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};



/**
 * @swagger
 * /v1/auth/user/all:
 *   get:
 *     tags:
 *       - Users
 *     name: Get list of user account (kin, beneficiary, client , admin, or law) or get the total
 *     summary: User List
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: user_id
 *         description: If an admin is trying to get list of kin and beneficiary of a client 
 *       - in: query
 *         name: limit
 *         description: Number of items to return. Default is 10
 *         value: 10
 *       - in: query
 *         name: skip
 *         description: Number of items to skip. 
 *       - in: query
 *         name: plan
 *         description: Number of items to skip. 
 *       - in: query
 *         name: subscription
 *         enum: [active, inactive]
 *         description: Get Users by subscription acttive or inactive
 *       - in: query
 *         name: last_access
 *         type: string
 *         format: date
 *         description: The last day of access
 *       - in: query
 *         name: plan
 *         description: Get Users by plan types (admin). 
 *       - in: query
 *         name: count
 *         description: If this value is set the total of the item is returned
 *       - in: query
 *         name: type
 *         description: the type of user
 *         enum: [kin, beneficiary, client, admin, law]
 *     responses:
 *       '200':
 *         description: User Account
 *       '403':
 *         description: Invalid Request
 */
exports.getUsers = function(req, res, next){
    const limit= parseInt(req.query['limit'], 10)||10;
    const skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    let type = req.query['type']||'beneficiary'; 
    const user_id = req.query['user_id'];
    const subscription_plan = req.query['plan'];
    const subscription = req.query['subscription'];
    const last_access = req.query['last_access'];
    const currentuser = req.user ? req.user.data: {};
    if(validUser(currentuser) || validAdmin(currentuser)){
       let q={super: false, deleted: false};
        if(currentuser.type === 'client'){
            if(type !=='beneficiary'&& type!=='kin' && type!='law'){
                type='beneficiary';
            }
            if(type!='law'){
                q.beneficent_id = currentuser._id;
            }
            
        } else if(currentuser.type === 'admin'){
            if(user_id){
                if(type !=='beneficiary'&& type!=='kin' ){
                    type='beneficiary';
                }  
                q.beneficent_id = user_id
            } else{
                if(!currentuser.super){
                    if(type !=='beneficiary'&& type!=='kin'
                     && type==='law' && type!=='client'){
                        type='client';
                    }   
                }
            }
           if(subscription_plan ) {
             q.plan = subscription_plan ;
           }
           if(subscription) {
             q.payment_active = subscription === 'active' ;
          }
          if(last_access) {
              const l = new Date(last_access);
              l.setHours(0);
              l.setMinutes(0);
              l.setSeconds(0)
              l.setMilliseconds(0);
            q.last_login = {$lte: l} ;
         }
        } else{
           q._id= currentuser._id;
        }
        q.type= type;
        if(count){
            User.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            User.find(q,{},{sort:{createdAt: -1, updatedAt:-1},limit, skip}, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({success: resp})
                }
            }).sort({ updatedAt:-1, createdAt: -1, }, ).limit(limit).skip(skip);
        }

    }else{
        res.status(403).send({error:'Invalid Request'});
    }

    
}

/**
 * @swagger
 * /v1/auth/user/search:
 *   get:
 *     tags:
 *       - Users
 *     name: Search user account (kin, beneficiary, client , admin, or law) or get the total
 *     summary: User List
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: user_id
 *         description: If an admin is trying to get list of kin and beneficiary of a client 
 *       - in: query
 *         name: q
 *         description: The search query string
 *       - in: query
 *         name: limit
 *         description: Number of items to return. Default is 10
 *         value: 10
 *       - in: query
 *         name: skip
 *         description: Number of items to skip. 
 *       - in: query
 *         name: plan
 *         description: Number of items to skip. 
 *       - in: query
 *         name: plan
 *         description: Get Users by plan types (admin). 
 *       - in: query
 *         name: count
 *         description: If this value is set the total of the item is returned
 *       - in: query
 *         name: type
 *         description: the type of user
 *         enum: [kin, beneficiary, client, admin, law]
 *     responses:
 *       '200':
 *         description: User Account
 *       '403':
 *         description: Invalid Request
 */
exports.searchUser = function(req, res){
    const q =req.query['q'].trim();
    const limit= parseInt(req.query['limit'], 10)||10;
    const skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    let type = req.query['type']||'beneficiary'; 
    const user_id = req.query['user_id'];
    const subscription_plan = req.query['plan'];
    const currentuser = req.user ? req.user.data: {};
    if(validUser(currentuser) || validAdmin(currentuser) && q){
        const query= {
            $text: {$search: q},super: false, deleted: false}
        
    
        if(currentuser.type === 'client'){
            if(type !=='beneficiary'&& type!=='kin' && type!='law'){
                type='beneficiary';
            }
            if(type!='law'){
                query.beneficent_id = currentuser._id;
            }
            
        } else if(currentuser.type === 'admin'){
            if(user_id){
                if(type !=='beneficiary'&& type!=='kin' ){
                    type='beneficiary';
                }  
                q.beneficent_id = user_id
            } else{
                if(!currentuser.super){
                    if(type !=='beneficiary'&& type!=='kin'
                     && type==='law' && type!=='client'){
                        type='client';
                    }   
                }
            }
           if(subscription_plan ) {
             query.plan = subscription_plan ;
           }
        } else{
           query._id= currentuser._id;
        }
        query.type= type;
        if(count){
            User.countDocuments(query, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            User.find(query,{},{sort:{createdAt: -1, updatedAt:-1},limit, skip}, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({success: resp})
                }
            }).sort({ updatedAt:-1, createdAt: -1, }, ).limit(limit).skip(skip);
        }

    }else{
        res.status(403).send({error:'Invalid Request'});
    }
}





const addPicture=function(req, id, callback){
    
    callback=(typeof callback==="undefined")?function(){}:callback;
    if( req.files && Object.keys(req.files).length>0 && req.files['picture']){
    let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,

    });
    var uploadParams = {Bucket: 'secured4me', Key: '', Body: '', ACL: 'public-read'};
    const tot =[];
    var fileStream = fs.createReadStream(req.files['picture'].path);
    fileStream.on('error', function(err) {
        console.log('File Error', err);
    });
    uploadParams.Body = fileStream;

    uploadParams.Key = "pictures/" + id +'/'+ (req.files['picture'].originalname || req.files['picture'].name);
// call S3 to retrieve uploads file to specified bucket
    s3bucket.upload (uploadParams, function (err, data) {
        if (err) {
            console.log("Error", err);
        } if (data) {
            // console.log("Upload Success", data.Location);
            User.findOne({_id:id}, function(err, resp){
               if(err){
                   console.log(err);
               } else{
                  resp.picture=data.Location;
                  resp.pictureKey=data.Key;
                  resp.save(callback);
               }
            })
           
        }
    });
}
}

const updatePicture=function(req, id, callback){
    callback=(typeof callback==="undefined")?function(){}:callback;
    //const files = Object.keys(req.files);
    if(req.files && Object.keys(req.files).length>0){
    let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,

    });
    var uploadParams = {Bucket: 'secured4me', Key: '', Body: '', ACL: 'public-read'};
    const tot =[];
    var fileStream = fs.createReadStream(req.files['picture'].path);
    fileStream.on('error', function(err) {
        console.log('File Error', err);
    });
    uploadParams.Body = fileStream;

    uploadParams.Key = path.basename(req.files['picture'].path);
     User.findOne({_id:id}, function(err, resp){
        if(err){
            console.log(err);
        } else{
            if(resp.pictureKey){
                var params = {
                    Bucket: 'secured4me',
                    Key: resp.pictureKey
                  };
                  s3bucket.deleteObject(params, function(err, dat){
                      if(err){
                          callback(err, null)
                      }else{
                        s3bucket.upload (uploadParams, function (err, data) {
                            if (err) {
                                console.log("Error", err);
                            } if (data) {
                                // console.log("Upload Success", data.Location);
                                
                                      resp.picture=data.Location;
                                      resp.pictureKey=data.Key;
                                      resp.save(callback);
                                 
                               
                            }
                        });
                      }
                  })
            }else{
                s3bucket.upload (uploadParams, function (err, data) {
                    if (err) {
                        console.log("Error", err);
                    } if (data) {
                        // console.log("Upload Success", data.Location);
                        
                              resp.picture=data.Location;
                              resp.pictureKey=data.Key;
                              resp.save(callback);
                         
                       
                    }
                });  
            }
        
        }
     })
    }

}
/**
 * @swagger
 * /v1/auth/user/resendverify:
 *   post:
 *     tags:
 *       - Users
 *     name: Resend Verification token
 *     summary: Resend Email verification
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             type:
 *               type: string
 *         required:
 *           - email
 *        
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */
exports.resendEmailVeri = function(req, res){
    var userData = req.body;

    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
   let  type = userData.type||'client'
    if(userData.email) {
        User.findOne({
           email: userData.email,
           type
        }, function(err, user){
            if(err){
                res.status(500).send({error:err})
            } else{
                if(user && user._id){
                    forgot.addEmail(user.email,type);
                    res.send({success: 'sent'})
                } else{
                    res.status(404).send({error: "User not found"})
                }
              
            }
        })
   

    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};




/**
 * @swagger
 * /v1/auth/user/email:
 *   post:
 *     tags:
 *       - Users
 *     name: Activate User Email
 *     summary: Activate User by Email
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             type:
 *               type: string
 *             token:
 *               type: string
 *         required:
 *           - email
 *           - token
 *     responses:
 *       '200':
 *         description: User created
 *       '500':
 *         description: Db Error
 *       '403':
 *         description: Invalid Request
 */
exports.activateUserByEmail = function(req, res, next) {
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    let  type = userData.type||'client'
    if(userData.email && userData.token) {

        forgot.getForgotI(userData.email, userData.token,'email',type, function(err, f){
            if (err) {
                res.send({error:err});
            } else {
                if(f && f._id){
                    
         User.findOne({email: userData.email, type},{},{sort: {created_at: -1, updated_at: -1}}, function(err, u){
            if(err){
                res.send({error: err});
            } else{
                u.email_verified = true;
                if(u.bvn_verified
                //&& u.id_verified
                ){
                  u.verified= true;
                }
                u.save(function(err,user){
                    if(err){
                        res.send({error: err});
                    } else{
                        Subscription.findOne({
                            name: user.plan
                        },function(err, resp){
                            if(err){
                                res.status(500).send({error: err});
                            }else{
                                let features=[];
                                let tSend =  pick(user);
                                if(resp){
                                    features = [... resp.features, ... resp.carry_over_features];
                                
                                    tSend.features = features
                                } 
                                let extra = (60 * 60 * 24 * 365 * 1000 );
                               const exp = Math.floor(Date.now() / 1000) + extra;
                              var token = createToken(tSend, exp);
                               var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                              res.send({user_token: ciphertext.toString()
                             ,user:
                              tSend
                             });

                            }
                        })
                        if(userData.device_type && userData.push_id){
                            user.device_type=userData.device_type;
                            user.push_id = userData.push_id;
                            user.save();
                        }
                    }
                })
            }
        })
                } else{
                    res.status(403).send({error:'Invalid Token'}); 
                }
            }})
       


    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};


/**
 * @swagger
 * /v1/auth/user/password:
 *   put:
 *     tags:
 *       - Users
 *     name: Change password with token
 *     summary: Change password with token
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             type:
 *               type: string
 *             token:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - email
 *           - token
 *           - password
 *     responses:
 *       '200':
 *         description: User created
 *       '500':
 *         description: Db Error
 *       '403':
 *         description: Invalid Request
 */
exports.updatePassword=function(req, res){
    var userUpdates = req.body;
    if(typeof  userUpdates === 'string' ||userUpdates instanceof String ){
        userUpdates = JSON.parse(userUpdates) ;
    }
    const email = userUpdates.email;
    const password = userUpdates.password;
    const token = userUpdates.token;

    let  type = userUpdates.type||'client'
    forgot.getForgotI(email, token,'forgot', type, function(err, f){
        if (err) {
            res.send({error:err});
        } else {
            if(f && f._id){
                User.findOne({email: userUpdates.email, type },function(err,user) {
                    if (err) {
                        res.send({error:err});
                    }
                    else {

                        if (user === null) {
                            res.send({error: "user does not exist"})
                        }else{
                            user.salt=bcrypt.genSaltSync(8);
                            user.hashed_pwd=bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
                            user.save(function(err, u){
                                if(err){
                                    res.send({error: "user does not exist"})
                                } else{
                                    res.send({success: true})
                                    f.expire=Date.now();
                                    f.save();
                                }
                            });


                        }
                    }
                })
            } else{
                res.send({error:'Token Expired'});
            }

        }
    })


}





 exports.addCard= function(req,res){
     var userData = req.body;
     if(typeof  userData === 'string' || userData instanceof String ){
         userData = JSON.parse(userData) ;
     }
     const user = req.user ? req.user.data: {};
     if(user && user._id && userData.token){
         User.findOne({
             _id: user._id
         },function(err, resp){
             if(err){
                 res.send({error: err});
             } else{
                 if(resp && resp._id && resp.token){
                     stripe.customers.update(resp.token, {
                         description: 'Customer for '+user.email,
                         source: userData.token
                     }, function(err, customer) {
                         if(err) {
                             res.send({error:err});
                         } else{
                             stripe.charges.create({
                                 amount: 50,
                                 currency: "eur",
                                 source: customer.default_source, // obtained with Stripe.js
                                 description: "Charge for "+ user.email,
                                 customer: customer.id
                             }, function(err, charge) {
                                 if(err) {
                                     res.send({error:err});
                                     resp.payment_active = false;
                                     resp.save();
                                 }else{
                                    resp.payment_active = true;
                                    var now = new Date();
                                    now.setMonth(now.getMonth()+1);
                                     
                                     resp.payment_due = now.toISOString();
                                     resp.token = customer.id;
                                   
                                     resp.save(function(err3, resp3){
                                         if(err3){
                                             res.send({error: err3});
                                         } else{
                                             let extra = (60 * 60 * 24 * 365 * 1000 );
                                             const exp = Math.floor(Date.now() / 1000) + extra;
                                             var token = createToken(resp3, exp);
                                             var ciphertext = CryptoJS.AES.encrypt(token, config.secret);

                                             res.send({user_token: ciphertext.toString(), secret: config.secret});

                                         }
                                     });
                                     stripe.refunds.create({
                                         charge: charge.id
                                     }, function(err, refund) {
                                         // asynchronously called
                                     });

                                 }
                             });
                         }
                     });
                 } else {
                     stripe.customers.create({
                         description: 'Customer for '+user.email,
                         source: userData.token, email: user.email
                     }, function(err, customer) {
                         if(err) {
                             res.send({error:err});
                         } else{
                             resp.token = customer.id;
                             resp.save(function(err,resp2){
                                 if(err) {
                                     if(err.toString().indexOf('E11000') > -1) {
                                         err = new Error('Duplicate Card');
                                     }

                                     res.status(400).send({error:err.toString()});

                                 } else {

                                     stripe.charges.create({
                                         amount: 50,
                                         currency: "eur",
                                         source: customer.default_source, // obtained with Stripe.js
                                         description: "Charge for "+user.email,
                                         customer: customer.id
                                     }, function(err, charge) {
                                         if(err) {
                                             res.send({error:err});
                                             resp2.payment_active = false;
                                             resp2.save();
                                         }else{

                                             resp2.payment_active = true;
                                            var now = new Date();
                                             now.setMonth(now.getMonth()+1);
                                              
                                              resp.payment_due = now.toISOString();
                                             resp2.save(function(err3, resp3){
                                                 if(err3){
                                                     res.send({error: err3});
                                                 } else{
                                                     let extra = (60 * 60 * 24 * 365 * 1000 );
                                                     const exp = Math.floor(Date.now() / 1000) + extra;
                                                     var token = createToken(resp3, exp);
                                                     var ciphertext = CryptoJS.AES.encrypt(token, config.secret);

                                                     res.send({user_token: ciphertext.toString(), secret: config.secret});

                                                 }
                                             });
                                             stripe.refunds.create({
                                                 charge: charge.id
                                             }, function(err, refund) {
                                                 // asynchronously called
                                             });
                                         }
                                     });
                                 }
                             })
                         }
                     });
                 }
             }
         })


     } else{
         res.status(403).send({error:'Unauthorized'});
     }

 }

exports.updatePushId = function(req, res,next){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const u = req.user ? req.user.data: {};
    if(u && u._id) {
        User.findOne({email: u.email, typ: u.type}, function (err, user) {
            if (err) {
                res.send({error: err});
            } else {
                user.device_type = userData.device_type;
                user.push_id = userData.push_id;
                user.save(function (err, u) {
                    if (err) {
                        res.send({error: err});
                    } else {
                        res.send({success: true});
                    }
                });
            }
        })
    } else{
        res.status(403).send({error:'Invalid Request'});
    }

}

exports.getNotif= function(req, res){
    let  limit= parseInt(req.query['limit'], 10)||10;
    let skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    const user = req.user ? req.user.data: {};
    if(user && user._id && user.type==='carer'){
        if(count){
            Notif.countDocuments({owner:user._id}, function(err,resp){
                if(err){
                    res.send({error: err})
                }else{
                    res.send({count: resp})
                }
            })
        } else{
            Notif.find({owner:user._id},function(err,resp){
                if(err){
                    res.send({error: err})
                }else{
                    res.send({success: resp})
                }
            })
        }
    }
}
/**
 * @swagger
 * /v1/auth/user/signup:
 *   post:
 *     tags:
 *       - Users
 *     name: Register
 *     summary: Register a new user
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             type:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - username
 *           - email
 *           - password
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or email already taken
 */

exports.createUser = function(req, res, next) {
    var userData = req.body;

    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    let c_name= '';
    let pass =userData.password||nid();
    if(userData.email && userData.first_name && userData.last_name && pass) {
        const u ={};
        u.email = userData.email.toLowerCase();
        u.salt=bcrypt.genSaltSync(8);       
            u.hashed_pwd=bcrypt.hashSync(userData.password, u.salt, null)
        


        u.first_name =userData.first_name;
        u.last_name =userData.last_name;
        u.phone =userData.phone;
        u.type = userData.type||'client'
        

        User.create(u, function(err, user) {
            if(err) {
                if(err.toString().indexOf('E11000') > -1) {

                    err = new Error('Duplicate Email');
                }

                res.status(400).send({error:err.toString()});
            } else{
                Subscription.findOne({
                    name: user.plan
                },function(err, resp){
                    if(err){
                        res.status(500).send({error: err});
                    }else{
                        let features=[];
                        let tSend =  pick(user);
                        if(resp){
                            features = [... resp.features, ... resp.carry_over_features];
                        
                            tSend.features = features
                        } 
                        let extra = (60 * 60 * 24 * 365 * 1000 );
                       const exp = Math.floor(Date.now() / 1000) + extra;
                      var token = createToken(tSend, exp);
                       var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                      res.send({user_token: ciphertext.toString()
                     ,user:
                      tSend
                     });

                    }
                })
                forgot.addEmail(user.email, userData.type||'client');
                if(userData.device_type && userData.push_id){
                    user.device_type=userData.device_type;
                    user.push_id = userData.push_id;
                    user.save();
                }
            }

        });


    } else{
        res.status(403).send({error:'Invalid Request'});
    }

};


/**
 * @swagger
 * /v1/auth/user/:
 *   delete:
 *     tags:
 *       - Users
 *     name: Delete a user account (kin, beneficiary,lawyer, client or admin)
 *     summary: If user_id is not specified current user is deleted
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: user_id
 *     responses:
 *       '200':
 *         description: User Deleted
 *       '403':
 *         description: Invalid Request
 */
exports.removeUser = function(req, res){
    const user = req.user ? req.user.data : {};
     const user_id = req.query['user_id'];
     if(user && user._id && (validUser (user) || validAdmin(user))){
        let id=  user._id;
        if(user_id ){
           id = user_id;
        }
        const q= {
            _id:id
        };
        if(user.type!=='admin' && !user.super && user_id){
           q.beneficent_id = user._id
        }
        User.findOne(q, function(err, u){
            if(err){
                req.status(500).send({error:err})
            } else{
                if(u.deleted){
                    res.status(403).send({success: 'User already deleted'});
                } else{
                    if(u && u._id){
                        u.deleted = true;
                        u.save(function(err2, user2){
                            if(err2){
                                req.status(500).send({error:err2}) 
                            } else{
                                res.send({success: 'Deleted Successfully'});
                            }
                        })
                    } else{
                        res.status(404).send({error:'User not found'});
                    }
                   
                }
                
            }
        })
     }else{
        res.status(403).send({error:'Invalid Request'});
    }
}
const doDownload= function(st,res){
    console.log(st);
    const fn1 =new Date().getTime()+'_aa.csv'
    fs.writeFile(fn1 , st, function(err, data){
        if (err){ console.log(err);}
        else{
            res.set('Content-disposition', 'attachment; filename=testing.csv');
            res.set('Content-Type', 'text/csv');
            res.download(fn1,fn1, (err)=>{
                //CHECK FOR ERROR

                fs.unlink(fn1, (err) => {
                    if (err){ console.log(err)}
                    else{
                        // console.log('was deleted');
                    }

                });
            });
        }
    });
}






function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }


    return true && JSON.stringify(obj) === JSON.stringify({});

    
}

const createLog = function(req,type, c, type_id, description){
    const user = req.user ? req.user.data : {};
    if(user && user._id && (validUser(user))){
        const l={
            creator_id: user._id,
            type, description,
            class:c
        }
        if(type_id){
            l.type_id = type_id
        }
        const log = new Log(l);
        log.save(function(err, resp){
            console.log(err || resp);
        })
    }
    
}
const AdmincreateLog = function(req,user_id, type, c, type_id, description){
    const user = req.user ? req.user.data : {};
    if(user && user._id && (validAdmin(user))){
        const l={
            admin_id: user._id,
            creator_id: user_id, type, description, type_id,
            class:c
        }
        const log = new Log(l);
        log.save(function(err, resp){
            console.log(err || resp);
        })
    }
    
}
exports.createLog = createLog;
exports.AdmincreateLog = AdmincreateLog;
exports.canLogin=canLogin
exports.pick = pick
exports.createToken =createToken
exports.validUser = validUser
exports.validUserPay = validUserPay
exports.validAdmin =  validAdmin