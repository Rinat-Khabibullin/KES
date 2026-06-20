import { ArrowUpRight, Camera, CheckCircle2, PhoneCall } from "lucide-react";
import { photoEstimateExamples, photoEstimateSteps } from "../../data/estimate";
import { avitoUrl, phoneHref } from "../../data/site";

function PhotoEstimate() {
  return (
    <section className="section photo-estimate-section" aria-labelledby="photo-estimate">
      <div className="container photo-estimate">
        <div className="photo-estimate__content">
          <p className="eyebrow">Оценка по фото</p>
          <h2 id="photo-estimate">Не знаете, как правильно объяснить задачу? Просто покажите фото</h2>
          <p>
            Это самый быстрый способ начать без лишних выездов. Специалист посмотрит фото щита,
            розетки, трассы или места монтажа, задаст несколько вопросов и бесплатно подскажет ориентир по
            стоимости.
          </p>
          <div className="photo-estimate__actions">
            <a className="button button--primary" href={phoneHref}>
              <PhoneCall size={19} />
              Позвонить и описать задачу
            </a>
            <a className="button button--ghost" href={avitoUrl} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight size={19} />
              Отправить фото через Авито
            </a>
          </div>
        </div>
        <div className="photo-estimate__panel" aria-label="Как оценить работу по фото">
          <div className="photo-estimate__phone" aria-hidden="true">
            <div className="photo-estimate__screen">
              <Camera size={34} />
              <span>фото щита</span>
              <strong>ориентир по цене до выезда</strong>
            </div>
          </div>
          <div className="photo-estimate__steps">
            {photoEstimateSteps.map((step) => (
              <div className="photo-estimate__step" key={step}>
                <CheckCircle2 size={20} />
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="photo-estimate__chips" aria-label="Что можно прислать на оценку">
            {photoEstimateExamples.map((example) => (
              <span key={example}>{example}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PhotoEstimate;
