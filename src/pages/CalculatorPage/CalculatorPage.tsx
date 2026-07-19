import { ArrowLeft, MessageCircle, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import EstimateCalculator from "../../components/EstimateCalculator/EstimateCalculator";
import { phoneHref } from "../../data/site";

function CalculatorPage() {
  return (
    <main id="main-content">
      <section className="section calculator-page" aria-labelledby="calculator-page-title">
        <div className="container">
          <Link className="calculator-page__back" to="/#prices">
            <ArrowLeft size={18} />
            Вернуться к лендингу
          </Link>

          <div className="calculator-page__hero">
            <div>
              <p className="eyebrow">Смета онлайн</p>
              <h1 id="calculator-page-title">Калькулятор электромонтажных работ</h1>
              <p>
                Выберите работы из прайса, укажите количество, метраж или площадь и получите
                предварительный расчет. Стоимость указана за работу «от», материалы и фактические
                условия объекта рассчитываются отдельно.
              </p>
            </div>
            <div className="calculator-page__actions">
              <a className="button button--primary" href={phoneHref}>
                <PhoneCall size={18} />
                Позвонить нам
              </a>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
              >
                <MessageCircle size={18} />
                Задать вопрос
              </button>
            </div>
          </div>

          <div className="calculator-page__note">
            <strong>Важно перед заказом</strong>
            <p>
              Калькулятор показывает ориентир по работам. Для точной суммы нужно уточнить доступ к
              месту монтажа, состояние проводки, материал стен, готовность линий и состав материалов.
              Черновик сметы сохраняется в браузере и не пропадет при переходе на главную страницу.
            </p>
          </div>

          <EstimateCalculator />
        </div>
      </section>
    </main>
  );
}

export default CalculatorPage;
