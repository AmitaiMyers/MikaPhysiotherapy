/**
 * Mika's own technique content, stored on the device (not in the encrypted patient vault, since it
 * holds no patient data): techniques she creates, notes and variations she adds to any technique,
 * and the photos and videos she uploads with them.
 */
import type { VideoRef } from '../data/exerciseTypes';
import type { TechniqueAreaId, TechniqueFamilyId } from '../data/techniqueTypes';

/** Where a record came from: written on this device, or imported from a colleague's file. */
export type Origin = { kind: 'mine' } | { kind: 'imported'; from: string; importedAt: string };

export interface CustomTechnique {
  kind: 'technique';
  id: string;
  /** A built-in family, or null for "Other". */
  familyId: TechniqueFamilyId | null;
  name: string;
  areas: TechniqueAreaId[];
  muscleIds: string[];
  jointIds: string[];
  nerveIds: string[];
  conditionIds: string[];
  summary: string;
  position: string;
  steps: string[];
  keyPoints: string[];
  dosage: string;
  safety: string[];
  video: VideoRef | null;
  mediaIds: string[];
  author: string;
  origin: Origin;
  createdAt: string;
  updatedAt: string;
}

export type NoteType = 'note' | 'variation';

/** A note or variation attached to a built-in or custom technique. */
export interface TechniqueNote {
  kind: 'note';
  id: string;
  techniqueId: string;
  type: NoteType;
  title: string;
  text: string;
  video: VideoRef | null;
  mediaIds: string[];
  author: string;
  origin: Origin;
  createdAt: string;
  updatedAt: string;
}

/** A photo or video file; the bytes are stored separately under the same id. */
export interface MediaItem {
  kind: 'media';
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export type TechniqueRecord = CustomTechnique | TechniqueNote | MediaItem;
