/**
 * Created by michaeljava on 18/12/2018.
 */
var querystring = require('querystring');
var https       = require('https');
var username = 'jyroApp';
var apikey   = '8bdd03a8a0a4a9805bedd5eeb2b783b38f90fbce111444929be745098eada5d0';
exports.send= function(phone,from, text){
    var post_data = querystring.stringify({
        'username' : username,
        'to'       : phone,
        'message'  : text,
       // 'from'     : from,
    });
    var post_options = {
        host   : 'api.africastalking.com',
        path   : '/version1/messaging',
        method : 'POST',

        rejectUnauthorized : false,
        requestCert        : true,
        agent              : false,

        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length,
            'Accept': 'application/json',
            'apikey': apikey
        }
    };
    var post_req = https.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var jsObject   = JSON.parse(chunk);
            var recipients = jsObject.SMSMessageData.Recipients;
            if ( recipients.length > 0 ) {
                for (var i = 0; i < recipients.length; ++i ) {
                    var logStr  = 'number=' + recipients[i].number;
                    logStr     += ';cost='   + recipients[i].cost;
                    logStr     += ';status=' + recipients[i].status; // status is either "Success" or "error message"
                    logStr     += ';statusCode=' + recipients[i].statusCode;
                    console.log(logStr);
                }
            } else {
                console.log('Error while sending: ' + jsObject.SMSMessageData.Message);
            }
        });
    });

    // Add post parameters to the http request
    post_req.write(post_data);

    post_req.end();
}