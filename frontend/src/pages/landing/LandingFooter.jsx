import { FOOTER } from '../../lib/landingContent.js';
import { Bolt, LoginLink } from './LandingBits.jsx';

/** A footer link: an in-page anchor, or a router link to sign-in. */
function FooterLink({ item }) {
  if (item.link) {
    return (
      <LoginLink className="lp-flink" link={item.link}>
        {item.label}
      </LoginLink>
    );
  }
  return (
    <a className="lp-flink" href={item.href}>
      {item.label}
    </a>
  );
}

export default function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-bgd lp-cct" aria-hidden="true" style={{ inset: 0, opacity: 0.6 }} />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ right: 0, bottom: 0, width: 190, height: 420, opacity: 0.85 }}
      />
      <div
        className="lp-bgd lp-glowb"
        aria-hidden="true"
        style={{ left: '30%', top: -120, width: 700, height: 420 }}
      />
      <div className="lp-fgrid">
        <div>
          <a className="lp-logo" href="#top">
            <Bolt size={28} />
            UMURIRO
          </a>
          <p className="lp-fblurb">{FOOTER.blurb}</p>
          {FOOTER.socials.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              {FOOTER.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4>Quick Links</h4>
          <div className="lp-fcol">
            {FOOTER.quickLinks.map((item) => (
              <FooterLink key={item.label} item={item} />
            ))}
          </div>
        </div>
        <div>
          <h4>Services</h4>
          <div className="lp-fcol">
            {FOOTER.services.map((item) => (
              <FooterLink key={item.label} item={item} />
            ))}
          </div>
        </div>
        <div>
          <h4>{FOOTER.contactTitle}</h4>
          <div className="lp-contact">
            {FOOTER.contact.map((line) => (
              <div key={line.label}>
                {line.href ? <a href={line.href}>{line.label}</a> : line.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lp-fbase">
        <span>{FOOTER.copyright}</span>
        <span>{FOOTER.legal}</span>
      </div>
    </footer>
  );
}
