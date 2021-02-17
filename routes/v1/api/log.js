/**
 * Created by michaeljava on 15/10/2018.
 */
var controllers = require('../../../controllers/v1');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = require('express');
var router = app.Router();



router.get('/',controllers.Log.getLog)
router.get('/all',controllers.Log.getLogs)
router.get('/report',controllers.Log.getReportLogs)
router.get('/all/admin',controllers.Log.getLogsAdmin)
module.exports = router;