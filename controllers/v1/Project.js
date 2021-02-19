var Project = require('mongoose').model('Project');

const validUser = require('./User').validUser;
const  validAdmin = require('./User').validAdmin;

/**
 * @swagger
 * /v1/api/project:
 *   post:
 *     tags:
 *       - Project
 *     name: Create project
 *     summary: Create a single project
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: description
 *         type: string
 *         description: The description of the project
 *       - in: formData
 *         name: title
 *         type: string
 *         description: The title of the project
 *     responses:
 *       '200':
 *         description: Project created
 *       '400':
 *         description: Duplicate Project
 */
exports.createProject = function(req, res){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const user = req.user ? req.user.data: {};
    if(user &&user._id&& userData.description && userData.title  && user.super
    ){
        const c={
            creator_id:user._id,
            description: userData.description,
            title: userData.title,
           
        }
        const com = new Project(c);
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
 * /v1/api/project:
 *   put:
 *     tags:
 *       - Project
 *     name: Update project
 *     summary: Update a single project
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: description
 *         type: string
 *         description: The description of the project
 *       - in: formData
 *         name: title
 *         type: string
 *         description: The title of the project
 *     responses:
 *       '200':
 *         description: Project created
 *       '400':
 *         description: Duplicate Project
 */
exports.updateProject = function(req, res){
    var userData = req.body;
    if(typeof  userData === 'string' || userData instanceof String ){
        userData = JSON.parse(userData) ;
    }
    const user = req.user ? req.user.data: {};
    let  id = req.query['project_id'];
    if (user && user._id && id )  {
        let q={_id: id, creator_id: user._id};
        if(validAdmin(user)){
          q={_id:id}
        }
        
    Project.findOne(q, function(err,ba){
        if(err){
            res.send({error: err})
        } else{
            if(ba && ba._id){
               
                if(userData.description){
                    ba.description = userData.description
                }
              
               
                if(userData.title){
                    ba.title = userData.title
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
              res.send({error:'Project does not exist'})
            }
            

        }
        
    });
        

    } else{
        return res.status(403).send({error:'Not authorized'});
    }

}

/**
 * @swagger
 * /v1/api/project:
 *   get:
 *     tags:
 *       - Project
 *     name: Get a particular project
 *     summary: Get project 
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: project_id
 *     responses:
 *       '200':
 *         description: Project Details
 *       '403':
 *         description: Invalid Request
 */
exports.getProject= function(req, res){

    const user = req.user ? req.user.data: {};
    let project_id = req.query['project_id'];
    if(user &&user._id && project_id){
    

    Project.findOne({_id:project_id, }, function(err,ba){
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
 * /v1/api/project/all:
 *   get:
 *     tags:
 *       - Project
 *     name: Get list of project  or get the total
 *     summary: Project list
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
 *       - in: query
 *         name: mine
 *         description: Projects reported by current user
 *       - in: query
 *         name: user_id
 *         description: Get for this user alone
 *     responses:
 *       '200':
 *         description: Project List
 *       '403':
 *         description: Invalid Request
 */
exports.getProjects = function(req, res, next){
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
            Project.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
            if(all){
                Project.find(q,{ description:1 , title: 1},{}, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            res.send({success: resp})
                        }
                    }).sort({updatedAt:-1,createdAt: -1, });
            } else{
                Project.find(q,{description:1 , title: 1},{}, function(err, resp){
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
 * /v1/api/project:
 *   delete:
 *     tags:
 *       - Project
 *     name: Delete a particular project
 *     summary: Delete project 
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: project_id
 *     responses:
 *       '200':
 *         description: Deleted Successfully
 *       '403':
 *         description: Invalid Request
 */

exports.removeProject = function(req,res) {
    const user = req.user ? req.user.data : {};
    let id = req.query['project_id'];
    if (user && user._id && id ) {
        let q={_id: id, creator_id: user._id};
        if(validAdmin(user)){
          q={_id:id}
        }

            Project.findOne(q, function(err, resp){
               if(err){
                 res.send({error: err})
               }else{
                   if(resp && resp._id){
                    resp.deleted=true;
                    resp.save((err2, resp2)=>{
                        if(err2){
                          res.send({error: err2})
                        } else{
                            res.send({success:'Project Deleted Successfully'})
                        }
                        
                    });
                   }else{
                       res.send({ error:'Project not found'})
                   }
                   

               }
            })
        
         
    }else {
        return res.status(403).send({error:'Not authorized'});
    }
}
