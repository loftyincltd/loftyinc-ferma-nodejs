
'use strict';
const User = require('mongoose').model('User');
const Fingerprint = require('mongoose').model('Fingerprint');
const Log = require('mongoose').model('Log');
const bcrypt   = require('bcrypt-nodejs');
const jwt     = require('jsonwebtoken');
const moment = require('moment')
const _       = require('lodash');
var CryptoJS = require("crypto-js");
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];
var fs= require('fs');
var Jimp = require('jimp');
const district = require('../../dist.json')

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const path = require('path');

const select = {
    first_name:1,last_name:1,middle_name:1,_id:1,profile_pic: 1,username:1, phone:1, gender:1, rating:1, available:1, picture:1,location_privacy:1, state:1, district:1
}

function createToken(user, exp) {
    const dat = {
        exp: exp|| Math.floor(Date.now() / 1000) + (60 * 60),
        data: pick(user)
    }                 
    return jwt.sign(dat, config.secret,);
}
function pick(user){
    return _.pick(user, 'type','relation','death_certificate','super','usergroup_id','admin_id', 'deleted', 'address','bvn','verified','username_verified','bvn_verified','username','phone','first_name','last_name','middle_name','_id','relation','company_id', 'plan','picture','payment_active','address', 'security_questions',
    'security_answers', 'bvn','lawyer_id','beneficent_id','beneficent_deceased', 'occupation','rating', 'plan', 'payment_due','last_login','gender','credit', 'location_privacy','tags'
    ,'location','available','skip_help', 'skip_danger_zone', 'help_radius','danger_radius','state', 'district');
}
const validUser= function (u){
   return ( (u.type==='customer') && u.deleted ===false )
}



const validAdmin = function (u){
    return (u.type === 'staff' || u.type === 'admin'|| u.super) && u.deleted ===false;
 }


const canLogin = function(u){
     if(
     u.type === 'admin' || u.type === 'customer' 
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
 *             username:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - username
 *           - password
 *         example:   # Sample object
 *           username: michaelfemi81@gmail.com
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


        User.findOne( {username: userData.username, type: 'admin'},function(err,user){
            // bcrypt.compare()
            if(err){

             res.send({error: err});
            }
            else{

                if(user===null){
                    res.send({error: "user does not exist"});
                }
                else{
                    bcrypt.compare(userData.password,user.hashed_pwd,function(err,resp){
                        if(err){
                            res.send({error: err});

                        }
                        else{

                            if(resp){
                               
                                    let extra = (60 * 60 * 24 * 365 * 1000 );
                                    const exp = Math.floor(Date.now() / 1000) + extra;
                                    var token = createToken(user, exp);
                                    var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                                    if ((user.admin || user.partner)) {
                                        res.send({user_token: ciphertext.toString(),});
                                    } else {
                                        res.send({user_token: ciphertext.toString(),});
                                    }
                                
                        
                               
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
 * /v1/auth/user/single:
 *   get:
 *     tags:
 *       - User
 *     name: GET User
 *     security:
 *       - bearerAuth: []
 *     summary: Get the user details
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: user_id
 *     responses:
 *       '200':
 *         description: User details
 *       '500':
 *         description: Db Error
 */
exports.getSingleUser=function(req, res, next){
    const user = req.user ? req.user.data: {};
     let user_id = req.query['user_id'];
    if(user && user._id && user_id){
        User.findById({
            _id: user_id
        }, function(err, user){
            if(err){
                res.status(500).send({error: err});
            } else{
                   res.send({
                       success: true,
                         user:pick(user)
                          
                         });
            }
        }).select(select);
    } else{
        res.status(403).send({error:'Invalid Request'});
    }
}


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
exports.getMyDetails=function(req, res, next){
    const u = req.user ? req.user.data: {};
    if(u && u._id){
        User.findOne({
            _id: u._id
        }, function(err, user){
            if(err){
                res.status(500).send({error: err});
            } else{
                let tSend =  pick(user);

                if(u.type=='admin'  || u.type == 'merchant'){
                   
                            let extra = (60 * 60 * 24 * 365 * 1000 );
                           const exp = Math.floor(Date.now() / 1000) + extra;
                          var token = createToken(tSend, exp);
                           var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                            res.send({user_token: ciphertext.toString()
                         ,user:
                          tSend
                         });

                        
                    
                } else{
                    let extra = (60 * 60 * 24 * 365 * 1000 );
                    const exp = Math.floor(Date.now() / 1000) + extra;
                   var token = createToken(tSend, exp);
                    var ciphertext = CryptoJS.AES.encrypt(token, config.secret);
                   res.send({user_token: ciphertext.toString()
                  ,user:
                   tSend
                  });
                }
            }
        })
    } else{
        res.status(403).send({error:'Invalid Request'});
    }
}


/**
 * @swagger
 * /v1/auth/user/stat:
 *   get:
 *     tags:
 *       - Users
 *     name: GET User
 *     security:
 *       - bearerAuth: []
 *     summary: Get the user stat
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
exports.getStat=function(req, res, next){
    const u = req.user ? req.user.data: {};
    if(u && u._id &&(u.type=="admin")){
        const states = Object.keys(district);
        const datums =[];
        const aa=[];
        states.forEach((elt, index)=>{
              User.countDocuments({
                 deleted: false,
                 type:'customer',
                 state:  states[index]
              }, function(err, count){
                  if(err){
                      res.send({error:err})
                  }else{
                    const c = {
                        x:states[index]+"",
                        y: count
                    }
                    datums[index]= c;
                    aa.push(true)
                    if(aa.length==states.length){
                       res.send({success: datums})
                    }
                  }
              });
           
        
        
    
    });
    } else{
        res.status(403).send({error:'Invalid Request'});
    }
}

/**
 * @swagger
 * /v1/auth/user/gender:
 *   get:
 *     tags:
 *       - Users
 *     name: GET User
 *     security:
 *       - bearerAuth: []
 *     summary: Get the user stat
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
exports.getGender=function(req, res, next){
    const u = req.user ? req.user.data: {};
    if(u && u._id &&(u.type=="admin")){
        const gender = ["male", "female"];
        const aa=[];
        const c = {
                       
        }
       gender.forEach((elt, index)=>{
           
              User.countDocuments({
                 deleted: false,
                 type:'customer',
                 gender:  elt
              }, function(err, count){
                  if(err){
                      res.send({error:err})
                  }else{
                   
                    c[elt]= count
                    aa.push(true)
                    if(aa.length==gender.length){
                       res.send({success: c})
                    }
                  }
              });
           
        
        
    
    });
    } else{
        res.status(403).send({error:'Invalid Request'});
    }
}

/**
 * @swagger
 * /v1/auth/user/phone:
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
 *     parameters:
 *       - in: query
 *         name: phone
 *       - in: query
 *         name: type
 *         enum: [customer, agent, merchant, admin]
 *     responses:
 *       '200':
 *         description: User details
 *       '500':
 *         description: Db Error
 */
exports.getSingleUserPhone=function(req, res, next){
    const u = req.user ? req.user.data: {};
    const phone = req.query['phone']+"";
    const type = req.query['type'];
    if(u && u._id){
        User.findOne({
            phone, type, deleted: false
        }, function(err, user){
            if(err){
                res.status(500).send({error: err});
            } else{
                res.send({success: pick(user)})
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
                                console.log(err);
                                if(err){
                                    res.status(500).send({error: err});
                                } else{
                                    res.send({success: true});
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
 *               enum: [customer,  admin]
 *             username:
 *               type: string
 *             bvn:
 *               type: string
 *             phone:
 *               type: string
 *             mode_of_identification:
 *               type: string
 *               enum: [driver_license, international_passport]
 *             mode_of_transportation:
 *               type: string
 *               enum: [car, motorcycle]
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - username
 *           - username
 *           - password
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or username already taken
 */

exports.createUser = function(req, res, next) {
    var userData = req.body;
    const user = req.user ? req.user.data : {};
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    let pass =userData.password
    if(userData.first_name && userData.last_name && user.type==='admin' &&
    ((user.super && userData.type ==='admin') ||userData.type ==='customer' )
    ) {
        const u ={};
        if(userData.username){
            u.username = userData.username.toLowerCase();
        }

        if(pass){
            u.salt=bcrypt.genSaltSync(8);       
            u.hashed_pwd=bcrypt.hashSync(userData.password, u.salt, null)
        }
      
        

        u.type = userData.type||'customer'  
        u.first_name =userData.first_name;
        u.last_name =userData.last_name;
        u.phone =userData.phone;
        u.address =userData.address;
        u.gender =userData.gender;
        u.bvn = userData.bvn;
        u.nin = userData.nin;
        u.state = userData.state;
        u.lga = userData.lga;
        u.occupation= userData.occupation
        u.bank = userData.bank;
        u.gender= userData.gender;
        u.account = userData.account;
        u.account_name = userData.account_name;
        if(userData.dob){
            u.dob = new Date(userData.dob)
        }

          if(!user.super){
            u.state = user.state;
            u.district = user.district
           }

      
        User.create(u, function(err, user) {
            if(err) {
                if(err.toString().indexOf('E11000') > -1) {

                    err = new Error('Duplicate username');
                }

                res.status(400).send({error:err.toString()});
            } else{
                //res.send ({success: true})
                if(!userData.fingerprint){
                            res.send ({success: true, user})
                        } else{
                            userData.user_id  = user2._id;
                            fprint(userUpdates)
                        }
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
 *             mode_of_identification:
 *               type: string
 *               enum: [driver_license, international_passport]
 *             mode_of_transportation:
 *               type: string
 *               enum: [car, motorcycle]
 *             longitude:
 *               type: string
 *             latitude:
 *               type: string
 *             phone:
 *               type: string
 *             danger_radius:
 *               type: string
 *             help_radius:
 *               type: string
 *             location_privacy:
 *               type: string
 *             skip_danger_zone:
 *               type: string
 *             skip_help:
 *               type: string
 *             device_type:
 *               type: string
 *             push_id:
 *               type: string
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or username already taken
 */
exports.updateUser = function(req, res) {
    var userUpdates = req.body;
    if(typeof  userUpdates === 'string' || userUpdates instanceof String ){
        userUpdates = JSON.parse(userUpdates) ;
    }
    const user = req.user ? req.user.data : {};
    // const otp = req.query['otp'];
     if(user && user._id){
        let  q= {_id: user._id};
        if(user.type === 'admin' && userUpdates._id){
            q._id = userUpdates._id
           if(!user.super){
            q.state = user.state;
            q.district = user.district
           }
        }
         User.findOne(q, function(err, user1){
            if(err){
                res.send({error: err});
            } else{
                console.log(user1, userUpdates)
                 if(userUpdates.dob && !user1.dob){
                    user1.dob = typeof 
                    userUpdates.dob === 'object' ? userData.dob
                    :typeof userUpdates.dob === 'string'? 
                    new Date(userUpdates.dob ):userUpdates.dob ;
                 }
            
                if(userUpdates.first_name){
                    user1.first_name = userUpdates.first_name;
                }
                if(userUpdates.last_name){
                    user1.last_name = userUpdates.last_name;
                }
                if(userUpdates.address){
                    user1.address = userUpdates.address;
                }
                
                if(userUpdates.phone){
                    user1.phone = userUpdates.phone;
                }
                if(userUpdates.nin){
                    user1.nin = userUpdates.nin;
                }
                if(userUpdates.state){
                    user1.state = userUpdates.state;
                }
                if(userUpdates.lga){
                    user1.lga = userUpdates.lga;
                }
                if(userUpdates.occupation){
                    user1.occupation = userUpdates.occupation;
                }
                if(userUpdates.bank){
                    user1.bank = userUpdates.bank;
                }
                if(userUpdates.account){
                    user1.account = userUpdates.account;
                }
                if(userUpdates.account_name ){
                    user1.account_name  = userUpdates.account_name ;
                }
               
             
               
                if(!user.super){
                    user1.state = user.state;
                    user1.district = user.destrict
                   }else{
                    user1.district =  userUpdates.district ;
                    user1.state =  userUpdates.state ;
                   }
              
                if(userUpdates.bvn){
                    user1.bvn = userUpdates.bvn;
                }
                if(userUpdates.gender){
                    user1.gender = userUpdates.gender;
                }
             
               
             
                
                    
                
                user1.save(function(err2, user2){
                    if(err2){
                        res.send({error: err2});
                    } else{
                        if(!userUpdates.fingerprint){
                            res.send ({success: true,user: user2})
                        } else{
                            userUpdates.user_id  = user2._id;
                            fprint(userUpdates)
                        }
                       
                       
                    }
                })
               
               
            }
           
         })

     }

};

/**
 * @swagger
 * /v1/auth/user/fingerprint:
 *   put:
 *     tags:
 *       - Users
 *     name: Update
 *     summary: Update user fingerprint
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
 *             user_id:
 *               type: string
 *             fingerprint:
 *               type: string
 *     responses:
 *       '200':
 *         description: User created
 *       '400':
 *         description: Username or username already taken
 */
exports.updateUserFingerprint = function(req, res) {
    var userUpdates = req.body;
    if(typeof  userUpdates === 'string' || userUpdates instanceof String ){
        userUpdates = JSON.parse(userUpdates) ;
    }
    const user = req.user ? req.user.data : {};
    // const otp = req.query['otp'];
     if(user && user._id &&  userUpdates.fingerprint && userUpdates.user_id){

             
       fprint(userUpdates, res);
           
       

     }

};

const fprint = function (userUpdates, res){
    let url =  userUpdates.fingerprint.replace(/^data:image\/\w+;base64,/, "");
    let buffer = Buffer.from(url, 'base64');
    
    Jimp.read(buffer).then(img => {
         img.greyscale().getBuffer(Jimp.MIME_TIFF, function(err, buffer){
            if(err){
                res.send({error:err})
            }else{
                if(buffer){
                    const q={
                        creator_id: userUpdates.user_id,
                        right: true, 
                        type:'image/tiff',
                        finger:'thumb'
                    };
                    Fingerprint.findOne(q, function(err, fingerprint){
                        if(err){
                            res.send({error:err})
                        }else{
                            if(fingerprint){
                                fingerprint.data = buffer;
    
                                fingerprint.save(function(err, fingerprint){
                                    if(err){
                                        res.send({error: err})
                                    }else{
                                        res.send({success: true});
                                    }
                                })
                            }else{
                                q.data = buffer;
                                const f = new Fingerprint(q);
                                f.save(function(err, fingerprint){
                                    if(err){
                                        res.send({error: err})
                                    }else{
                                        res.send({success: true});
                                    }
                                })
                            }
                        }
                    })
                }else{
                    res.send({error:"Unable to generate buffer"})
                }
            }
         })
        
        /*.getBase64(Jimp.AUTO, src => {
            //console.log('src');
        });**/
    }).catch(function(err) {
        res.send({error:err})
    });
}

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
    const count = req.query['count']=="true"? true: false;
    let qs =req.query['q'];
    const all = req.query['all']=="true"? true: false;
    let type = req.query['type']||'customer'; 
    let state = req.query['state'];
    let district = req.query['district'];
    let occupation = req.query['occupation'];
    const download = req.query['download']=="true"? true: false;
    const user = req.user ? req.user.data: {};
    if(!user.super){
       state = user.state;
       district = user.district;
    }
    if(qs){
        qs= qs.trim();
    }

    if(validAdmin(user)){
       let q={super: false, deleted: false};
        
           if(state && district ) {
             q.state = state ;
             q.district = district;
           }
           if(occupation){
               // case insensitve 
               q.occupation= { $regex: new RegExp("^" + occupation.toLowerCase(), "i") };
           }
          
          
       
        q.type= type;
        if(qs){
            q ['$text']= {$search: qs}
        }
        if(count){
            User.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            const extra ={sort:{createdAt: -1, updatedAt:-1},};
            if(!all){
                extra.limit=limit;
                extra.skip=skip
            }
            User.find(q,{},extra, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                  
                    if(!download){
                        
                      
                        res.send({success: resp})
                    }else{
                        const path =new Date().getTime()+'_aa.csv';
                        const csvWriter = createCsvWriter({
                            path,
                            header: [
                              {id:'first_name', title: 'Name'},
                              {id: 'last_name', title: 'Surname'},
                              {id: 'dob', title: 'Date of Birth'},
                              {id: 'gender', title: 'Gender'},
                              {id: 'phone', title: 'Phone Number'},
                              {id: 'state', title: 'State'},
                              {id: 'district', title: 'District'},
                              {id: 'lga', title: 'LGA'},
                              {id: 'occupation', title: 'Occupation'},
                              {id: 'bank', title: 'Bank Name'},
                              {id: 'account', title: 'Account Number'},
                              {id: 'account_name', title: 'Account Name'},
                              {id: 'nin', title: 'Nin'},

                            ]
                          });
                          resp.forEach((r)=>{
                            r.dob = moment(r.dob).format("YYYY-MM-DD")
                          })
                          csvWriter
                           .writeRecords(resp)
                            .then(()=> {
                              doDownload(path,res)
                                  
                            })
                    }
                      
                    
               
                }
            }).sort({ updatedAt:-1, createdAt: -1, }, ).lean();
        }

    }else{
        res.status(403).send({error:'Invalid Request'});
    }

    
}
const doDownload= function(path,res){


    fs.readFile(path , 'utf8', function(err, data){
        if (err){ 
            res.send({error:err});
        }
        else{
            res.set('Content-disposition', 'attachment; filename=file.csv');
            res.set('Content-Type', 'text/csv');
            res.download(path,path, (err)=>{
                //CHECK FOR ERROR

                fs.unlink(path, (err) => {
                    if (err){ console.log(err)}
                    else{
                        // console.log('was deleted');
                    }

                });
            });
        }
    });
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
 *         enum: [customer, agent, admin, partner]
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
    let type = req.query['type']||'customer'; 

    const subscription_plan = req.query['plan'];
    const user = req.user ? req.user.data: {};
    if(validUser(user) || validAdmin(user) && q){
        const query= {
            $text: {$search: q},super: false, deleted: false}
        
    
        
           if(subscription_plan  && validAdmin(user)) {
             query.plan = subscription_plan ;
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
 *         name: reason
 *       - in: query
 *         name: info
 *       - in: query
 *         name: password
 *     responses:
 *       '200':
 *         description: User Deleted
 *       '403':
 *         description: Invalid Request
 */
exports.removeUser = function(req, res){
    const user = req.user ? req.user.data : {};
     const id = req.query['user_id']
     if(user && user._id){
        const q= {

        };
    
        if(!user.super){
            if(id){
                q.type='customer';
                q._id = id
            }
        }else{
            q._id =id
        }
        User.findOne(q, function(err, u){
            if(err){
                req.status(500).send({error:err})
            } else{
                if(u.deleted){
                    res.status(403).send({success: 'User already deleted'});
                } else{
                    if(u && u._id){
                        u.remove(function(err){
                             if(err){
                                 res.send({error: err});
                             }else{
                                 res.send({success: true})
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






function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }


    return true && JSON.stringify(obj) === JSON.stringify({});

    
}
const valid =function(user){
return user &&user._id &&
(validUser(user)|| validAdmin(user)||
validAgent(user) || validMerchant(user)|| validRider(user)
);
}
const valid_u = function(user){ 
 return  user &&user._id &&
 (validUser(user)|| validAdmin(user)||
 validAgent(user) || validMerchant(user)|| validRider(user)
 ) 
}


                       

const createLog = function(req,type, c, type_id, description){
    const user = req.user ? req.user.data : {};
    if(user && user._id && (valid_u)){
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
exports.validAdmin =  validAdmin  