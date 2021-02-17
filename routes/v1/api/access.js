/**
 * Created by michaeljava on 15/10/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/', multipartMiddleware, controllers.Access.addAccess);
router.post('/activate', multipartMiddleware, controllers.Access.activate);
router.get('/all',controllers.Access.getAccess)


module.exports = router;