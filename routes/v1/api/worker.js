

var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/', multipartMiddleware, controllers.Worker.createWorker);
router.put('/', multipartMiddleware, controllers.Worker.updateWorker);
router.get('/',controllers.Worker.getWorker)
router.get('/all',controllers.Worker.getWorkers)
router.delete('/',controllers.Worker.removeWorker)

module.exports = router;