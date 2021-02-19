/**
 * Created by michaeljava on 29/06/2018.
 */
var router = require('express').Router();

router.use('/user', require('./user'));

module.exports = router;