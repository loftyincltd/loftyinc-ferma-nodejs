/**
 * Created by michaeljava on 28/09/2017.
 */

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('../config/config')[env];
var mailgun = require('mailgun-js')({apiKey: config.mapiKey, domain:config.mdomain});
exports.sendEmail= function (from,to,subject,text,callback) {
    callback = typeof callback == 'undefined' ? function () {
    } : callback;
    var data = {
        from:from,
        to: to,
        subject: subject,
        html: text
    };

    mailgun.messages().send(data,callback);
}

// 'Excited User <me@samples.mailgun.org>'