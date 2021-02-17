var path = require('path');
var rootPath = path.normalize(__dirname + '');

module.exports = {
    development: {
        db: 'mongodb://'+process.env.DB_USER+':'+
        process.env.DB_PASS+'@'+process.env.DB_HOST+':'+process.env.DB_PORT+'/'+ process.env.DB_NAME+'?authSource=admin',
        dbUser:process.env.DB_USER,
        dbPass:process.env.DB_PASS,
        rootPath: rootPath,
        port: process.env.PORT || 3073,
        passphrase:process.env.PASS_PHRASE,
        origins:process.env.ORIGINS,
        superadminusername:process.env.SUPER_NAME,
        superadminemail:process.env.SUPER_EMAIL,
        superadminpassword: process.env.SUPER_PASS,
        awsaccess: process.env.AWS_ACCESS,
        awssecret: process.env.AWS_SECRET,
        mapiKey:process.env.MAILGUN_API_KEY,
        mdomain:process.env.MAILGUN_DOMAIN,
        pvn_length: process.env.PVN_LENGTH,
        secret:process.env.JWT_KEY,
        redishost: process.env.REDIS_HOST||'localhost',
        redisport: process.env.REDIS_PORT|| 6379,
        redispass: process.env.REDIS_PASS||'',
        chargeuser:process.env.CHARGE_USER||0,
        appamount: process.env.APP_AMOUNT||0,
        pvnbucket:process.env.PVN_BUCKET||'veri-pvn-123',
        maxContact : process.env.MAX_CONTACT || 10,
        radius : process.env.RADIUS || 30

    },
    production: {

        db: 'mongodb://'+process.env.DB_USER+':'+ process.env.DB_PASS+'@'+process.env.DB_HOST+'/'+ process.env.DB_NAME,
        dbUser:process.env.DB_USER,
        dbPass:process.env.DB_PASS,
        rootPath: rootPath,
        port: process.env.PORT || 3073,
        passphrase:process.env.PASS_PHRASE,
        origins:process.env.ORIGINS,
        superadminusername:process.env.SUPER_NAME,
        superadminpassword: process.env.SUPER_PASS,
        awsaccess: process.env.AWS_ACCESS,
        awssecret: process.env.AWS_SECRET,
        mapiKey:process.env.MAILGUN_API_KEY,
        mdomain:process.env.MAILGUN_DOMAIN,
        pvn_length: process.env.PVN_LENGTH,
        secret:process.env.JWT_KEY
    }
}