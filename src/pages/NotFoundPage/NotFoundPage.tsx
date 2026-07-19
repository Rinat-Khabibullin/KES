import { Home, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import { phoneHref } from "../../data/site";

function NotFoundPage() {
  return (
    <main id="main-content">
      <section className="section not-found" aria-labelledby="not-found-title">
        <div className="container not-found__content">
          <p className="eyebrow">Страница не найдена</p>
          <h1 id="not-found-title">Такой страницы нет</h1>
          <p>
            Можно вернуться на главную, открыть калькулятор или сразу позвонить по вопросу электрики
            в Туапсе и районе.
          </p>
          <div className="not-found__actions">
            <Link className="button button--primary" to="/">
              <Home size={18} />
              На главную
            </Link>
            <a className="button button--ghost" href={phoneHref}>
              <PhoneCall size={18} />
              Позвонить
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;
