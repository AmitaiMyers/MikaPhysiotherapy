import type { Source } from '../types';

/**
 * References used to cross-check the data. Each muscle lists the ones its entries were checked
 * against. The method is described on the About screen.
 */
export const SOURCES: Source[] = [
  {
    id: 'teachmeanatomy',
    citation: 'TeachMeAnatomy — Upper limb muscles (origin, insertion, innervation, actions, clinical relevance).',
    url: 'https://teachmeanatomy.info/upper-limb/muscles/',
  },
  {
    id: 'kenhub',
    citation: 'Kenhub — Muscle library (attachments, innervation with root values, blood supply, function).',
    url: 'https://www.kenhub.com/en/library/anatomy',
  },
  {
    id: 'wikipedia',
    citation: 'Wikipedia — muscle articles (infobox values; anatomy sections derive from Gray’s Anatomy, 20th US edition, 1918, public domain).',
    url: 'https://en.wikipedia.org/wiki/List_of_skeletal_muscles_of_the_human_body',
  },
  {
    id: 'radiopaedia',
    citation: 'Radiopaedia — muscle and tendon articles (attachments, variants, imaging-relevant relations).',
    url: 'https://radiopaedia.org/',
  },
  {
    id: 'physiopedia',
    citation: 'Physiopedia — muscle, special test and condition pages (clinical relevance, assessment, rehabilitation).',
    url: 'https://www.physio-pedia.com/',
  },
  {
    id: 'aaos-rom',
    citation: 'American Academy of Orthopaedic Surgeons normal joint motion values (Greene & Heckman, The Clinical Measurement of Joint Motion, AAOS 1994), as reproduced in published ROM tables.',
  },
  {
    id: 'z-anatomy',
    citation: '3D model and images: Z-Anatomy — the open source atlas of anatomy (CC BY-SA 4.0), derived from BodyParts3D, © The Database Center for Life Science (CC BY-SA 2.1 JP).',
    url: 'https://www.z-anatomy.com/',
  },
];
