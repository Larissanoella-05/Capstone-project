import { Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { POLICY } from '../../lib/privacyPolicy.js';

export default function Privacy() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3.5">
      <div className="pt-2">
        <div className="eyebrow">Umuriro Response</div>
        <h1 className="display mt-1 text-[26px]">{POLICY.title}</h1>
        <p className="mb-0 mt-1.5 text-sm text-grey">
          Updated {POLICY.updated} · Ethics approval {POLICY.approval}
        </p>
      </div>

      {POLICY.sections.map((section) => (
        <Card key={section.heading} className="flex flex-col gap-2 px-[18px] py-4">
          <h2 className="m-0 text-base font-semibold">{section.heading}</h2>
          {section.paragraphs.map((text) => (
            <p key={text} className="m-0 text-sm">
              {text}
            </p>
          ))}
        </Card>
      ))}

      <Link to="/" className="btn btn-outline">
        Back to home
      </Link>
    </div>
  );
}
