
var mongoose=require('mongoose')    ;
mongoose.Promise = require('bluebird');

require('../models/log');
require('../models/project');
require('../models/worker');
var user=require('../models/user');


const opts = { useNewUrlParser: true , useUnifiedTopology: true
};
module.exports = function(config) {
    const reconnect = _ => {
        setTimeout(_ => {
            console.info('Retrying DB connection')
        mongoose.connect((config.db), opts).catch(_ => {})
    }, 20*1000)
    }
    mongoose.connect((config.db), opts);

    var db = mongoose.connection;
    db.on('error', (err) => {
        console.error(`Error on DB connection (${err.message}). Waiting for retry`)
    reconnect()
})

    db.once('open', function callback() {
        console.log(config. db+' db opened');
        user.createDefaultUsers();
    
    });
    db.on('disconnected', _ => {
        console.log(`DB disconnected ! Waiting for retry`)
    reconnect()
})

};


