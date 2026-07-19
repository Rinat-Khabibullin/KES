import { useEffect, useLayoutEffect, useRef } from "react";
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

const scrollToTopInstantly = () => {
  const root = document.documentElement;
  const body = document.body;
  const previousRootScrollBehavior = root.style.scrollBehavior;
  const previousBodyScrollBehavior = body.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);

  window.requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousRootScrollBehavior;
    body.style.scrollBehavior = previousBodyScrollBehavior;
  });
};

const getTargetTop = (target: HTMLElement) => {
  const header = document.querySelector<HTMLElement>(".site-header");
  const headerHeight = header?.getBoundingClientRect().height ?? 0;

  return Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 18);
};

const scrollToTargetInstantly = (target: HTMLElement) => {
  const root = document.documentElement;
  const body = document.body;
  const previousRootScrollBehavior = root.style.scrollBehavior;
  const previousBodyScrollBehavior = body.style.scrollBehavior;
  const targetTop = getTargetTop(target);

  root.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";
  window.scrollTo(0, targetTop);

  window.requestAnimationFrame(() => {
    window.scrollTo(0, targetTop);
    root.style.scrollBehavior = previousRootScrollBehavior;
    body.style.scrollBehavior = previousBodyScrollBehavior;
  });
};

const scrollToTargetSmoothly = (target: HTMLElement) => {
  window.scrollTo({
    top: getTargetTop(target),
    left: 0,
    behavior: "smooth",
  });
};

function ScrollToHash() {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

  useLayoutEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = location.pathname;

    if (location.hash || previousPathname === location.pathname) {
      return;
    }

    scrollToTopInstantly();

    const main = document.getElementById("main-content");
    if (main) {
      focusTarget(main);
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCompactViewport = window.matchMedia("(max-width: 900px)").matches;

    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);

    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (prefersReducedMotion || isCompactViewport) {
        scrollToTargetInstantly(target);
      } else {
        scrollToTargetSmoothly(target);
      }

      focusTarget(target);
    });
  }, [location.hash, location.pathname]);

  return null;
}

export default ScrollToHash;
