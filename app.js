var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var qr_image = require('qr-image');
var robot = require("robotjs");
var GyroProcessor = require('./lib/gyro-processor')

global.$setting = {
  send_time_gap: 50,
}

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
app.use('/qrcode/url', (req,res)=>{
  var qrcode = qr_image.image(req.query.url);
  res.type("png");
  qrcode.pipe(res);
});

// error handler  
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
var wss = [];
var expressWs = require('express-ws')(app);

app.ws('/mouse', (ws, req)=>{
  const last_touch = {
    time: 0,
    touch: "",
    timer: null,
    clk_num: 0,
    clk_time: 0,
  }
  var gyrpProcessor = GyroProcessor("relative");
  ws.on('message', function(msg) {
    var event = JSON.parse(msg);
    if(!event.type) return;
    if(event.type === "gyro"){
      gyrpProcessor.process(event);
    }
    else if(event.type === "touch"){
      switch(event.touch){
        case "touchstart":
          break;
        case "touchend":
          if(last_touch.touch === "touchstart"){
            var gap = new Date() - last_touch.time;
            if(gap < 200){
              if(last_touch.clk_num == 0){
                last_touch.clk_num ++;
                last_touch.timer = setTimeout(() => {
                  last_touch.clk_num =0;
                  robot.mouseClick("left");
                }, 300);
              }
              else{
                if(last_touch.timer){
                  clearTimeout(last_touch.timer);
                  last_touch.timer = null;
                }
                last_touch.clk_num =0;
                robot.mouseClick("right");
              }
            }
          }
          break;
        case "touchmove":
      }
      last_touch.time = new Date();
      last_touch.touch = event.touch;
    }
  });
  ws.on('connection',data=>{
    wss.push(ws);
  });
  ws.on("close",data=>{
    console.log("close");
    var i = wss.indexOf(ws);
    if(i > -1){
      wss.splice(i,1);
    }
  })
})

function onListening() {
  debugger
  var addr = server.address();
  console.log('Listening on url: http://0.0.0.0:' + addr.port);
}
app.on('listening', onListening);
var server = app.listen(3000).on('listening', onListening);