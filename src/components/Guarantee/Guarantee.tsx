import { CheckCircle2 } from "lucide-react";

const guaranteeItems = [
  "Работаем по договору",
  "Возможна поэтапная оплата",
  "Предоплата обсуждается заранее",
  "Даем гарантию на выполненные работы",
  "Материалы можем закупить сами",
  "После работ можно оформить акт выполненных работ",
];

function Guarantee() {
  return (
    <section className="section section--compact" aria-labelledby="guarantee-title">
      <div className="container guarantee">
        <div className="section-heading">
          <p className="eyebrow">Документы и оплата</p>
          <h2 id="guarantee-title">Договор, гарантия и понятная оплата</h2>
        </div>
        <div className="guarantee__panel">
          {guaranteeItems.map((item) => (
            <div className="check-row" key={item}>
              <span aria-hidden="true">
                <CheckCircle2 size={20} />
              </span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Guarantee;
