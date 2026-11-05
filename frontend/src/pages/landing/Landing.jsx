import { useEffect, useState } from 'react';
import './landing.css';
import Hero from './Hero.jsx';
import About from './About.jsx';
import Services from './Services.jsx';
import Roles from './Roles.jsx';
import Faq from './Faq.jsx';
import SafetyTips from './SafetyTips.jsx';
import Cta from './Cta.jsx';
import LandingFooter from './LandingFooter.jsx';

const REVEAL_IDS = ['about', 'services', 'roles', 'faq', 'blog', 'cta'];
const REVEAL_AT = 0.85; // a section is "seen" once its top passes 85% of the viewport height

/** Marks each section as seen once it scrolls into view, so its content can animate in. */
function useReveal() {
  const [seen, setSeen] = useState({});

  useEffect(() => {
    const check = () => {
      const limit = window.innerHeight * REVEAL_AT;
      setSeen((previous) => {
        let next = previous;
        for (const id of REVEAL_IDS) {
          if (previous[id]) continue;
          const element = document.getElementById(id);
          if (element && element.getBoundingClientRect().top < limit) {
            next = { ...next, [id]: true };
          }
        }
        return next;
      });
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return seen;
}

export default function Landing() {
  const seen = useReveal();

  return (
    <div className="landing">
      <main>
        <Hero />
        <About seen={seen.about} />
        <Services seen={seen.services} />
        <Roles seen={seen.roles} />
        <Faq seen={seen.faq} />
        <SafetyTips seen={seen.blog} />
        <Cta seen={seen.cta} />
      </main>
      <LandingFooter />
    </div>
  );
}
