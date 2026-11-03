import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { BulletSection, Card, Disclaimer, Empty, MuscleLink, PageHeader } from '../components/ui';
import { findSpecialTest, getSource, MUSCLES, SPECIAL_TESTS } from '../data';

const musclesTestedBy = (testId: string) => MUSCLES.filter((m) => m.specialTestIds.includes(testId));

export function SpecialTestsPage() {
  const [text, setText] = useState('');
  const query = text.trim().toLowerCase();
  const tests = SPECIAL_TESTS.filter((t) => query === '' || `${t.name} ${t.purpose}`.toLowerCase().includes(query));
  return (
    <div className="page">
      <PageHeader title="Special tests" subtitle={`${SPECIAL_TESTS.length} upper-limb tests`} />
      <input type="search" className="search-input" placeholder="Search test or structure" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search special tests" />
      <section className="card list-card">
        {tests.length === 0 ? (
          <Empty>No test matches.</Empty>
        ) : (
          <ul className="muscle-list">
            {tests.map((test) => (
              <li key={test.id}>
                <Link to={`/tests/${test.id}`} className="muscle-row">
                  <span className="muscle-row-text">
                    <span className="muscle-row-name">{test.name}</span>
                    <span className="muscle-row-meta">{test.purpose}</span>
                  </span>
                  <span className="chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function SpecialTestDetailPage() {
  const { id = '' } = useParams();
  const test = findSpecialTest(id);
  if (!test) return <Empty>Test not found.</Empty>;
  const muscles = musclesTestedBy(test.id);
  return (
    <div className="page">
      <PageHeader back title={test.name} subtitle={test.purpose} />
      <Card title="Procedure">
        <ol className="steps">
          {test.procedure.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>
      <Card title="Positive finding">
        <p>{test.positive}</p>
      </Card>
      <BulletSection title="Notes" items={test.notes} />
      <Card title="Related muscles">
        <span className="chips">
          {muscles.map((m) => (
            <MuscleLink key={m.id} id={m.id} />
          ))}
        </span>
      </Card>
      <p className="muted small">Cross-checked against: {test.sourceIds.map((s) => getSource(s).citation.split(' — ')[0]).join(', ')}.</p>
      <Disclaimer />
    </div>
  );
}
