var Worker = require('mongoose').model('Worker');
const mongoose = require('mongoose');
const validUser = require('./User').validUser;
const  validAdmin = require('./User').validAdmin;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
var fs= require('fs');
const moment = require('moment')
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
    const project_id = req.query['project_id'];
    let state = req.query['state'];
    let district = req.query['district'];
    let occupation = req.query['occupation'];
    const download = req.query['download'];
    const sort ={updatedAt:-1,createdAt: -1, };
    const user = req.user ? req.user.data: {};
    if(user && user._id){
       let q={deleted: false, project_id: mongoose.Types.ObjectId(project_id)};
    
        if(count){
            Worker.countDocuments(q, function(err, resp){
                if(err){
                    res.send({error:err});
                } else{
                    res.send({count: resp})
                }
            })
        } else {
                        
                         
            let agg =[
                { $match: q},
                { $sort : sort },
            
           
            ];
            if(!all){
                agg.push(   {$limit: skip+ limit},
                    { $skip: skip },)
            }
            agg.push(
                {
                    "$lookup": {
                      "from": "users",
                      "localField": "user_id",
                      "foreignField": "_id",
                      "as": "user"
                    }
                  },
                  {
                    "$unwind": "$user"
                  },
                  {
                    "$project": {
                      "_id": 1,
                      "project_id": 1,
                      "creator_id": 1,
                      "createdAt":1,
                      "updatedAt": 1,
                      "user.first_name": 1,
                      "user.last_name": 1,
                      "user.dob": 1,
                      "user.gender": 1,
                      "user.phone": 1,
                      "user.state": 1,
                      "user.district": 1,
                      "user.occupation": 1,
                      "user.bank": 1,
                      "user.account": 1,
                      "user.nin": 1,
                      "user._id": 1,
                      "user.account_name": 1,
                    }
                  }
            );
                Worker.aggregate(agg, function(err, resp){
                        if(err){
                            res.send({error:err});
                        } else{
                            if(download){
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
                                  const all =[];
                                  for(var i=0;i<resp.length;i++){
                                    const u = r.user
                                    u.dob = moment(u.dob).format("YYYY-MM-DD")
                                    all.push(u);
                                  }
                                 
                                  csvWriter
                                   .writeRecords(resp)
                                    .then(()=> {
                                      doDownload(path,res)
                                          
                                    })
                            }else{
                
                                res.send({success: resp})
                            }
                        }
                    })
            
            
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
