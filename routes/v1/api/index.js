

var router = require('express').Router();

router.use('/log', require('./log'));
router.use('/project', require('./project'));
router.use('/worker', require('./worker'));
module.exports = router;