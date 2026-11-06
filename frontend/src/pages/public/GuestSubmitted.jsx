import { useState } from 'react';
import { Check, Copy, MessageSquare } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { trackingPath } from '../../lib/guestReport.js';
import { Card } from '../../components/Card.jsx';

export default function GuestSubmitted() {
  const { token } = useParams();
  const { state } = useLocation();
  // After a refresh the page state is gone, so the reference is read back with the link.
  const lookup = useApi(state?.reference ? null : `/public/faults/${token}`);
  const reference = state?.reference ?? lookup.data?.fault.reference;
  const sms = state?.sms;
  const link = `${window.location.origin}${trackingPath(token)}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false); // the link is also shown in full below, so it can be copied by hand
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-card bg-accent text-on-accent">
          <Check size={34} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <div>
          <h1 className="display text-[26px]">Fault report sent</h1>
          <p className="mb-0 mt-1.5 text-sm text-grey">
            {reference ? `Reference #${reference}` : 'Reference loading…'}
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-3.5">
        <Card className="flex flex-col gap-3 px-[18px] py-4">
          <div className="eyebrow">Your tracking link</div>
          <p className="m-0 break-all rounded-control bg-tint px-3 py-2.5 text-sm font-semibold">
            {link}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={trackingPath(token)} className="btn btn-accent sm:flex-1">
              Track this fault
            </Link>
            <button type="button" className="btn btn-outline sm:flex-1" onClick={copy}>
              <Copy size={16} aria-hidden="true" />
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>
          <p className="m-0 text-xs text-grey">
            Save this link or take a screenshot. Anyone with the link can see this report, so share
            it only with people you trust. If you lose it, call <strong>2727</strong>.
          </p>
        </Card>

        {sms?.delivery === 'queued' && (
          <p className="m-0 flex items-start gap-2.5 rounded-card bg-tint px-[18px] py-4 text-sm">
            <MessageSquare size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>We are texting this link and updates to the phone number you gave.</span>
          </p>
        )}
        {sms?.delivery === 'simulated' && (
          <Card className="flex flex-col gap-2 px-[18px] py-4">
            <div className="eyebrow flex items-center gap-2">
              <MessageSquare size={14} aria-hidden="true" />
              Text message (simulated)
            </div>
            <p className="m-0 break-words rounded-control bg-tint px-3 py-2.5 text-sm">
              {sms.text}
            </p>
            <p className="m-0 text-xs text-grey">
              No text message gateway is connected in this pilot, so nothing was sent. This is what
              the text would say.
            </p>
          </Card>
        )}

        <p className="m-0 rounded-card bg-tint px-[18px] py-4 text-xs font-medium">
          A service coordinator will now assign a technician. Keep your phone nearby: the technician
          may call to confirm where you are.
        </p>

        <div className="flex flex-col gap-3.5 sm:flex-row">
          <Link to="/report" className="btn btn-outline sm:px-10">
            Report another fault
          </Link>
          <Link to="/" className="btn btn-outline sm:px-10">
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
