/**
 * Created by michaeljava on 15/10/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/', multipartMiddleware, controllers.Assets.createAsset);
router.put('/', multipartMiddleware, controllers.Assets.updateAsset);
router.post('/admin', multipartMiddleware, controllers.Assets.createAssetAdmin);
router.put('/admin', multipartMiddleware, controllers.Assets.updateAssetAdmin);
router.get('/',controllers.Assets.getAsset)
router.get('/sum',controllers.Assets.sumAsset)
router.get('/sum/admin',controllers.Assets.sumAssetAdmin)
router.get('/all',controllers.Assets.getAssets)
router.get('/total',controllers.Assets.totalAsset)
router.get('/all/admin',controllers.Assets.getAssetsAdmin)
router.get('/image',controllers.Assets.getAssetImage)
router.delete('/',controllers.Assets.removeAsset)
router.delete('/admin',controllers.Assets.removeAssetAdmin)

module.exports = router;