/**
 * Created by michaeljava on 15/10/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/', multipartMiddleware, controllers.Liability.createLiability);
router.put('/', multipartMiddleware, controllers.Liability.updateLiability);
router.post('/admin', multipartMiddleware, controllers.Liability.createLiabilityAdmin);
router.put('/admin', multipartMiddleware, controllers.Liability.updateLiabilityAdmin);
router.get('/',controllers.Liability.getLiability)
router.get('/sum',controllers.Liability.sumLiability)
router.get('/sum/admin',controllers.Liability.sumLiabilityAdmin)
router.get('/all',controllers.Liability.getAllLiability)
router.get('/total',controllers.Liability.totalLiability)
router.get('/all/admin',controllers.Liability.getAllLiabilityAdmin)
router.get('/image',controllers.Liability.getLiabilityImage)
router.delete('/',controllers.Liability.removeLiability)
router.delete('/admin',controllers.Liability.removeLiabilityAdmin)

module.exports = router;