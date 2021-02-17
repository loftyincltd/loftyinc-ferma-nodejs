/**
 * Created by michaeljava on 15/10/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();


router.post('/', multipartMiddleware, controllers.Subscription.createSubscription);
router.put('/', multipartMiddleware, controllers.Subscription.updateSubscription);
router.get('/',controllers.Subscription.getSubscription)
router.get('/all',controllers.Subscription.getSubscriptions)

router.delete('/',controllers.Subscription.removeSubscription)

module.exports = router;