import { Link, useNavigate, useParams } from 'react-router';
import { RehabTabs } from '../components/RehabTabs';
import { Card, Empty, Note, PageHeader, ShareButton } from '../components/ui';
import { getExercise } from '../data/exercises';
import { deleteProgramme, moveProgrammeItem, removeItem, restoreProgramme, updateItem, updateProgramme, useProgrammes } from '../domain/programmeStore';
import { programmeShareText, whatsAppUrl, type Programme } from '../domain/programmes';
import { appUrl, shareContent } from '../domain/share';
import { toastWithUndo } from '../feedback/store';
import { Icon } from '../components/Icon';

export function ProgrammeListPage() {
  const programmes = useProgrammes();
  const sorted = [...programmes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div className="page">
      <PageHeader title="Rehab" subtitle="Home exercise programmes · saved on this device" />
      <RehabTabs />
      {sorted.length === 0 ? (
        <Card>
          <p>No programmes yet.</p>
          <Note>Open an exercise and tap “Add to programme”, or add a whole phase from a fracture or surgery protocol.</Note>
        </Card>
      ) : (
        <section className="card list-card">
          <ul className="muscle-list">
            {sorted.map((programme) => (
              <li key={programme.id}>
                <Link to={`/rehab/programmes/${programme.id}`} className="muscle-row">
                  <span className="muscle-row-text">
                    <span className="muscle-row-name">{programme.title}</span>
                    <span className="muscle-row-meta">
                      {programme.items.length} {programme.items.length === 1 ? 'exercise' : 'exercises'} · updated {new Date(programme.updatedAt).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="chevron" aria-hidden="true">
                    <Icon name="chevron" size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Note>Programmes stay on this phone or computer only. Avoid storing names or other personal details of patients.</Note>
    </div>
  );
}

export function ProgrammeDetailPage() {
  const { id = '' } = useParams();
  const programme = useProgrammes().find((p) => p.id === id);
  if (programme === undefined) return <Empty>Programme not found.</Empty>;
  return <ProgrammeEditor programme={programme} />;
}

function ProgrammeEditor({ programme }: { programme: Programme }) {
  const navigate = useNavigate();
  const text = programmeShareText(programme, getExercise);
  return (
    <div className="page programme-page">
      <PageHeader
        back
        title={programme.title}
        subtitle={`${programme.items.length} exercises`}
        actions={<ShareButton label="Share programme" onShare={() => shareContent({ title: programme.title, text, url: appUrl('/rehab/programmes') })} />}
      />
      <section className="card no-print">
        <label className="field">
          <span>Title</span>
          <input className="search-input" value={programme.title} onChange={(event) => updateProgramme(programme.id, { title: event.target.value })} />
        </label>
        <label className="field spaced-field">
          <span>Notes for the patient</span>
          <textarea className="text-area" rows={3} value={programme.notes} onChange={(event) => updateProgramme(programme.id, { notes: event.target.value })} />
        </label>
      </section>
      {programme.notes.trim() !== '' && <p className="print-only pre-line">{programme.notes}</p>}
      {programme.items.length === 0 && <Empty>No exercises yet — add them from the exercise pages.</Empty>}
      {programme.items.map((item, index) => {
        const exercise = getExercise(item.exerciseId);
        return (
          <section key={item.exerciseId} className="card programme-item">
            <div className="programme-item-header">
              <h2>
                {index + 1}. <Link to={`/rehab/exercises/${exercise.id}`}>{exercise.name}</Link>
              </h2>
              <div className="button-row no-print">
                <button type="button" className="icon-button" aria-label="Move up" disabled={index === 0} onClick={() => moveProgrammeItem(programme.id, index, -1)}>
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Move down"
                  disabled={index === programme.items.length - 1}
                  onClick={() => moveProgrammeItem(programme.id, index, 1)}
                >
                  ↓
                </button>
                <button type="button" className="icon-button" aria-label={`Remove ${exercise.name}`} onClick={() => removeItem(programme.id, index)}>
                  <Icon name="close" size={18} />
                </button>
              </div>
            </div>
            <p className="small">{exercise.position}</p>
            <ol className="steps small">
              {exercise.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <label className="field spaced-field">
              <span>Dosage</span>
              <textarea className="text-area" rows={2} value={item.dosage} onChange={(event) => updateItem(programme.id, index, { dosage: event.target.value })} />
            </label>
            <label className="field spaced-field">
              <span>Note</span>
              <input className="search-input" placeholder="e.g. left side only, pain up to 3/10" value={item.note} onChange={(event) => updateItem(programme.id, index, { note: event.target.value })} />
            </label>
            <p className="print-only">
              <strong>Dosage:</strong> {item.dosage}
              {item.note.trim() !== '' && (
                <>
                  <br />
                  <strong>Note:</strong> {item.note}
                </>
              )}
            </p>
          </section>
        );
      })}
      <p className="print-only small">Stop and contact your physiotherapist if an exercise causes sharp or increasing pain.</p>
      <div className="button-row no-print">
        <a className="button" href={whatsAppUrl(text)} target="_blank" rel="noreferrer">
          Send by WhatsApp
        </a>
        <button type="button" className="button" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <button
          type="button"
          className="text-button danger"
          onClick={() => {
            deleteProgramme(programme.id);
            toastWithUndo(`“${programme.title}” deleted`, () => restoreProgramme(programme));
            void navigate('/rehab/programmes', { replace: true });
          }}
        >
          Delete programme
        </button>
      </div>
    </div>
  );
}
