import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;

    const originalScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = originalScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    let frameId = 0;
    let timeoutId = 0;

    const scrollToPageTop = () => {
      window.scrollTo({ left: 0, top: 0, behavior: "auto" });
    };

    scrollToPageTop();
    frameId = window.requestAnimationFrame(scrollToPageTop);
    timeoutId = window.setTimeout(scrollToPageTop, 120);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [location.key]);

  return null;
};

export default ScrollToTop;
