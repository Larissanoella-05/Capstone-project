import { useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { Async } from '../../components/States.jsx';
import TrackingView from '../../components/TrackingView.jsx';

export default function Tracking() {
  const { id } = useParams();
  // Polling keeps the status, the technician position and the timeline current.
  const state = useApi(`/faults/${id}`, { interval: 4000 });

  return (
    <Async state={state} label="Loading fault">
      {({ fault }) => <TrackingView fault={fault} fetchedAt={state.fetchedAt} />}
    </Async>
  );
}
