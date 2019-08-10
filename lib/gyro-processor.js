var robot = require("robotjs");
const screenSize = robot.getScreenSize();

class BasicProcessor {
  process(event) {
    if (!event || !event.gyro) return false;
    var gyro = event.gyro;
    gyro.alpha = parseFloat(gyro.alpha);
    gyro.beta = parseFloat(gyro.beta);
    gyro.gamma = parseFloat(gyro.gamma);
    if (gyro.alpha && gyro.beta && gyro.gamma) return gyro;
    else return false;
  }
}

class AbsoluteProcessor extends BasicProcessor {
  constructor() {
    super();
    this.last_gyro = null;
  }
  process(event) {
    var gyro = super.process(event);
    if (!gyro) return;
    if (this.last_gyro && gyro.gamma - this.last_gyro.gamma > 30)
      robot.mouseClick("right");
    else if (this.last_gyro && gyro.gamma - this.last_gyro.gamma < -30)
      robot.mouseClick("left");
    else {
      var pos = robot.getMousePos();
      var x =
        (gyro.alpha - 90) * (-screenSize.width / 45.0) + screenSize.width / 2;
      var y = gyro.beta * (-screenSize.height / 45.0) + screenSize.height / 2;
      robot.moveMouse(x, y);
    }
    this.last_gyro = gyro;
  }
}

class RelativeProcessor extends BasicProcessor {
  constructor() {
    super();
    this.initial_x = null;
    this.initial_y = null;
    this.step_gap = 2;
    this.dead_gap = 3;
    this.timer = null;
    this.last_event_time = 0;
    this.speed = { x: 0, y: 0 };
    this.calc_speed = angle => {
      if (Math.abs(angle) < this.dead_gap) return 0;
      var speed = (angle - this.dead_gap) / this.step_gap;
      return speed * Math.abs(speed);
    };
    var that = this;
    this.startTimer = () => {
      if (that.timer) return;
      that.timer = setInterval(() => {
        if (
          that.timer &&
          new Date() - that.last_event_time > global.$setting.send_time_gap
        ) {
          clearInterval(that.timer);
          that.timer = null;
          return;
        }
        var pos = robot.getMousePos();
        pos.x += that.speed.x;
        pos.y += that.speed.y;
        robot.moveMouse(pos.x, pos.y);
      }, 15);
    };
  }
  process(event) {
    var gyro = super.process(event);
    if (!gyro) return;
    if (this.initial_x === null)
      (this.initial_x = gyro.alpha), (this.initial_y = gyro.beta);
    var x = gyro.alpha - this.initial_x;
    if (x > 180) x = 360 - x;
    else if (x < -180) x += 360;
    this.last_event_time = new Date();
    this.speed.x = this.calc_speed(-x);
    this.speed.y = this.calc_speed(-(gyro.beta - this.initial_y));
    this.startTimer();
  }
}

function Processor(type) {
  if (type === "absolute") return new AbsoluteProcessor();
  else if (type === "relative") return new RelativeProcessor();
  else return new BasicProcessor();
}

module.exports = Processor;
