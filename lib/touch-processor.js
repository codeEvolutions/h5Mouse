var robot = require('robotjs');

const lastTouch = {
  time: 0,
  lstStart: 0,
  touch: '',
  timer: null,
  clkNum: 0,
  clkTime: 0,
  point: null
};
const touchClickGap = 200;
const dbClickGap = 300;
class TouchProcessor {
  constructor() {
    this.mode = null;
  }

  process(event) {
    switch (event.touch) {
      case 'touchstart':
        lastTouch.lstStart = new Date();
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
          var scrollX = event.point.x - lastTouch.point.x;
          scrollX /= 3;
          var scrollY = event.point.y - lastTouch.point.y;
          scrollY /= 3;
          robot.scrollMouse(scrollX, scrollY);
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
