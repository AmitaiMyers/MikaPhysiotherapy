import { getJoint, getNerve } from '../data';
import { muscleViews } from '../data/images';
import type { Muscle } from '../data/types';
import { formatRoots } from './relations';

/** Plain-text card for messaging apps: the essentials a colleague needs at a glance. */
export function muscleShareText(muscle: Muscle): string {
  const lines = [
    `${muscle.name} (${muscle.latinName})`,
    muscle.summary,
    '',
    `Origin: ${muscle.origin.map((a) => a.text).join('; ')}`,
    `Insertion: ${muscle.insertion.map((a) => a.text).join('; ')}`,
    `Nerve: ${muscle.innervation.map((s) => `${getNerve(s.nerveId).name} (${formatRoots(s.roots)})`).join('; ')}`,
    `Actions: ${muscle.actions.map((a) => `${getJoint(a.jointId).name} ${a.movement}${a.role === 'assist' ? ' (assists)' : ''}`).join('; ') || '—'}`,
  ];
  return lines.join('\n');
}

export function muscleUrl(muscle: Muscle): string {
  return `${location.origin}${location.pathname}#/muscles/${muscle.id}`;
}

async function imageFile(muscle: Muscle): Promise<File | null> {
  const image = muscleViews(muscle.id)[0];
  if (!image) return null;
  const response = await fetch(image.url);
  if (!response.ok) return null;
  return new File([await response.blob()], `${muscle.id}.webp`, { type: 'image/webp' });
}

/**
 * Share through the system share sheet (with the first image where supported), or copy the
 * text and link to the clipboard on browsers without Web Share.
 */
export async function shareMuscle(muscle: Muscle): Promise<'shared' | 'copied' | 'cancelled'> {
  const text = muscleShareText(muscle);
  const url = muscleUrl(muscle);
  // Typed as always present, but missing in desktop Firefox and some embedded browsers.
  if (typeof navigator.share !== 'function') {
    await navigator.clipboard.writeText(`${text}\n\n${url}`);
    return 'copied';
  }
  const file = await imageFile(muscle);
  const withFile = file !== null && navigator.canShare?.({ files: [file] }) === true;
  try {
    await navigator.share({ title: muscle.name, text, url, ...(withFile ? { files: [file] } : {}) });
    return 'shared';
  } catch (error) {
    // The user closing the share sheet is not an error.
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}
