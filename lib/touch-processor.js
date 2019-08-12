var robot = require('robotjs');

const lastTouch = {
  time: 0,
  lstStart: 0,
  touch: '',
  timer: null,
  clkNum: 0,
  clkTime: 0,
  point: null,
  scrollPoint: null
};
const touchClickGap = 200;
const dbClickGap = 300;
const scrollGap = 20;
const scrollHomeStep = 10;
class TouchProcessor {
  constructor() {
    this.state = null;
    this.startPoint = null;
  }

  process(event) {
    if (this.state === 'end' && event.touch !== 'touchstart') return;
    switch (event.touch) {
      case 'touchstart':
        this.state = 'start';
        lastTouch.lstStart = new Date();
        lastTouch.scrollPoint = event.point;
        break;
      case 'touchend':
        if (lastTouch.touch === 'touchstart') {
          var gap = new Date() - lastTouch.lstStart;
          if (gap < touchClickGap) {
            if (lastTouch.clkNum === 0) {
              lastTouch.clkNum++;
              lastTouch.timer = setTimeout(() => {
                lastTouch.clkNum = 0;
                robot.mouseClick('left');
              }, dbClickGap);
            } else {
              if (lastTouch.timer) {
                clearTimeout(lastTouch.timer);
                lastTouch.timer = null;
              }
              lastTouch.clkNum = 0;
              robot.mouseClick('right');
            }
          }
        }
        break;
      case 'touchmove':
        if (new Date() - lastTouch.lstStart >= touchClickGap) {
          var scrollX = event.point.x - lastTouch.scrollPoint.x;
          scrollX /= scrollGap;
          if (Math.abs(scrollX) > 1) lastTouch.scrollPoint.x += scrollGap * parseInt(scrollX);
          var scrollY = event.point.y - lastTouch.scrollPoint.y;
          scrollY /= scrollGap;
          if (Math.abs(scrollY) > 1) lastTouch.scrollPoint.y += scrollGap * parseInt(scrollY);
          if (Math.abs(scrollY) > scrollHomeStep) {
            if (scrollY < 0) robot.keyTap('end');
            else robot.keyTap('home');
            this.state = 'end';
          } else robot.scrollMouse(scrollX, scrollY);
        }
        break;
      default:
        console.log(`touch-processor error: unknown touch event '${event.touch}'`);
        return;
    }
    lastTouch.time = new Date();
    lastTouch.touch = event.touch;
    lastTouch.point = event.point;
  }
}

function Processor() {
  return new TouchProcessor();
}

module.exports = Processor;
