/**
 * Faint circuit lines, a pylon and a soft glow behind a screen. Place it first inside a
 * `relative` frame and give the content `relative` too, so the content paints above it.
 * The styles are `.app-bg` in index.css.
 */
export default function Backdrop() {
  return (
    <div className="app-bg" aria-hidden="true">
      <svg className="app-bg-circuit" viewBox="0 0 760 520" fill="none">
        <g stroke="#e30613" strokeOpacity="0.1" strokeWidth="1.5">
          <path d="M0 80h180l40 40h160l30-30h170" />
          <path d="M0 190h120l50 50h210l40-40h180" />
          <path d="M60 0v110l40 40v120l40 40h140" />
          <path d="M420 0v70l30 30v90" />
          <path d="M0 330h200l40 40h120" />
        </g>
        <g fill="#e30613" fillOpacity="0.14">
          <circle cx="180" cy="80" r="4" />
          <circle cx="380" cy="120" r="4" />
          <circle cx="170" cy="190" r="4" />
          <circle cx="440" cy="200" r="4" />
          <circle cx="140" cy="310" r="4" />
          <circle cx="420" cy="100" r="4" />
        </g>
      </svg>
      <svg className="app-bg-pylon" viewBox="0 0 220 360" fill="none">
        <g stroke="#0b0b0c" strokeOpacity="0.07" strokeWidth="2">
          <path d="M110 10v30M70 40h80M100 40 70 130M120 40l30 90M70 130h80M70 130 40 260M150 130l30 130" />
          <path d="M40 260h140M40 260l-20 100M180 260l20 100M70 130l80 130M150 130l-80 130" />
          <path d="M20 110h50M150 110h50" />
        </g>
      </svg>
    </div>
  );
}
