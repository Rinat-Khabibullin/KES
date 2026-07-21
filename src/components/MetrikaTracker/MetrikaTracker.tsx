import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackCalculatorOpen, trackPageHit, trackPhotoEstimateOpen } from "../../utils/metrika";

function MetrikaTracker() {
  const location = useLocation();
  const isInitialPageviewRef = useRef(true);
  const routeKey = `${location.key}:${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#photo-estimate") {
        trackPhotoEstimateOpen(window.location.href);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const currentUrl = window.location.href;

    if (isInitialPageviewRef.current) {
      isInitialPageviewRef.current = false;
    } else {
      trackPageHit(currentUrl);
    }

    if (location.pathname === "/calculator") {
      trackCalculatorOpen(routeKey);
    }

    if (location.hash === "#photo-estimate") {
      trackPhotoEstimateOpen(currentUrl);
    }
  }, [location.hash, location.pathname, location.search, routeKey]);

  return null;
}

export default MetrikaTracker;
