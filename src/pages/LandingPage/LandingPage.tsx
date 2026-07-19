import Areas from "../../components/Areas/Areas";
import Benefits from "../../components/Benefits/Benefits";
import Contact from "../../components/Contact/Contact";
import FAQ from "../../components/FAQ/FAQ";
import Guarantee from "../../components/Guarantee/Guarantee";
import Hero from "../../components/Hero/Hero";
import ObjectTypes from "../../components/ObjectTypes/ObjectTypes";
import Partners from "../../components/Partners/Partners";
import PhotoEstimate from "../../components/PhotoEstimate/PhotoEstimate";
import Portfolio from "../../components/Portfolio/Portfolio";
import Prices from "../../components/Prices/Prices";
import Process from "../../components/Process/Process";
import Services from "../../components/Services/Services";
import { portfolioItems, type PortfolioItem } from "../../data/portfolio";

type LandingPageProps = {
  onOpenWork: (item: PortfolioItem) => void;
};

function LandingPage({ onOpenWork }: LandingPageProps) {
  return (
    <main id="main-content">
      <Hero />
      <Benefits />
      <Services />
      <ObjectTypes />
      <Portfolio items={portfolioItems} onOpen={onOpenWork} />
      <PhotoEstimate />
      <Prices />
      <Process />
      <Partners />
      <Areas />
      <Guarantee />
      <FAQ />
      <Contact />
    </main>
  );
}

export default LandingPage;
