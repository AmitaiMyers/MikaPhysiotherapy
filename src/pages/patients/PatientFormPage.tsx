import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { NumberField, SelectField, TextAreaField, TextField } from '../../components/forms';
import { Empty, PageHeader } from '../../components/ui';
import { localDate } from '../../patients/dates';
import { SEX_LABELS } from '../../patients/patients';
import { emptyPatient } from '../../patients/records';
import type { Patient, Sex } from '../../patients/types';
import { getRecord, saveRecord } from '../../patients/vault';

/** New patient (no id in the URL) or edit an existing one. */
export function PatientFormPage() {
  const { id } = useParams();
  const existing = id === undefined ? undefined : getRecord('patient', id);
  if (id !== undefined && existing === undefined) return <Empty>Patient not found.</Empty>;
  return <PatientForm initial={existing ?? emptyPatient(localDate(new Date()))} isNew={existing === undefined} />;
}

function PatientForm({ initial, isNew }: { initial: Patient; isNew: boolean }) {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(initial);
  const update = (patch: Partial<Patient>) => setPatient((current) => ({ ...current, ...patch }));
  return (
    <div className="page">
      <PageHeader back title={isNew ? 'New patient' : `Edit ${initial.firstName}`} />
      <form
        className="card vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          // The age changes over time, so remember when it was entered.
          const ageChanged = patient.age !== initial.age;
          saveRecord('patient', { ...patient, firstName: patient.firstName.trim(), ageRecordedOn: ageChanged || isNew ? localDate(new Date()) : patient.ageRecordedOn });
          void navigate(`/patients/${patient.id}`, { replace: true });
        }}
      >
        <TextField label="First name" value={patient.firstName} onChange={(firstName) => update({ firstName })} required />
        <div className="field-row">
          <NumberField label="Age" value={patient.age} min={0} max={120} onChange={(age) => update({ age })} />
          <SelectField label="Sex" value={patient.sex ?? ''} onChange={(sex) => update({ sex: sex === '' ? null : (sex as Sex) })}>
            <option value="">—</option>
            {(Object.keys(SEX_LABELS) as Sex[]).map((sex) => (
              <option key={sex} value={sex}>
                {SEX_LABELS[sex]}
              </option>
            ))}
          </SelectField>
        </div>
        <TextAreaField
          label="Medical background"
          rows={5}
          value={patient.medicalBackground}
          placeholder="Conditions, surgeries, medication, red flags, allergies, imaging…"
          onChange={(medicalBackground) => update({ medicalBackground })}
        />
        <TextAreaField label="Lifestyle" rows={4} value={patient.lifestyle} placeholder="Work, sport, activity level, goals…" onChange={(lifestyle) => update({ lifestyle })} />
        <button type="submit" className="button button-primary" disabled={patient.firstName.trim() === ''}>
          {isNew ? 'Create patient' : 'Save'}
        </button>
      </form>
    </div>
  );
}
