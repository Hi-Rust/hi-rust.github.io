const setupKeys = () => {
  // Mobile swipe left/right
  let xDown = null;
  let yDown = null;
  const swipeThreshold = 10; // swipe sensitivity

  const handleTouchStart = e => {
    xDown = e.touches[0].clientX;
    yDown = e.touches[0].clientY;
  };

  const handleTouchMove = e => {
    if (!xDown || !yDown) {
      return;
    }

    const xDiff = xDown - e.touches[0].clientX;
    const yDiff = yDown - e.touches[0].clientY;

    // alert(Math.abs(xDiff));

    if (Math.abs(xDiff) > swipeThreshold && Math.abs(xDiff) > Math.abs(yDiff)) {
      const direction = xDiff > 0 ? "next" : "back";
      triggerLinkClick(direction);
    }

    xDown = null;
    yDown = null;
  };

  const triggerLinkClick = direction => {
    const link = document.querySelector(`.${direction} a`);
    if (link) {
      link.click();
    }
  };

  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchmove", handleTouchMove, false);

  // PC
  document.body.addEventListener("keyup", e => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
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

// in code block, should not be same
const codeElement = document.querySelector("code");
if (codeElement) {
  setupKeys();
  codeElement.addEventListener("load", () => {
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
