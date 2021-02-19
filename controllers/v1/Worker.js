var Worker = require('mongoose').model('Worker');

const validUser = require('./User').validUser;
const  validAdmin = require('./User').validAdmin;

/**
 * @swagger
 * /v1/api/worker:
 *   post:
 *     tags:
 *       - Worker
 *     name: Create worker
 *     summary: Create a single worker
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: project_id
 *         type: string
 *         project_id: The project_id of the worker
 *       - in: formData
 *         name: user_id
 *         type: string
 *         project_id: The user_id of the worker
 *     responses:
 *       '200':
 *         project_id: Worker created
 *       '400':
 *         project_id: Duplicate Worker
 */
exports.createWorker = function(req, res){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const user = req.user ? req.user.data: {};
    if(user &&user._id&& userData.project_id && userData.user_id  && user.super
    ){
        const c={
            creator_id:user._id,
            project_id: userData.project_id,
            user_id: userData.user_id,
           
        }
        const com = new Worker(c);
        com.save(function(err, resp){
            if(err){
                res.status(400).send({error:err.toString()});
            } else{
               
                res.send({success:resp});
            }
        })

    } else{
        return res.status(403).send({error:'Not authorized'});
    }

}

/**
 * @swagger
 * /v1/api/worker:
 *   put:
 *     tags:
 *       - Worker
 *     name: Update worker
 *     summary: Update a single worker
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: project_id
 *         type: string
 *         project_id: The project_id of the worker
 *       - in: formData
 *         name: user_id
 *         type: string
 *         project_id: The user_id of the worker
 *     responses:
 *       '200':
 *         project_id: Worker created
 *       '400':
 *         project_id: Duplicate Worker
 */
exports.updateWorker = function(req, res){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const user = req.user ? req.user.data: {};
    let  id = req.query['worker_id'];
    if (user && user._id && id )  {
        let q={_id: id, creator_id: user._id};
        if(validAdmin(user)){
          q={_id:id}
        }
        
    Worker.findOne(q, function(err,ba){
        if(err){
            res.send({error: err})
        } else{
            if(ba && ba._id){
               
                if(userData.project_id){
                    ba.project_id = userData.project_id
                }
              
               
                if(userData.user_id){
                    ba.user_id = userData.user_id
                }
             
                    ba.fixed = userData.fixed;
                
                ba.save(function(err2, resp2){
                    if(err2){
                      res.send({error: err2});
                    } else{
                        res.send({success:resp2})
                    }
                   
                })
            } else{
              res.send({error:'Worker does not exist'})
            }
            

        }
        
    });
        

    } else{
        return res.status(403).send({error:'Not authorized'});
    }

}

/**
 * @swagger
 * /v1/api/worker:
 *   get:
 *     tags:
 *       - Worker
 *     name: Get a particular worker
 *     summary: Get worker 
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: worker_id
 *     responses:
 *       '200':
 *         project_id: Worker Details
 *       '403':
 *         project_id: Invalid Request
 */
exports.getWorker= function(req, res){

    const user = req.user ? req.user.data: {};
    let worker_id = req.query['worker_id'];
    if(user &&user._id && worker_id){
    

    Worker.findOne({_id:worker_id, }, function(err,ba){
        if(err){
            res.send({error: err})
        } else{
            res.send({success: ba });

        }
    });
} else {
    return res.status(403).send({error:'Not authorized'});
}

}

/**
 * @swagger
 * /v1/api/worker/all:
 *   get:
 *     tags:
 *       - Worker
 *     name: Get list of worker  or get the total
 *     summary: Worker list
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: limit
 *         project_id: Number of items to return. Default is 10
 *         value: 10
 *       - in: query
 *         name: skip
 *         project_id: Number of items to skip. 
 *       - in: query
 *         name: count
 *         project_id: If this value is set the total of the item is returned
 *       - in: query
 *         name: all
 *         project_id: If this value is set the api is unpaginated
 *       - in: query
 *         name: mine
 *         project_id: Workers reported by current user
 *       - in: query
 *         name: user_id
 *         project_id: Get for this user alone
 *     responses:
 *       '200':
 *         project_id: Worker List
 *       '403':
 *         project_id: Invalid Request
 */
exports.getWorkers = function(req, res, next){
    const limit= parseInt(req.query['limit'], 10)||10;
    const skip = parseInt(req.query['skip'], 10)||0;
    const count = req.query['count'];
    const all = req.query['all'];
    const mine = req.query['mine'];
    const user_id = req.query['user_id'];
    const user = req.user ? req.user.data: {};
    if(user && user._id){
       let q={deleted: false, fixed};
       if(mine){
           q.creator_id = user._id
       }
       if(user_id && validAdmin(user)){
           q.creator_id = user_id;
       }
    
        if(count){
            Worker.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            if(all){
                Worker.find(q,{ project_id:1 , user_id: 1,},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).sort({updatedAt:-1,createdAt: -1, });
            } else{
                Worker.find(q,{project_id:1 , user_id: 1},{}, function(err, resp){
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
 * /v1/api/worker:
 *   delete:
 *     tags:
 *       - Worker
 *     name: Delete a particular worker
 *     summary: Delete worker 
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: worker_id
 *     responses:
 *       '200':
 *         project_id: Deleted Successfully
 *       '403':
 *         project_id: Invalid Request
 */

exports.removeWorker = function(req,res) {
    const user = req.user ? req.user.data : {};
    let id = req.query['worker_id'];
    if (user && user._id && id ) {
        let q={_id: id, creator_id: user._id};
        if(validAdmin(user)){
          q={_id:id}
        }

            Worker.findOne(q, function(err, resp){
               if(err){
                 res.send({error: err})
               }else{
                   if(resp && resp._id){
                    resp.deleted=true;
                    resp.save((err2, resp2)=>{
                        if(err2){
                          res.send({error: err2})
                        } else{
                            res.send({success:'Worker Deleted Successfully'})
                        }
                        
                    });
                   }else{
                       res.send({ error:'Worker not found'})
                   }
                   

               }
            })
        
         
    }else {
        return res.status(403).send({error:'Not authorized'});
    }
}
