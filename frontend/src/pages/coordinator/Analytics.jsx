import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell as BarCell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useApi } from '../../hooks/useApi.js';
import { STATUS_LABEL } from '../../lib/format.js';
import { CoordinatorHeading } from '../../components/CoordinatorShell.jsx';
import { Async } from '../../components/States.jsx';

const INK = '#0B0B0B';
const VOLT = '#FFD400';
const axisTick = { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fill: '#5E5A52' };
const show = (value) => (value === null || value === undefined ? '—' : value);

function Tile({ label, value, unit, note }) {
  return (
    <div className="flex min-h-[120px] flex-col justify-between bg-white p-4">
      <div className="eyebrow text-muted">{label}</div>
      <div>
        <div className="text-4xl font-black leading-none">
          {show(value)}
          {unit && value !== null && <span className="ml-1 text-base font-bold">{unit}</span>}
        </div>
        <div className="mt-1 text-xs text-muted">{note}</div>
      </div>
    </div>
  );
}

function ChartPanel({ title, note, summary, children }) {
  return (
    <section className="panel">
      <div className="border-b border-ink p-4">
        <h2 className="m-0 text-lg font-black uppercase">{title}</h2>
        <p className="mb-0 mt-1 text-sm text-muted">{note}</p>
      </div>
      <div className="h-64 p-4" role="img" aria-label={summary}>
        {children}
      </div>
    </section>
  );
}

export default function Analytics() {
  const state = useApi('/stats/analytics', { interval: 10000 });

  return (
    <>
      <CoordinatorHeading eyebrow="Response-performance report · sample data" title="Analytics">
        <p className="mb-0 mt-3 max-w-2xl text-sm text-muted">
          Calculated from the time recorded at each status change. Figures update as reports move
          through the stages.
        </p>
      </CoordinatorHeading>

      <Async state={state} label="Calculating the report">
        {({ analytics }) => {
          const { averages, clarification } = analytics;
          const distribution = analytics.statusDistribution.map((row) => ({
            name: STATUS_LABEL[row.status],
            count: row.count,
            status: row.status,
          }));
          const stages = [
            { name: 'Report to assignment', minutes: averages.assignmentMinutes },
            { name: 'Location identification', minutes: averages.locationIdentificationMinutes },
            { name: 'Travel to location', minutes: averages.travelMinutes },
            { name: 'On-site work', minutes: averages.onSiteMinutes },
          ].map((row) => ({ ...row, minutes: row.minutes ?? 0 }));

          return (
            <>
              <div className="grid grid-cols-2 gap-px border border-ink bg-ink lg:grid-cols-4">
                <Tile
                  label="Average response time"
                  value={averages.responseMinutes}
                  unit="min"
                  note="Report to arrival"
                />
                <Tile
                  label="Average assignment time"
                  value={averages.assignmentMinutes}
                  unit="min"
                  note="Report to assignment"
                />
                <Tile
                  label="Average arrival time"
                  value={averages.arrivalMinutes}
                  unit="min"
                  note="Assignment to arrival"
                />
                <Tile
                  label="Location-identification time"
                  value={averages.locationIdentificationMinutes}
                  unit="min"
                  note="Assigned to On the Way"
                />
                <Tile
                  label="Completed jobs"
                  value={analytics.completedJobs}
                  note={`of ${analytics.totalReports} reports`}
                />
                <Tile
                  label="Clarification contacts"
                  value={clarification.perJob}
                  unit="per job"
                  note={`${clarification.total} contacts in total`}
                />
                <Tile
                  label="Jobs with no contact"
                  value={clarification.jobsWithNoContactPercent}
                  unit="%"
                  note="Location found from the map alone"
                />
                <Tile
                  label="Average on-site time"
                  value={averages.onSiteMinutes}
                  unit="min"
                  note="Arrival to resolution"
                />
              </div>

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <ChartPanel
                  title="Fault status distribution"
                  note="Number of reports currently at each stage."
                  summary={`Reports per stage: ${distribution.map((row) => `${row.name} ${row.count}`).join(', ')}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distribution}
                      margin={{ top: 18, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#CFCBC1" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={{ stroke: INK }}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Bar dataKey="count" isAnimationActive={false}>
                        {distribution.map((row) => (
                          <BarCell
                            key={row.status}
                            fill={
                              row.status === 'RESOLVED'
                                ? '#2B6A3F'
                                : row.status === 'REPORTED'
                                  ? '#C2161C'
                                  : INK
                            }
                          />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="top"
                          style={{ ...axisTick, fill: INK, fontWeight: 500 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="Average time per stage"
                  note="Where the minutes go between report and resolution."
                  summary={`Average minutes per stage: ${stages.map((row) => `${row.name} ${row.minutes}`).join(', ')}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stages}
                      layout="vertical"
                      margin={{ top: 0, right: 56, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#CFCBC1" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={{ stroke: INK }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Bar dataKey="minutes" fill={VOLT} stroke={INK} isAnimationActive={false}>
                        <LabelList
                          dataKey="minutes"
                          position="right"
                          formatter={(value) => `${value} min`}
                          style={{ ...axisTick, fill: INK, fontWeight: 500 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="Completed jobs · last 7 days"
                  note="Faults marked as resolved each day."
                  summary={`Resolved per day: ${analytics.completedLast7Days.map((row) => `${row.label} ${row.completed}`).join(', ')}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.completedLast7Days}
                      margin={{ top: 18, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#CFCBC1" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={{ stroke: INK }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Bar dataKey="completed" fill={INK} isAnimationActive={false}>
                        <LabelList
                          dataKey="completed"
                          position="top"
                          style={{ ...axisTick, fill: INK, fontWeight: 500 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <section className="panel">
                  <div className="border-b border-ink p-4">
                    <h2 className="m-0 text-lg font-black uppercase">
                      How the figures are measured
                    </h2>
                    <p className="mb-0 mt-1 text-sm text-muted">
                      Each interval is the difference between two stored status times.
                    </p>
                  </div>
                  <dl className="m-0 px-4 py-1 text-sm">
                    {[
                      ['Response time', 'Reported → Arrived'],
                      ['Assignment time', 'Reported → Assigned'],
                      ['Location identification', 'Assigned → On the Way'],
                      ['Travel to location', 'On the Way → Arrived'],
                      ['On-site work', 'Arrived → Resolved'],
                      ['Clarification contacts', 'Entered by the technician when resolving'],
                    ].map(([term, definition], index, all) => (
                      <div
                        key={term}
                        className={`flex justify-between gap-4 py-2.5 ${index < all.length - 1 ? 'border-b border-line' : ''}`}
                      >
                        <dt className="font-bold">{term}</dt>
                        <dd className="m-0 text-right font-mono text-xs leading-5">{definition}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            </>
          );
        }}
      </Async>
    </>
  );
}
