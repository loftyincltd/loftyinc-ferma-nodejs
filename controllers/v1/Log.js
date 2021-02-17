const Log =require('mongoose').model('Log');
const validUser = require('./User').validUser;
const validAdmin = require('./User').validAdmin;
var Access = require('mongoose').model('access');
/**
 * @swagger
 * /v1/api/log/all:
 *   get:
 *     tags:
 *       - Log
 *     name: Get list of log  or get the total
 *     summary: Log list
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
 *         name: count
 *         description: If this value is set the total of the item is returned
 *       - in: query
 *         name: all
 *         description: If this value is set the api is unpaginated
 *     responses:
 *       '200':
 *         description: Log List
 *       '403':
 *         description: Invalid Request
 */
exports.getLogs = function(req, res, next){
    const limit= parseInt(req.query['limit'], 10)||10;
    const skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    const all = req.query['all'];
    const type = req.query['type'];
    const currentuser = req.user ? req.user.data: {};
    if(validUser(currentuser)){

       let q={deleted: false, creator_id :currentuser._id};
       if(type){
           q.class= type
       }
       console.log(q)
        if(count){
            Log.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            if(all){
                Log.find(q,{},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).sort({updatedAt:-1,createdAt: -1, });
            } else{
                Log.find(q,{},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).limit(limit).skip(skip).sort({updatedAt:-1,createdAt: -1, });
            }
            
        }

    }else{
        res.status(403).send({error:'Invalid Request'});
    }

    
}



/**
 * @swagger
 * /v1/api/log/report:
 *   get:
 *     tags:
 *       - Log
 *     name:  Get list of log  reports (declare assets, logins , audit)
 *     summary: Get list of log  reports (declare assets, logins , audit)
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
 *         name: count
 *         description: If this value is set the total of the item is returned
 *       - in: query
 *         name: all
 *         description: If this value is set the api is unpaginated
 *     responses:
 *       '200':
 *         description: Log List
 *       '403':
 *         description: Invalid Request
 */
exports.getReportLogs = function(req, res, next){
    const limit= parseInt(req.query['limit'], 10)||10;
    const skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    const all = req.query['all'];
    const type = req.query['type'];
    const currentuser = req.user ? req.user.data: {};
    if(validAdmin(currentuser)){

       let q={deleted: false,
      class:{$in:['login','will','declare']}
    };
       if(type && ['login','will','declare'].indexOf(type)> -1){
        q.class = type
       } else {
        q.class={$in:['login','will','declare']}
       }

        if(count){
            Log.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            if(all){
                Log.find(q,{},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).sort({updatedAt:-1,createdAt: -1, });
            } else{
                Log.find(q,{},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).limit(limit).skip(skip).sort({updatedAt:-1,createdAt: -1, });
            }
            
        }

    }else{
        res.status(403).send({error:'Invalid Request'});
    }

    
}


/**
 * @swagger
 * /v1/api/log/all/admin:
 *   get:
 *     tags:
 *       - Log
 *     name: Get list of log  or get the total as an admin
 *     summary: Log list as an admin
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
 *         name: lister_id
 *         type: string 
 *       - in: query
 *         name: skip
 *         description: Number of items to skip. 
 *       - in: query
 *         name: count
 *         description: If this value is set the total of the item is returned
 *       - in: query
 *         name: all
 *         description: If this value is set the api is unpaginated
 *     responses:
 *       '200':
 *         description: Log List
 *       '403':
 *         description: Invalid Request
 */
exports.getLogsAdmin = function(req, res, next){
    const limit= parseInt(req.query['limit'], 10)||10;
    const skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    const all = req.query['all'];
    const lister_id = req.query['lister_id'];
      const type = req.query['type'];
    const currentuser = req.user ? req.user.data: {};
    if(validAdmin(currentuser) && lister_id){
        const  q1={
            user_id: lister_id ,
            creator_id: currentuser._id,
            activated: true
        }
        Access.findOne(q1,{},{}, function(err, resp0){
            if(err){
                res.send({error:err});
            } else{
                if(resp0 && resp0._id){ 
                    let q={deleted: false, creator_id :lister_id};
                    if(type){
                        q.class= type
                    }
                    console.log(q)
                     if(count){
                         Log.countDocuments(q, function(err, resp){
                             if(err){
                                 res.send({error:err});
                             } else{
                                 res.send({count: resp})
                             }
                         })
                     } else {
                         if(all){
                           
                            Log.find(q,{ },{}, function(err, resp){
                                    if(err){
                                        res.send({error:err});
                                    } else{
                                        res.send({success: resp})
                                    }
                                }).sort({updatedAt:-1,createdAt: -1, });
                         } else{
                            Log.find(q,{ },{}, function(err, resp){
                                    if(err){
                                        res.send({error:err});
                                    } else{
                                        res.send({success: resp})
                                    }
                                }).limit(limit).skip(skip).sort({updatedAt:-1,createdAt: -1, });
                         }
                        
                     }

                 }else{
                    return res.status(403).send({error:'Invalid Token'}); 
                }
            }
            })
     

    }else{
        res.status(403).send({error:'Invalid Request'});
    }

    
}

/**
 * @swagger
 * /v1/api/logs:
 *   get:
 *     tags:
 *       - Log
 *     name: Get a particular log
 *     summary: Get log 
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: log_id
 *     responses:
 *       '200':
 *         description: Log Details
 *       '403':
 *         description: Invalid Request
 */
exports.getLog= function(req, res){

    const user = req.user ? req.user.data: {};
    let log_id = req.query['log_id'];
    if(user &&user._id && log_id && 
        (validUser(user)| validAdmin(user))){
    

    Log.findOne({_id:log_id, }, function(err,ba){
        if(err){
            res.send({error: err})
        } else{
            res.send({success:ba});

        }
    });
} else {
    return res.status(403).send({error:'Not authorized'});
}

}
