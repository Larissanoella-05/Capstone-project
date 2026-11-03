import { useEffect, useState } from 'react';
import './landing.css';
import LandingHeader from './LandingHeader.jsx';
import Hero from './Hero.jsx';
import StepCards from './StepCards.jsx';
import About from './About.jsx';
import Services from './Services.jsx';
import Roles from './Roles.jsx';
import Faq from './Faq.jsx';
import SafetyTips from './SafetyTips.jsx';
import Cta from './Cta.jsx';
import LandingFooter from './LandingFooter.jsx';

const REVEAL_IDS = ['flow', 'about', 'services', 'roles', 'faq', 'blog', 'cta'];
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

/** True when the visitor asked the OS for less motion. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** The public page at "/" for signed-out visitors. Every action leads to sign-in. */
export default function Landing() {
  const seen = useReveal();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="landing">
      <LandingHeader />
      <main>
        <Hero reducedMotion={reducedMotion} />
        <StepCards seen={seen.flow} />
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
