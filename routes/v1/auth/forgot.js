/**
 * Created by michaeljava on 29/06/2018.
 */
var controllers = require('../../../controllers/v1');


var app = require('express');
var router = app.Router();


router.get('/forgot-add', controllers.Forgot.addForgot);
router.get('/forgot-get', controllers.Forgot.getForgot);
router.delete('/forgot-delete', controllers.Forgot.deleteForgot);
module.exports = router;