var robot = require("robotjs");

const last_touch = {
  time: 0,
  lst_start: 0,
  touch: "",
  timer: null,
  clk_num: 0,
  clk_time: 0,
  point: null,
};
const touch_click_gap = 200;
const dbclick_gap = 300;
class TouchProcessor {
  constructor(){
    this.mode = null;
  }
  process(event) {
    switch (event.touch) {
      case "touchstart":
        last_touch.lst_start = new Date();
        break;
      case "touchend":
        if (last_touch.touch === "touchstart") {
          var gap = new Date() - last_touch.lst_start;
          if (gap < touch_click_gap) {
            if (last_touch.clk_num == 0) {
              last_touch.clk_num++;
              last_touch.timer = setTimeout(() => {
                last_touch.clk_num = 0;
                robot.mouseClick("left");
              }, dbclick_gap);
            } else {
              if (last_touch.timer) {
                clearTimeout(last_touch.timer);
                last_touch.timer = null;
              }
              last_touch.clk_num = 0;
              robot.mouseClick("right");
            }
          }
        }
        break;
      case "touchmove":
        if (new Date() - last_touch.lst_start >= touch_click_gap) {
          var scrollX = event.point.x - last_touch.point.x;
          scrollX /=3;
          var scrollY = event.point.y - last_touch.point.y
          scrollY /= 3;
          robot.scrollMouse(scrollX, scrollY);
        }
        break
      default:
        console.log(`touch-processor error: unknown touch event '${event.touch}'`);
        return;
    }
    last_touch.time = new Date();
    last_touch.touch = event.touch;
    last_touch.point = event.point;
  }
}

function Processor() {
  return new TouchProcessor();
}

module.exports = Processor;
