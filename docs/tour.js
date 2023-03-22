const triggerLinkClick = direction => {
  const link = document.querySelector(`.${direction} a`);
  link && link.click();
};

const handleTouchStart = ({ touches }) => {
  [xDown, yDown] = [touches[0].clientX, touches[0].clientY];
};

const handleTouchMove = ({ touches, target }) => {
  if (!xDown || !yDown) return;

  let touchTarget = target;
  while (touchTarget) {
    const { tagName, parentElement } = touchTarget;
    if (tagName === "CODE" && parentElement.tagName === "PRE") return;
    touchTarget = parentElement;
  }

  const [xUp, yUp] = [touches[0].clientX, touches[0].clientY];
  const [xDiff, yDiff] = [xDown - xUp, yDown - yUp];
  if (Math.abs(xDiff) + Math.abs(yDiff) > 100) {
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      triggerLinkClick(xDiff > 0 ? "next" : "back");
    }
    [xDown, yDown] = [null, null];
  }
};

const onKeyUp = e => {
  if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

  // const { tagName } = document.activeElement;
  // if (tagName === "SPAN") return;

  const hasScrollableParent = el => el.scrollWidth > el.clientWidth;
  let el = document.activeElement;
  while (el && el !== document.body) {
    if (hasScrollableParent(el) && el.tagName !== "A") {
      e.preventDefault();
      return;
    }
    el = el.parentElement;
  }

  const { key } = e;
  if (key === "Right" || key === "ArrowRight") {
    triggerLinkClick("next");
  } else if (key === "Left" || key === "ArrowLeft") {
    triggerLinkClick("back");
  }
};

const setupKeys = () => {
  document.body.addEventListener("keyup", onKeyUp);
};

// document.addEventListener("focus", ({ target }) => {
//   activeEl = target;
// }, true);

document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);
setupKeys();

document.addEventListener("DOMContentLoaded", function () {
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
});
