import { Link } from 'react-router';
import { getJoint } from '../data';
import { ligamentThumbnail } from '../data/images';
import { getLigament, ligamentGroup } from '../data/ligaments';
import type { Ligament } from '../data/types';
import { KIND_LABELS, restraintsOf } from '../domain/ligaments';
import { ImageRow } from './ImageRows';

/** A ligament as a chip; secondary restraints are outlined, like assisting muscles. */
export function LigamentLink({ id, secondary = false }: { id: string; secondary?: boolean }) {
  return (
    <span className={secondary ? 'chip-assist' : ''}>
      <Link to={`/ligaments/${id}`} className="chip-link">
        {getLigament(id).name}
      </Link>
    </span>
  );
}

/** The structures limiting one motion of a joint, primary restraints first. */
export function RestrainedBy({ jointId, motion }: { jointId: string; motion: string }) {
  const restraints = restraintsOf(jointId, motion);
  if (restraints.length === 0) return null;
  return (
    <div className="related">
      <span className="related-label">Limited by</span>
      <span className="chips">
        {restraints.map(({ ligament, restraint }) => (
          <LigamentLink key={ligament.id} id={ligament.id} secondary={restraint.role === 'secondary'} />
        ))}
      </span>
    </div>
  );
}

/** One line of what a structure restrains, e.g. " · Knee joint anterior tibial translation". */
function mainRestraint(ligament: Ligament): string {
  const restraint = ligament.restraints.find((r) => r.role === 'primary') ?? ligament.restraints[0];
  return restraint === undefined ? '' : ` · ${getJoint(restraint.jointId).name.split(' (')[0]} ${restraint.motion}`;
}

/** A ligament in a list, with its thumbnail like a muscle row. */
export function LigamentRow({ ligament, showGroup }: { ligament: Ligament; showGroup: boolean }) {
  const meta = `${showGroup ? `${ligamentGroup(ligament).name} · ` : ''}${KIND_LABELS[ligament.kind]}${mainRestraint(ligament)}`;
  return <ImageRow to={`/ligaments/${ligament.id}`} thumb={ligamentThumbnail(ligament.id)} name={ligament.name} meta={meta} />;
}
