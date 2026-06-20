import { Building2, House, Store, Waves } from "lucide-react";
import { objectTypes } from "../../data/objectTypes";

const icons = [Building2, House, Store, Waves];

function ObjectTypes() {
  return (
    <section className="section section--compact object-section" aria-labelledby="objects-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Объекты</p>
          <h2 id="objects-title">Электромонтаж под ремонт, дом, бизнес и открытые площадки</h2>
          <p>
            Работаем с небольшими задачами и комплексной электрикой: от одной розетки до щита,
            освещения, наружных линий и подготовки объекта под ремонт.
          </p>
        </div>
        <div className="object-grid">
          {objectTypes.map((object, index) => {
            const Icon = icons[index];

            return (
              <article className="object-card" key={object.title}>
                <span className="object-card__icon" aria-hidden="true">
                  <Icon size={24} />
                </span>
                <h3>{object.title}</h3>
                <p>{object.text}</p>
                <div className="object-card__tags" aria-label="Ключевые направления">
                  {object.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ObjectTypes;
