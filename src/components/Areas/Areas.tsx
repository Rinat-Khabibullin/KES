import { MapPin } from "lucide-react";
import { areas } from "../../data/areas";

function Areas() {
  return (
    <section className="section section--contrast" id="areas" aria-labelledby="areas-title">
      <div className="container areas">
        <div className="section-heading">
          <p className="eyebrow">География</p>
          <h2 id="areas-title">Работаем по Туапсе и району</h2>
          <p>Для удаленных объектов стоимость выезда и минимальная сумма заказа согласуются заранее.</p>
        </div>
        <div className="area-list" aria-label="Населенные пункты">
          {areas.map((area) => (
            <span key={area}>
              <MapPin size={16} />
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Areas;
