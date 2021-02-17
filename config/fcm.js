/**
 * Created by michaeljava on 04/12/2018.
 */
var FCM = require('fcm-node');
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var serverKey = config.fcm || "AIzaSyBRMJAXsQabvh-ZBt4v-4hhnbmJIjEMdAQ";
var fcm = new FCM(serverKey);
exports.sendMessage = function(id,title, body,extra, withp){
    // console.log(id,title, body,extra, withp)
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: id,
        //  collapse_key: 'your_collapse_key',

        notification: {
            title: title || 'Recordio App',
            body: body
        },

        data: extra
    };
    if(withp){
        message.content_available = true;
        message.priority= 'high';
    }

    fcm.send(message, function(err, response){
        if (err) {
            //console.log("Something has gone wrong!");
        } else {
            // console.log("Successfully sent with response: ", response);
        }
    });
}
exports.sendMessageCb = function(id,title, body, cb){
    // console.log(id,title, body,extra, withp)
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: id,
        //  collapse_key: 'your_collapse_key',

        notification: {
            title: title || 'Rxecordio App',
            body: body
        },
    };


    fcm.send(message,cb);
}

exports.sendCustom = function(id,title, body,longitude, latitude, chat_id, message_id, profile_pic, gender){
    // console.log(id,title, body,extra, withp)
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: id,
        //  collapse_key: 'your_collapse_key',
        "data": {
            "type": "MEASURE_CHANGE",
            "custom_notification": {
                "body": body,
                "title": title||'Sentrix',
                "priority": "high",
                "show_in_foreground": true,
                "content_available": true,
                "isAlert": true,
                "longitude": longitude,
                "latitude":latitude,
                "sound": "default",
                "chat_id":chat_id,
                "profile_pic": profile_pic,
                "gender": gender,
                "message_id":message_id
            }
        }
    };


    fcm.send(message, function(err, response){
        if (err) {
            //console.log("Something has gone wrong!");
        } else {
            // console.log("Successfully sent with response: ", response);
        }
    });
}

exports.subscribe = function(ids, topic ){
    var device_tokens = Array.isArray(ids)?ids:[ids];
    fcm.subscribeToTopic(device_tokens, topic, (err, res) => {
        assert.ifError(err);
        assert.ok(res);
        done();
    });
}
exports.unsubscribe = function(ids, topic ){
    var device_tokens = Array.isArray(ids)?ids:[ids];
    fcm.unsubscribeToTopic(device_tokens, topic, (err, res) => {
        assert.ifError(err);
        assert.ok(res);
        done();
    });
}
exports.sendWeb = function(nid,title, body, click){
    var options = { method: 'POST',
        url: 'https://fcm.googleapis.com/fcm/send',
        headers:
        {Authorization: 'key = '+serverKey,
            'Content-Type': 'application/json' },
        body:
        { notification:
        { title: title,
            body: body,
            click_action: click },
            to: nid },
        json: true };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
    });
}

