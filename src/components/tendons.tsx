import { Link } from 'react-router';
import { getBone, getMuscle, getSpecialTest } from '../data';
import { getExercise } from '../data/exercises';
import { getProtocol } from '../data/protocols';
import { tendonPath } from '../data/tendons';
import type { Tendon } from '../data/types';
import { linkedTechniques } from '../techniques/view';
import { ExerciseList } from './ExerciseList';
import { TechniquesCard, useTechniqueViews } from './techniques';
import { BulletSection, Card, MuscleLink } from './ui';

/** A chip that opens a tendon on its muscle's Tendons tab. */
export function TendonLink({ tendon }: { tendon: Tendon }) {
  return (
    <Link to={tendonPath(tendon)} className="chip-link">
      {tendon.name}
    </Link>
  );
}

/** "Insertion tendon of soleus and gastrocnemius". */
export function tendonOf(tendon: Tendon): string {
  return `${tendon.end === 'origin' ? 'Origin' : 'Insertion'} tendon of ${tendon.muscleIds.map((id) => getMuscle(id).name.toLowerCase()).join(', ')}`;
}

/** Techniques for any of the tendon's muscles, each once. */
function TendonTechniques({ tendon }: { tendon: Tendon }) {
  const views = useTechniqueViews();
  const linked = [...new Map(tendon.muscleIds.flatMap((id) => linkedTechniques(views, { kind: 'muscle', id })).map((v) => [v.id, v])).values()];
  if (linked.length === 0) return null;
  return <TechniquesCard views={linked} title="Techniques for its muscles" />;
}

/** Everything about a tendon: anatomy and function, pathology and tests, loading and rehab, techniques. */
export function TendonDetails({ tendon }: { tendon: Tendon }) {
  return (
    <div className="tendon-details">
      <p className="summary">{tendon.summary}</p>
      {tendon.synonyms.length > 0 && (
        <p className="muted small">
          <strong>Also called:</strong> {tendon.synonyms.join(', ')}
        </p>
      )}
      <Card title="Muscles">
        <span className="chips">
          {tendon.muscleIds.map((id) => (
            <MuscleLink key={id} id={id} />
          ))}
        </span>
      </Card>
      <BulletSection title="Anatomy" items={tendon.structure} />
      <Card title="Attachment">
        <ul className="bullets">
          {tendon.attachments.map((a) => (
            <li key={a.text}>
              {a.text}
              {a.bones.length > 0 && (
                <span className="bone-tags">
                  {a.bones.map((boneId) => (
                    <Link key={boneId} to={`/bones/${boneId}`} className="tag">
                      {getBone(boneId).name}
                    </Link>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <BulletSection title="Function" items={tendon.functions} />
      <BulletSection title="Blood supply" items={tendon.bloodSupply} />
      <Card title="Healing">
        <p>{tendon.healing}</p>
      </Card>
      <BulletSection title="Clinical significance" items={tendon.clinical} />
      <BulletSection title="Mechanism of injury" items={tendon.injuryMechanisms} />
      <BulletSection title="Grading & classification" items={tendon.grading} />
      <BulletSection title="Palpation" items={tendon.palpation} />
      {tendon.specialTestIds.length > 0 && (
        <Card title="Special tests">
          <ul className="link-list">
            {tendon.specialTestIds.map((id) => (
              <li key={id}>
                <Link to={`/tests/${id}`}>{getSpecialTest(id).name}</Link>
                <span className="muted"> — {getSpecialTest(id).purpose}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <BulletSection title="Imaging" items={tendon.imaging} />
      {tendon.loading.length > 0 && (
        <Card title="Loading programme">
          <ol className="steps">
            {tendon.loading.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      )}
      {tendon.protocolIds.length > 0 && (
        <Card title="Protocols">
          <ul className="link-list">
            {tendon.protocolIds.map((id) => (
              <li key={id}>
                <Link to={`/rehab/protocols/${id}`}>{getProtocol(id).name}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {tendon.exerciseIds.length > 0 && (
        <section className="card list-card">
          <h2 className="list-card-title">Exercises ({tendon.exerciseIds.length})</h2>
          <ExerciseList exercises={tendon.exerciseIds.map(getExercise)} />
        </section>
      )}
      <TendonTechniques tendon={tendon} />
    </div>
  );
}
