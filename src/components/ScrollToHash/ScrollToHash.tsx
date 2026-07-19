import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const focusTarget = (target: HTMLElement) => {
  const hadTabIndex = target.hasAttribute("tabindex");
  const previousTabIndex = target.getAttribute("tabindex");

  if (!hadTabIndex) {
    target.setAttribute("tabindex", "-1");
  }

  target.focus({ preventScroll: true });

  if (!hadTabIndex) {
    target.addEventListener(
      "blur",
      () => {
        target.removeAttribute("tabindex");
      },
      { once: true },
    );
  } else if (previousTabIndex !== null) {
    target.setAttribute("tabindex", previousTabIndex);
  }
};

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);

    if (!target) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        block: "start",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      focusTarget(target);
    });
  }, [location.hash, location.pathname]);

  return null;
}

export default ScrollToHash;
