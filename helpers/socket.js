
var CronJob = require('cron').CronJob;
var fs= require('fs');
const resolve = require('path').resolve
let fullPath = resolve(process.env.FOLDER+"/");
const redis = require('socket.io-redis');


module.exports=function(server){
    var io = require('socket.io')(server);
    io.adapter(redis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT,
         password: process.env.REDIS_PASSWORD}));
    io.set('transports', ['websocket','flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling', 'polling']);
   var p2p = require('socket.io-p2p-server').Server;
   io.use(p2p);
    var job = new CronJob({
        cronTime: '* * * * * *',
        onTick: function() {

        },
        start: false,
        timeZone: 'America/Los_Angeles'
    });
    job.start()

    io.use(function(socket, next) {
        let handshakeData = socket.request;
        let user=(handshakeData._query.user || handshakeData._query.token);
        //owner of the channel/market/blog etc
        let owner=(handshakeData._query.owner || handshakeData._query.ownerToken);
        const root = process.env.FOLDER+"/"+vergly.name;
        socket.user=user;
        const apps =['share', 'streaming' , 'blog', 'chat', 'wallet',  'market', 'setting', 'browser','payment', 'device','index', 'search'
        , 'preference','forgot','user', 'activity', 'notification'];
        var app=(handshakeData._query.app || handshakeData._query.appName);
        fullPath
        next();
    });
    io.setMaxListeners(io.getMaxListeners() + 1);

            io.on('connection', function(socket) {
             
                socket.on('disconnect',cleanup);



                function seenBid(data){

                    socket.setMaxListeners(socket.getMaxListeners() +1);


                }

                function recentBid(data,sock){
                    socket.setMaxListeners(socket.getMaxListeners() +1);
                  
                }




                function cleanup() {



                    socket.removeAllListeners();

                    //this promise is done, so we lower the maximum number of listeners

                }

            });



    function disconnect(socket) {
        console.log(socket.id + ' disconnected');
        io.removeListener('disconnect',disconnect);
        io.setMaxListeners(io.getMaxListeners()>0?io.getMaxListeners():100 - 1);
    }

};