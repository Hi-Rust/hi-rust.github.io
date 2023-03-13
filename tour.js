const setupKeys = () => {
  // Mobile swipe left/right
  let xDown = null;
  let yDown = null;

  const handleTouchStart = e => {
    xDown = e.touches[0].clientX;
    yDown = e.touches[0].clientY;
  };

  const handleTouchMove = e => {
    if (!xDown || !yDown) {
      return;
    }

    const xUp = e.touches[0].clientX;
    const yUp = e.touches[0].clientY;

    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > 0) {
        const link = document.querySelector(".next a");
        if (link) {
          link.click();
        }
      } else {
        const link = document.querySelector(".back a");
        if (link) {
          link.click();
        }
      }
    }

    xDown = null;
    yDown = null;
  };

  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchmove", handleTouchMove, false);

  // PC
  document.body.addEventListener("keyup", e => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
      return;
    }
    let link;
    if (e.key === "Right" || e.key === "ArrowRight") {
      link = document.querySelector(".next a");
    }
    if (e.key === "Left" || e.key === "ArrowLeft") {
      link = document.querySelector(".back a");
    }
    if (link) {
      link.click();
    }
  });
};

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
