

//load specific API version
var router = require('express').Router();


router.use('/v1', require('./v1'));

module.exports = router;