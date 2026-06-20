import type { PortfolioItem } from "../../data/portfolio";

type PortfolioProps = {
  items: PortfolioItem[];
  onOpen: (item: PortfolioItem) => void;
};

function Portfolio({ items, onOpen }: PortfolioProps) {
  return (
    <section className="section section--contrast" id="works" aria-labelledby="works-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Примеры работ</p>
          <h2 id="works-title">Реальные объекты: щиты, трассы, подсветка и наружный свет</h2>
          <p>
            Фото помогают быстрее понять аккуратность монтажа и формат работ. Нажмите на карточку,
            чтобы открыть изображение крупнее.
          </p>
        </div>
        <div className="portfolio-grid">
          {items.map((item) => (
            <article className="portfolio-card" key={item.id}>
              <button type="button" className="portfolio-card__button" onClick={() => onOpen(item)}>
                <img src={item.src} alt={item.alt} loading="lazy" />
                <span>Открыть фото</span>
              </button>
              <div className="portfolio-card__body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Portfolio;
