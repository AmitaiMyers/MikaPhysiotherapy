import { Link } from 'react-router';
import { getMuscle } from '../data';
import { muscleViews } from '../data/images';

/** Muscles as highlighted anatomy images, each linking to the muscle. */
export function MuscleImageStrip({ muscleIds }: { muscleIds: string[] }) {
  if (muscleIds.length === 0) return null;
  return (
    <div className="target-strip">
      {muscleIds.map((muscleId) => {
        const image = muscleViews(muscleId)[0];
        return (
          <Link key={muscleId} to={`/muscles/${muscleId}`} className="target-card">
            {image ? <img src={image.url} alt="" loading="lazy" width={120} height={150} /> : <span className="target-image-empty" aria-hidden="true" />}
            <span>{getMuscle(muscleId).name}</span>
          </Link>
        );
      })}
    </div>
  );
}
