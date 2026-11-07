/**
 * Records saved by older versions of the app lack fields added later. They are brought up to date
 * when the vault is opened, so the rest of the app can rely on every field being present.
 */
import type { RecordKind } from './types';

type Stored = Record<string, unknown>;

/** Sessions and templates gained `techniques`; episodes gained `plannedTechniques` (Techniques feature). */
export function upgradeRecord(kind: RecordKind, value: Stored): Stored {
  if (kind === 'session' && !('techniques' in value)) return { ...value, techniques: [] };
  if (kind === 'template') {
    const content = value.content as Stored;
    return 'techniques' in content ? value : { ...value, content: { ...content, techniques: [] } };
  }
  if (kind === 'episode' && !('plannedTechniques' in value)) return { ...value, plannedTechniques: [] };
  return value;
}
