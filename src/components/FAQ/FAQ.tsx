import { faqItems } from "../../data/faq";

function FAQ() {
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="container faq">
        <div className="section-heading">
          <p className="eyebrow">Вопросы</p>
          <h2 id="faq-title">Можно спросить заранее, даже если задача пока непонятна</h2>
        </div>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
