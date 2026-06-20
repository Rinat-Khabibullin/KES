import { avitoUrl, brandCaption, brandName, phoneDisplay, phoneHref } from "../../data/site";
import BrandMark from "../BrandMark/BrandMark";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <a href="#top" className="logo">
            <span className="logo__mark" aria-hidden="true">
              <BrandMark />
            </span>
            <span className="logo__text">
              <strong>{brandName}</strong>
              <small>{brandCaption}</small>
            </span>
          </a>
          <p>Электромонтажные работы в Туапсе и районе. Консультация по телефону бесплатно.</p>
        </div>
        <address>
          <a href={phoneHref}>{phoneDisplay}</a>
          <a href={avitoUrl} target="_blank" rel="noopener noreferrer">
            Авито
          </a>
        </address>
        <div>
          <strong>География</strong>
          <p>Туапсе, Агой, Небуг, Ольгинка, Новомихайловский и соседние поселки.</p>
        </div>
      </div>
      <div className="container site-footer__note">
        Информация на сайте не является публичной офертой. Итоговая стоимость зависит от объема и
        условий работ.
      </div>
    </footer>
  );
}

export default Footer;
