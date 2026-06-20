import { Camera, CheckCircle2, ClipboardCheck, PhoneCall, Truck, Wrench } from "lucide-react";
import { processSteps } from "../../data/process";

const icons = [PhoneCall, Camera, ClipboardCheck, Truck, Wrench, CheckCircle2];

function Process() {
  return (
    <section className="section section--compact" id="process" aria-labelledby="process-title">
      <div className="container">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">Как работаем</p>
          <h2 id="process-title">Понятный процесс без лишних шагов и сюрпризов</h2>
          <p>
            Карточки ниже показывают, что будет происходить до выезда, на объекте и после проверки.
            Если задача небольшая, часть вопросов решим прямо по телефону.
          </p>
        </div>
        <div className="process-list">
          {processSteps.map((step, index) => (
            <article className="process-card" key={step.title}>
              <div className="process-card__top">
                {(() => {
                  const Icon = icons[index];
                  return <Icon size={24} aria-hidden="true" />;
                })()}
                <span>{step.badge}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Process;
