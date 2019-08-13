var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var qrImage = require('qr-image');
var GyroProcessor = require('./lib/gyro-processor');
var TouchProcessor = require('./lib/touch-processor');

global.$setting = {
  send_time_gap: 50
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/index', indexRouter);
app.use('/', indexRouter);
app.use('/qrcode/url', (req, res) => {
  var qrcode = qrImage.image(req.query.url);
  res.type('png');
  qrcode.pipe(res);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
require('express-ws')(app);
var wss = [];
app.ws('/mouse', (ws, req) => {
  var gyroProcessor = null;
  var touchProcessor = TouchProcessor();
  touchProcessor.on('longPressDown', () => { gyroProcessor = GyroProcessor('relative'); });
  touchProcessor.on('longPressUp', () => { gyroProcessor = null; });
  ws.on('message', function (msg) {
    var event = JSON.parse(msg);
    if (!event.type) return;
    if (event.type === 'gyro') {
      if (gyroProcessor) gyroProcessor.process(event);
    } else if (event.type === 'touch') {
      touchProcessor.process(event);
    }
  });
  ws.on('connection', data => {
    wss.push(ws);
  });
  ws.on('close', data => {
    console.log('close');
    var i = wss.indexOf(ws);
    if (i > -1) {
      wss.splice(i, 1);
    }
  });
});

function onListening () {
  var addr = server.address();
  console.log('Listening on url: http://0.0.0.0:' + addr.port);
}
app.on('listening', onListening);
var server = app.listen(3000).on('listening', onListening);
