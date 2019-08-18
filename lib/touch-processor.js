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
const scrollPageStep = 6;

class TouchProcessor {
  constructor() {
    this.state = null;
    this.startPoint = null;
    this.callBack = {
      longPressDown: [],
      longPressUp: []
    };
    this.longPressTimer = null;
    this.clearLongPress = function () {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      if (this.state === 'longPress') {
        this.callBack['longPressUp'].forEach(cb => cb());
      }
    };
  }

  on (eventStr, callBack) {
    if (typeof eventStr !== 'string' && typeof callBack !== 'function') {
      console.log('Usage: TouchProcessor.on(eventStr,callBack). Supported events:"longPressDown","longPressUp"');
      return false;
    }
    if (!(eventStr in this.callBack)) {
      console.log('Error: unsupported event!');
      return false;
    }
    this.callBack[eventStr].push(callBack);
  }

  process(event) {
    if (this.state === 'end' && event.touch !== 'touchstart') return;
    switch (event.touch) {
      case 'touchstart':
        this.state = 'start';
        lastTouch.lstStart = new Date();
        lastTouch.scrollPoint = event.point;
        this.longPressTimer = setTimeout(() => {
          this.longPressTimer = null;
          this.state = 'longPress';
          this.callBack['longPressDown'].forEach(cb => cb());
        }, touchClickGap);
        break;
      case 'touchend':
        if (this.state === 'start') {
          this.clearLongPress();
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
        } else if (this.state === 'longPress') {
          this.state = 'end';
          this.callBack['longPressUp'].forEach(cb => cb());
        }
        break;
      case 'touchmove':
        var scrollX = event.point.x - lastTouch.scrollPoint.x;
        var scrollY = event.point.y - lastTouch.scrollPoint.y;
        if (this.state === 'start' && (Math.abs(scrollX) > scrollGap || Math.abs(scrollY) > scrollGap)) this.clearLongPress();
        if (this.state === 'start' && new Date() - lastTouch.lstStart >= touchClickGap) {
          scrollX /= scrollGap;
          if (Math.abs(scrollX) > 1) lastTouch.scrollPoint.x += scrollGap * parseInt(scrollX);
          scrollY /= scrollGap;
          if (Math.abs(scrollY) > 1) lastTouch.scrollPoint.y += scrollGap * parseInt(scrollY);
          if (Math.abs(scrollX) > scrollPageStep) {
            if (scrollX < 0) robot.keyTap('pagedown');
            else robot.keyTap('pageup');
            this.state = 'end';
          } else if (Math.abs(scrollY) > scrollHomeStep) {
            if (scrollY < 0) robot.keyTap('end');
            else robot.keyTap('home');
            this.state = 'end';
          } else robot.scrollMouse(scrollX, scrollY);
        }
        break;
      case 'touchcancel':
        this.clearLongPress();
        this.state = 'end';
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
