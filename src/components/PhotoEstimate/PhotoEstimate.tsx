import { ArrowUpRight, Camera, CheckCircle2, PhoneCall } from "lucide-react";
import { photoEstimateExamples, photoEstimateSteps } from "../../data/estimate";
import { avitoUrl, phoneHref } from "../../data/site";

function PhotoEstimate() {
  return (
    <section className="section photo-estimate-section" id="photo-estimate" aria-labelledby="photo-estimate-title">
      <div className="container photo-estimate">
        <div className="photo-estimate__content">
          <p className="eyebrow">Оценка по фото</p>
          <h2 id="photo-estimate-title">Не знаете, как правильно объяснить задачу? Просто покажите фото</h2>
          <p>
            Это самый быстрый способ начать без лишних выездов. Специалист посмотрит фото щита,
            розетки, трассы или места монтажа, задаст несколько вопросов и бесплатно подскажет ориентир по
            стоимости.
          </p>

          <div className="photo-estimate__chips" aria-label="Что можно прислать на оценку">
            {photoEstimateExamples.map((example) => (
              <span key={example}>{example}</span>
            ))}
          </div>

          <ol className="photo-estimate__steps" aria-label="Как получить оценку по фото">
            {photoEstimateSteps.map((step) => (
              <li className="photo-estimate__step" key={step}>
                <CheckCircle2 size={20} aria-hidden="true" />
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="photo-estimate__actions">
            <a className="button button--primary" href={avitoUrl} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight size={19} />
              Отправить фото через Авито
            </a>
            <a className="button button--secondary" href={phoneHref}>
              <PhoneCall size={19} />
              Позвонить и описать задачу
            </a>
          </div>
        </div>
        <div className="photo-estimate__panel" aria-hidden="true">
          <div className="photo-estimate__phone" aria-hidden="true">
            <div className="photo-estimate__screen">
              <Camera size={34} />
              <span>фото щита</span>
              <strong>ориентир по цене до выезда</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PhotoEstimate;
