/**
 * Created by michaeljava on 15/10/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/', multipartMiddleware, controllers.UserGroup.createUserGroup);
router.put('/', multipartMiddleware, controllers.UserGroup.updateUserGroup);
router.get('/',controllers.UserGroup.getUserGroup)
router.get('/all',controllers.UserGroup.getUserGroups)
router.delete('/',controllers.UserGroup.removeUserGroup)

module.exports = router;