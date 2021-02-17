/**
 * Created by michaeljava on 29/06/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/signup', controllers.User.createUser);
router.post('/createuser', controllers.User.createUser);
router.post('/changePass', controllers.User.upass);
router.post('/changeSecurity', controllers.User.usec);

router.post('/email', controllers.User.activateUserByEmail);
router.post('/bvn', controllers.Paystack.resolveBvn);
router.post('/pay', controllers.User.pay);
router.post('/executewill', controllers.User.executeWill);
router.post('/declareasset', controllers.User.declareAsset);
router.post('/profile_pic', multipartMiddleware,  controllers.User.updateProfilePic);
router.post('/death_certificate', multipartMiddleware,  controllers.User.updateDeathCertificate);
router.get('/death_certificate', multipartMiddleware,  controllers.User.getDeathCertificate);
router.post('/picture_id', multipartMiddleware,  controllers.User.updatePictureId);
router.post('/beneficiary', multipartMiddleware,  controllers.User.createBeneKin);
router.post('/lawyer', multipartMiddleware,  controllers.User.createLaw);
router.post('/admin/beneficiary', multipartMiddleware,  controllers.User.createBeneKinAdmin);
router.put('/beneficiary', multipartMiddleware,  controllers.User.updateBeneKin);
router.put('/lawyer', multipartMiddleware,  controllers.User.updateLaw);
router.put('/admin/beneficiary', multipartMiddleware,  controllers.User.updateBeneKinAdmin);
router.get('/beneficiary',   controllers.User.getBeneKin);
router.get('/lawyer',   controllers.User.selectLawyer);
router.get('/lawyer-selector',   controllers.User.Lawyerselector);
router.post('/admin', multipartMiddleware,  controllers.User.createAdmin);
router.post('/deceased',  controllers.User.deceased);

router.put('/admin', multipartMiddleware,  controllers.User.updateAdmin);
router.get('/assign',   controllers.User.AssignAdminLister);
router.get('/allpayments',   controllers.User.getPaidList);



router.get('/admin/lawyer',   controllers.User.selectLawyerAdmin);
router.get('/all',   controllers.User.getUsers);
router.get('/search',   controllers.User.searchUser);
router.post('/resendverify', controllers.User.resendEmailVeri);
router.put('/', controllers.User.updateUser);
router.put('/password', controllers.User.updatePassword);
router.get('/login', controllers.User.getSingleUser);
router.get('/lister', controllers.User.getSingleLister);
router.delete('/',controllers.User.removeUser);
router.post('/login', controllers.User.login);
router.post('/get', controllers.User.getSingleUser);
router.post('/message', controllers.User.sendMessage)
module.exports = router;