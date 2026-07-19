import { Camera, MessageCircle, PhoneCall } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { phoneHref } from "../../data/site";

function MobileActions() {
  const location = useLocation();
  const photoTarget = location.pathname === "/" ? "#photo-estimate" : "/#photo-estimate";

  return (
    <nav className="mobile-cta" aria-label="Быстрые действия">
      <a href={phoneHref} className="mobile-cta__button mobile-cta__button--primary">
        <PhoneCall size={18} />
        <span>Позвонить</span>
      </a>
      <Link to={photoTarget} className="mobile-cta__button">
        <Camera size={18} />
        <span>Фото</span>
      </Link>
      <button
        type="button"
        className="mobile-cta__button"
        onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
      >
        <MessageCircle size={18} />
        <span>Чат</span>
      </button>
    </nav>
  );
}

export default MobileActions;
