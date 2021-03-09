/**
 * Created by michaeljava on 29/06/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/signup', controllers.User.createUser);
router.post('/fingerprint', controllers.User.updateUserFingerprint);
router.post('/changePass', controllers.User.upass);

router.put('/', controllers.User.updateUser);

router.get('/all',   controllers.User.getUsers);
router.get('/search',   controllers.User.searchUser);

router.get('/login', controllers.User.getMyDetails);
router.delete('/',controllers.User.removeUser);
router.post('/login', controllers.User.login);
router.get('/user', controllers.User.getSingleUser);
router.get('/stat', controllers.User.getStat);
module.exports = router;