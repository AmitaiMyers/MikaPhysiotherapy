import { PatientsTabs } from '../../components/PatientsTabs';
import { Card, Note, PageHeader } from '../../components/ui';
import type { SessionTemplate } from '../../patients/types';
import { deleteRecord, saveRecord, useRecords } from '../../patients/vault';
import { promptText, toastWithUndo } from '../../feedback/store';

function describe(template: SessionTemplate): string {
  const c = template.content;
  const parts = [
    [c.exercises.length, 'exercises'],
    [c.objective.rom.length, 'ROM'],
    [c.objective.tests.length, 'tests'],
    [c.objective.outcomes.length, 'outcome measures'],
    [c.scores.length, 'scores'],
  ] as const;
  return parts.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}`).join(' · ') || 'Empty';
}

export function TemplatesPage() {
  const templates = [...useRecords('template')].sort((a, b) => a.name.localeCompare(b.name));
  const customs = [...useRecords('customExercise')].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="page">
      <PageHeader title="Patients" subtitle="Session templates and custom exercises" />
      <PatientsTabs />
      <Card title={`Session templates (${templates.length})`}>
        {templates.length === 0 && <Note>Open a session and tap “Save as template” to reuse its measurements, tests, exercises and scores.</Note>}
        <ul className="link-list">
          {templates.map((template) => (
            <li key={template.id} className="template-row">
              <span>
                <strong>{template.name}</strong>
                <br />
                <span className="muted small">{describe(template)}</span>
              </span>
              <span className="button-row">
                <button
                  type="button"
                  className="text-button small"
                  onClick={() => {
                    void promptText({ title: 'Rename template', label: 'Name', initial: template.name, confirmLabel: 'Rename' }).then((name) => {
                      if (name !== null) saveRecord('template', { ...template, name });
                    });
                  }}
                >
                  Rename
                </button>
                <button type="button" className="text-button danger small" onClick={() => {
                    deleteRecord('template', template.id);
                    toastWithUndo(`Template “${template.name}” deleted`, () => saveRecord('template', template));
                  }}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={`Custom exercises (${customs.length})`}>
        {customs.length === 0 && <Note>Create custom exercises from the exercise search in a session.</Note>}
        <ul className="link-list">
          {customs.map((custom) => (
            <li key={custom.id} className="template-row">
              <strong>{custom.name}</strong>
              <button
                type="button"
                className="text-button small"
                onClick={() => {
                  void promptText({ title: 'Rename exercise', label: 'Name', initial: custom.name, confirmLabel: 'Rename' }).then((name) => {
                    if (name !== null) saveRecord('customExercise', { ...custom, name });
                  });
                }}
              >
                Rename
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
