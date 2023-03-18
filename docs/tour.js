// var page = document.querySelector("div.tour");

// console.log(page);

// var hammer = new Hammer(document.body);

// hammer.on("swipeleft", function () {
//   console.log("Left");
//   triggerLinkClick("next");
// });

// hammer.on("swiperight", function () {
//   triggerLinkClick("back");
// });

const triggerLinkClick = direction => {
  const link = document.querySelector(`.${direction} a`);
  if (link) {
    link.click();
  }
};

var xDown = null;
var yDown = null;

const handleTouchStart = evt => {
  xDown = evt.touches[0].clientX;
  yDown = evt.touches[0].clientY;
};

const handleTouchMove = evt => {
  if (!xDown || !yDown) {
    return;
  }

  var touchTarget = evt.target;
  while (touchTarget) {
    if (
      touchTarget.tagName === "CODE" &&
      touchTarget.parentElement.tagName === "PRE"
    ) {
      // ignore swipe on pre > code elements
      return;
    }
    touchTarget = touchTarget.parentElement;
  }

  var xUp = evt.touches[0].clientX;
  var yUp = evt.touches[0].clientY;

  var xDiff = xDown - xUp;
  var yDiff = yDown - yUp;
  if (Math.abs(xDiff) + Math.abs(yDiff) > 100) {
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > 0) {
        /* left swipe */
        triggerLinkClick("next");
      } else {
        /* right swipe */
        triggerLinkClick("back");
      }
    }
    /* reset values */
    xDown = null;
    yDown = null;
  }
};

const setupKeys = () => {
  // PC
  document.body.addEventListener("keyup", e => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
      return;
    }

    if (document.activeElement.tagName === "SPAN") {
      // ignore keys on pre > code elements
      return;
    }

    if (e.key === "Right" || e.key === "ArrowRight") {
      triggerLinkClick("next");
    }
    if (e.key === "Left" || e.key === "ArrowLeft") {
      triggerLinkClick("back");
    }
  });
};

document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);
setupKeys();

// in iframe, should not be same
const iframeElement = document.querySelector("iframe");
if (iframeElement) {
  setupKeys();
  iframeElement.addEventListener("load", () => {
    setTimeout(() => {
      document.querySelector("a").focus();
      setupKeys();
    }, 100);
    setTimeout(() => {
      document.querySelector("a").focus();
      setupKeys();
    }, 1000);
    setupKeys();
  });
} else {
  setupKeys();
}
