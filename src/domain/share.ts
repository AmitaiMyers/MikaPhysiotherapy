import { getJoint, getNerve } from '../data';
import { muscleViews } from '../data/images';
import type { Exercise } from '../data/exerciseTypes';
import type { Protocol } from '../data/protocolTypes';
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
  return appUrl(`/muscles/${muscle.id}`);
}

async function imageFile(muscle: Muscle): Promise<File | null> {
  const image = muscleViews(muscle.id)[0];
  if (!image) return null;
  const response = await fetch(image.url);
  if (!response.ok) return null;
  return new File([await response.blob()], `${muscle.id}.webp`, { type: 'image/webp' });
}

export type ShareResult = 'shared' | 'copied' | 'cancelled';

/**
 * Share through the system share sheet (with an optional file where supported), or copy the
 * text and link to the clipboard on browsers without Web Share.
 */
export async function shareContent({ title, text, url, file = null }: { title: string; text: string; url: string; file?: File | null }): Promise<ShareResult> {
  // Typed as always present, but missing in desktop Firefox and some embedded browsers.
  if (typeof navigator.share !== 'function') {
    await navigator.clipboard.writeText(`${text}\n\n${url}`);
    return 'copied';
  }
  const withFile = file !== null && navigator.canShare?.({ files: [file] }) === true;
  try {
    await navigator.share({ title, text, url, ...(withFile ? { files: [file] } : {}) });
    return 'shared';
  } catch (error) {
    // The user closing the share sheet is not an error.
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

export async function shareMuscle(muscle: Muscle): Promise<ShareResult> {
  return shareContent({ title: muscle.name, text: muscleShareText(muscle), url: muscleUrl(muscle), file: await imageFile(muscle) });
}

/** Link to a screen of the app (hash router). */
export function appUrl(path: string): string {
  return `${location.origin}${location.pathname}#${path}`;
}

/** Plain-text exercise card: enough to perform it from a message. */
export function exerciseShareText(exercise: Exercise): string {
  return [
    exercise.name,
    '',
    `Position: ${exercise.position}`,
    ...exercise.steps.map((step, i) => `${i + 1}. ${step}`),
    `Dosage: ${exercise.dosage}`,
    `Tip: ${exercise.tip}`,
  ].join('\n');
}

export function shareExercise(exercise: Exercise): Promise<ShareResult> {
  return shareContent({ title: exercise.name, text: exerciseShareText(exercise), url: appUrl(`/rehab/exercises/${exercise.id}`) });
}

/** Plain-text protocol outline: phases with timing and their criteria to progress. */
export function protocolShareText(protocol: Protocol, disclaimer: string): string {
  const phases = protocol.phases.flatMap((phase) => [
    '',
    `${phase.name} (${phase.timeframe})`,
    ...phase.protection.map((item) => `• ${item}`),
    ...(phase.criteria.length > 0 ? [`To progress: ${phase.criteria.join(' ')}`] : []),
  ]);
  return [`${protocol.name} — ${protocol.management}`, protocol.summary, ...phases, '', disclaimer].join('\n');
}

export function shareProtocol(protocol: Protocol, disclaimer: string): Promise<ShareResult> {
  return shareContent({ title: protocol.name, text: protocolShareText(protocol, disclaimer), url: appUrl(`/rehab/protocols/${protocol.id}`) });
}
