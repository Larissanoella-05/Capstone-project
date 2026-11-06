import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { Async, EmptyState } from '../../components/States.jsx';
import TrackingView from '../../components/TrackingView.jsx';

export default function GuestTracking() {
  const { token } = useParams();
  const state = useApi(`/public/faults/${token}`, { interval: 4000 });

  if (state.error?.status === 404) {
    return (
      <EmptyState
        title="This tracking link is not valid"
        action={
          <Link to="/report" className="btn btn-accent">
            Report a fault
          </Link>
        }
      >
        The link may be mistyped, or the report was closed more than 7 days ago. If a fault is still
        not fixed, report it again or call 2727.
      </EmptyState>
    );
  }

  return (
    <Async state={state} label="Loading fault">
      {({ fault }) => <TrackingView fault={fault} fetchedAt={state.fetchedAt} />}
    </Async>
  );
}
