

var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/', multipartMiddleware, controllers.Project.createProject);
router.put('/', multipartMiddleware, controllers.Project.updateProject);
router.get('/',controllers.Project.getProject)
router.get('/all',controllers.Project.getProjects)
router.delete('/',controllers.Project.removeProject)

module.exports = router;