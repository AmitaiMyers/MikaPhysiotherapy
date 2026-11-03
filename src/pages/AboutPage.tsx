import { BulletSection, Card, DISCLAIMER, PageHeader } from '../components/ui';
import { MUSCLES, SOURCES } from '../data';

export function AboutPage() {
  return (
    <div className="page">
      <PageHeader back title="About" subtitle="Method, sources and licences" />
      <Card title="Disclaimer">
        <p>{DISCLAIMER}</p>
      </Card>
      <BulletSection
        title="How the data was compiled"
        items={[
          'Each muscle record was written in original wording from standard anatomical knowledge, then cross-checked against the references below.',
          'Where references disagree (most often spinal root values), the most commonly cited value is shown and the alternatives are given in a note.',
          'Agonists and antagonists are not typed in by hand: they are worked out from the action lists of all muscles, so they always agree.',
          'Normal ranges of motion are the AAOS values.',
          `The app covers ${MUSCLES.length} physiotherapy-relevant skeletal muscles, grouped by region, compartment and layer.`,
        ]}
      />
      <Card title="Images and 3D model">
        <p>
          Images and the 3D model are rendered from Z-Anatomy, the open-source atlas of anatomy (CC BY-SA 4.0), which is derived from BodyParts3D, © The Database Center for Life Science (CC BY-SA 2.1 JP). The meshes were simplified for the web; origin and insertion areas come from the Z-Anatomy model.
          Under the share-alike terms, the images and model in this app are themselves available under CC BY-SA 4.0.
        </p>
        <p className="muted">A few small muscles (for example palmaris brevis and some perineal muscles) are not modelled in any open atlas, so they have no image.</p>
      </Card>
      <Card title="References">
        <ul className="bullets sources">
          {SOURCES.map((source) => (
            <li key={source.id}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.citation}</a> : source.citation}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
