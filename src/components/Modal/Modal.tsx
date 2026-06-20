import { useEffect } from "react";
import type { PortfolioItem } from "../../data/portfolio";

type ModalProps = {
  item: PortfolioItem | null;
  onClose: () => void;
};

function Modal({ item, onClose }: ModalProps) {
  useEffect(() => {
    if (!item) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("is-modal-open");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("is-modal-open");
    };
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="modal__backdrop" type="button" aria-label="Закрыть" onClick={onClose} />
      <div className="modal__content">
        <button className="modal__close" type="button" onClick={onClose} aria-label="Закрыть фото">
          ×
        </button>
        <img src={item.src} alt={item.alt} width={item.width} height={item.height} decoding="async" />
        <div className="modal__text">
          <div className="modal__meta">
            <span>{item.object}</span>
            <span>{item.result}</span>
          </div>
          <h2 id="modal-title">{item.title}</h2>
          <p>{item.description}</p>
        </div>
      </div>
    </div>
  );
}

export default Modal;
