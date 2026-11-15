import { required } from "../../domain/assert";
import { indexById } from "../index";
import type { Ligament } from "../types";
import { LIGAMENT_GROUPS } from "./groups";
import { ANKLE_LIGAMENTS, TIBIOFIBULAR_LIGAMENTS } from "./lowerLimb/ankle";
import { FOREFOOT_LIGAMENTS, MIDFOOT_LIGAMENTS } from "./lowerLimb/foot";
import { HIP_LIGAMENTS } from "./lowerLimb/hip";
import { KNEE_LIGAMENTS } from "./lowerLimb/knee";
import { PELVIS_LIGAMENTS } from "./trunkPelvis/pelvis";
import {
  DISC_LIGAMENTS,
  RIB_LIGAMENTS,
  SPINE_LIGAMENTS,
} from "./trunkPelvis/spine";

export { LIGAMENT_GROUPS };

/** Every structure in the Ligaments tab, region by region and joint by joint (head to foot within a region). */
export const LIGAMENTS: Ligament[] = [
  ...SPINE_LIGAMENTS,
  ...DISC_LIGAMENTS,
  ...RIB_LIGAMENTS,
  ...PELVIS_LIGAMENTS,
  ...HIP_LIGAMENTS,
  ...KNEE_LIGAMENTS,
  ...TIBIOFIBULAR_LIGAMENTS,
  ...ANKLE_LIGAMENTS,
  ...MIDFOOT_LIGAMENTS,
  ...FOREFOOT_LIGAMENTS,
];

const ligamentById = indexById(LIGAMENTS, "ligament");

export const getLigament = (id: string): Ligament =>
  required(ligamentById.get(id), `Unknown ligament "${id}"`);
export const findLigament = (id: string): Ligament | undefined =>
  ligamentById.get(id);

/** The group a ligament is filed under, e.g. "Knee joint". */
export function ligamentGroup(ligament: Ligament) {
  return required(
    LIGAMENT_GROUPS[ligament.regionId].find((g) => g.id === ligament.groupId),
    `Unknown ligament group "${ligament.groupId}" in ${ligament.regionId}`,
  );
}
