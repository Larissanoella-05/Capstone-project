import { createRoot } from 'react-dom/client';
import './index.css';

createRoot(document.getElementById('root')).render(
  <div className="p-6">
    <div className="eyebrow text-muted">Design tokens</div>
    <h1 className="display text-4xl">Report. Locate.</h1>
    <button className="btn btn-volt mt-4">Report a Fault</button>
  </div>
);