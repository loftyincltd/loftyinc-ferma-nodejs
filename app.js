
var express = require('express');
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var logger = require('morgan');
var jwt = require('express-jwt');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const http = require('http');
var mkdirp = require('mkdirp');
var CryptoJS = require("crypto-js");

process.env.JWT_KEY.replace(/\\n/gm, '\n')

mkdirp('uploads', );

const result = require('dotenv').config()

if (result.error) {
  throw result.error
}

var path = require('path');
var config = require('./config/config')[env];

require('./config/mongoose')(config);//initialize mongodb

var index = require('./routes/index');
var app = express();
app.use(require('./config/cors')(config))
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(jwt({
  secret: config.secret,
  credentialsRequired: false,
  algorithms:['RS256',],
  getToken: function fromHeaderOrQuerystring (req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      if(!req.headers.plain){
        try{
          var bytes  = CryptoJS.AES.decrypt(req.headers.authorization.split(' ')[1], config.secret);
          const dec = bytes.toString(CryptoJS.enc.Utf8);
          return dec;
        }catch(e){
           console.log(e);
        }
      
      }else{
        return req.headers.authorization.split(' ')[1];
      }

    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
}));


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(multipart());
//s3.createBucket('verify', function (err,resp) {
  //console.log(err,resp)
//})
// let const;

app.use('/', index) ;

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

 var server = http.createServer(app);
  
  server.on("connection", function (socket) {

    socket.setNoDelay(true);//disable nagle algorithm


  });
  server.listen(config.port,'0.0.0.0',function(){

    console.log("abracadabra at port "+config.port)
  });

  //cluster sticky session
  //sticky.listen(server,config.port)
  // Master code
  server.once('listening', function() {
  });
process.on('message', (msg) => {
  if (msg === 'shutdown') {

  }
});
process.on('uncaughtException', function(e){
  console.log(e)
});
module.exports = app;
