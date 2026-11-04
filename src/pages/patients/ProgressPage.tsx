import { useState } from 'react';
import { useParams } from 'react-router';
import { LineChart } from '../../components/LineChart';
import { Card, Empty, PageHeader } from '../../components/ui';
import { getJoint } from '../../data';
import { progressSeries, seriesChange, SERIES_GROUPS } from '../../patients/progress';
import { getRecord, useRecords } from '../../patients/vault';

export function ProgressPage() {
  const { id = '' } = useParams();
  const patient = getRecord('patient', id);
  const episodes = useRecords('episode').filter((e) => e.patientId === id);
  const sessions = useRecords('session').filter((s) => s.patientId === id);
  const [episodeId, setEpisodeId] = useState(episodes.find((e) => e.status === 'active')?.id ?? '');
  if (patient === undefined) return <Empty>Patient not found.</Empty>;
  const inScope = episodeId === '' ? sessions : sessions.filter((s) => s.episodeId === episodeId);
  const series = progressSeries(inScope, (jointId) => getJoint(jointId).name.replace(/ joint$/, ''));
  const doneCount = inScope.filter((s) => s.status === 'done').length;

  return (
    <div className="page">
      <PageHeader back title={`${patient.firstName} — progress`} subtitle={`${doneCount} completed ${doneCount === 1 ? 'session' : 'sessions'}`} />
      {episodes.length > 0 && (
        <label className="field">
          <span>Episode</span>
          <select value={episodeId} onChange={(event) => setEpisodeId(event.target.value)}>
            <option value="">All sessions</option>
            {episodes.map((episode) => (
              <option key={episode.id} value={episode.id}>
                {episode.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {series.length === 0 && <Empty>No measurements yet. Record pain, scores, range of motion, strength or outcome measures in completed sessions to see them here.</Empty>}
      {SERIES_GROUPS.map((group) => {
        const inGroup = series.filter((s) => s.group === group);
        if (inGroup.length === 0) return null;
        return (
          <section key={group} className="progress-group">
            <h2 className="section-heading">{group}</h2>
            <div className="chart-grid-layout">
              {inGroup.map((s) => (
                <Card key={s.key}>
                  <div className="chart-title">
                    <strong>{s.label}</strong>
                    <span className="chart-change">{seriesChange(s)}</span>
                  </div>
                  <LineChart series={s} />
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
