import { Link, useParams } from 'react-router';
import { EvidenceBadge, ReferenceChips, ReferencesSection, TechniqueRows, useTechniqueViews } from '../../components/techniques';
import { BulletSection, Card, Disclaimer, Empty, Note, PageHeader } from '../../components/ui';
import { findProtocol } from '../../data/protocols';
import { areaNames, EVIDENCE_GRADES, findCondition, findFamily, getCondition, GRADE_ORDER, TECHNIQUE_AREAS } from '../../data/techniques';
import { familyName } from '../../techniques/catalog';
import { linkedTechniques } from '../../techniques/view';

/** A technique family: how it works, the evidence per condition, safety, and its techniques by area. */
export function TechniqueFamilyPage() {
  const { id = '' } = useParams();
  const family = findFamily(id);
  const views = useTechniqueViews();
  if (family === undefined) return <Empty>Technique family not found.</Empty>;
  const inFamily = views.filter((v) => v.familyId === family.id);
  const evidence = [...family.evidence].sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade));

  return (
    <div className="page">
      <PageHeader back title={family.name} subtitle={family.aliases.join(' · ')} />
      <aside className="tip-box">
        <span className="tip-label">What it is</span>
        <p>{family.summary}</p>
      </aside>
      {family.training !== null && <Note>{family.training}</Note>}
      <BulletSection title="How it works" items={family.howItWorks} />
      <BulletSection title="Benefits" items={family.benefits} />
      <Card title="What the research says">
        <p>{family.evidenceSummary}</p>
        <ul className="indication-list">
          {evidence.map((indication) => (
            <li key={indication.conditionId}>
              <div className="indication-head">
                <Link to={`/techniques/conditions/${indication.conditionId}`}>{getCondition(indication.conditionId).name}</Link>
                <EvidenceBadge grade={indication.grade} />
              </div>
              <p className="small">{indication.finding}</p>
              <ReferenceChips refIds={indication.refIds} />
            </li>
          ))}
        </ul>
        <GradeLegend />
      </Card>
      <section className="card safety-card" id="safety">
        <h2>Contraindications</h2>
        <ul className="bullets">
          {family.contraindications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3 className="subheading">Precautions</h3>
        <ul className="bullets">
          {family.precautions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <BulletSection title="Dosage" items={family.dosage} />
      <h2 className="section-heading">Techniques ({inFamily.length})</h2>
      {TECHNIQUE_AREAS.map((area) => {
        const inArea = inFamily.filter((v) => v.areas[0] === area.id);
        if (inArea.length === 0) return null;
        return (
          <section key={area.id} className="card list-card">
            <h2>{area.name}</h2>
            <TechniqueRows views={inArea} />
          </section>
        );
      })}
      <ReferencesSection refIds={family.refIds} reviewed={family.reviewed} />
      <Disclaimer />
    </div>
  );
}

function GradeLegend() {
  return (
    <details className="grade-legend">
      <summary className="small">What the grades mean</summary>
      <ul className="bullets small">
        {GRADE_ORDER.map((grade) => (
          <li key={grade}>
            <EvidenceBadge grade={grade} /> {EVIDENCE_GRADES[grade].description}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** A condition: every technique used for it, strongest evidence first, and related protocols. */
export function TechniqueConditionPage() {
  const { id = '' } = useParams();
  const condition = findCondition(id);
  const views = useTechniqueViews();
  if (condition === undefined) return <Empty>Condition not found.</Empty>;
  const ranked = linkedTechniques(views, { kind: 'condition', id: condition.id })
    .map((view) => ({ view, indication: view.indications.find((i) => i.conditionId === condition.id) }))
    .flatMap(({ view, indication }) => (indication === undefined ? [] : [{ view, indication }]))
    .sort((a, b) => GRADE_ORDER.indexOf(a.indication.grade) - GRADE_ORDER.indexOf(b.indication.grade) || a.view.name.localeCompare(b.view.name));
  const protocols = condition.protocolIds.flatMap((pid) => {
    const protocol = findProtocol(pid);
    return protocol === undefined ? [] : [protocol];
  });

  return (
    <div className="page">
      <PageHeader back title={condition.name} subtitle={condition.aliases.join(' · ') || undefined} />
      <p className="breadcrumb">{areaNames(condition.areas)}</p>
      <Card title={`Techniques (${ranked.length}) — strongest evidence first`}>
        <ul className="indication-list">
          {ranked.map(({ view, indication }) => (
            <li key={view.id}>
              <div className="indication-head">
                <Link to={`/techniques/${view.id}`}>{view.name}</Link>
                <EvidenceBadge grade={indication.grade} />
              </div>
              <p className="muted small">{familyName(view.familyId)}</p>
              <p className="small">{indication.finding}</p>
              <ReferenceChips refIds={indication.refIds} />
            </li>
          ))}
        </ul>
        <GradeLegend />
      </Card>
      {protocols.length > 0 && (
        <Card title="Related rehab protocols">
          <ul className="link-list">
            {protocols.map((protocol) => (
              <li key={protocol.id}>
                <Link to={`/rehab/protocols/${protocol.id}`}>{protocol.name}</Link> <span className="muted small">— {protocol.management}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Note>Techniques work best combined with exercise and education; the grades describe the research, not a single patient’s response.</Note>
      <Disclaimer />
    </div>
  );
}
