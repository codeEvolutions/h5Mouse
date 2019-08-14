var robot = require('robotjs');
const screenSize = robot.getScreenSize();

function gyroDelta(now, ori) {
  var alpha = now.alpha - ori.alpha;
  if (alpha < -180) alpha += 360;
  if (alpha > 180) alpha -= 360;
  var beta = now.beta - ori.beta;
  if (beta < -180) beta += 360;
  if (beta > 180) beta -= 360;
  var gamma = now.gamma - ori.gamma;
  if (gamma < -90) gamma += 180;
  if (gamma > 90) gamma -= 180;
  return {
    alpha: alpha,
    beta: beta,
    gamma: gamma
  };
}

class BasicProcessor {
  constructor() {
    this.initialGyro = null;
  }

  process (event) {
    if (!event || !event.gyro) return false;
    var gyro = event.gyro;
    gyro.alpha = parseFloat(gyro.alpha);
    gyro.beta = parseFloat(gyro.beta);
    gyro.gamma = parseFloat(gyro.gamma);
    if (gyro.alpha && gyro.beta && gyro.gamma) {
      if (!this.initialGyro) {
        this.initialGyro = gyro;
      }
      return gyroDelta(gyro, this.initialGyro);
    } else return false;
  }
}

class AbsoluteProcessor extends BasicProcessor {
  constructor () {
    super();
    this.last_gyro = null;
  }

  process (event) {
    var gyro = super.process(event);
    if (!gyro) return;
    var x = (gyro.alpha - 90) * (-screenSize.width / 45.0) + screenSize.width / 2;
    var y = gyro.beta * (-screenSize.height / 45.0) + screenSize.height / 2;
    robot.moveMouse(x, y);
    this.last_gyro = gyro;
  }
}

class RelativeProcessor extends BasicProcessor {
  constructor () {
    super();
    this.step_gap = 3;
    this.dead_gap = 2;
    this.timer = null;
    this.last_event_time = 0;
    this.speed = { x: 0, y: 0 };
    this.calc_speed = angle => {
      if (Math.abs(angle) < this.dead_gap) return 0;
      var speed = (angle - this.dead_gap) / this.step_gap;
      return speed * Math.abs(speed) / 2;
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

  process (event) {
    var gyro = super.process(event);
    if (!gyro) return;
    this.last_event_time = new Date();
    this.speed.x = this.calc_speed(-gyro.alpha);
    this.speed.y = this.calc_speed(-gyro.beta);
    this.startTimer();
  }
}

function Processor (type) {
  if (type === 'absolute') return new AbsoluteProcessor();
  else if (type === 'relative') return new RelativeProcessor();
  else return new BasicProcessor();
}

module.exports = Processor;
