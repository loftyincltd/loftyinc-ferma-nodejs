/**
 * Created by michaeljava on 29/06/2018.
 */
var router = require('express').Router();

router.use('/user', require('./user'));
router.use('/forgot', require('./forgot'));

module.exports = router;