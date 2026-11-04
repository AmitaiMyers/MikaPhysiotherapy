import type { Source } from '../types';

/**
 * References used to cross-check the data. Each muscle lists the ones its entries were checked
 * against. The method is described on the About screen.
 */
export const SOURCES: Source[] = [
  {
    id: 'teachmeanatomy',
    citation: 'TeachMeAnatomy — muscles by region (origin, insertion, innervation, actions, clinical relevance).',
    url: 'https://teachmeanatomy.info/',
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
  {
    id: 'acsm-2009',
    citation: 'American College of Sports Medicine. Position stand: Progression models in resistance training for healthy adults. Med Sci Sports Exerc 2009;41(3):687–708.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/',
  },
  {
    id: 'reinold-2004',
    citation: 'Reinold MM et al. Electromyographic analysis of the rotator cuff and deltoid musculature during common shoulder external rotation exercises. J Orthop Sports Phys Ther 2004;34(7):385–94.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15296366/',
  },
  {
    id: 'distefano-2009',
    citation: 'Distefano LJ et al. Gluteal muscle activation during common therapeutic exercises. J Orthop Sports Phys Ther 2009;39(7):532–40.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3201064',
  },
  {
    id: 'tyler-2010',
    citation: 'Tyler TF et al. Addition of isolated wrist extensor eccentric exercise to standard treatment for chronic lateral epicondylosis: a prospective randomized trial. J Shoulder Elbow Surg 2010;19(6):917–22.',
    url: 'https://doi.org/10.1016/j.jse.2010.04.041',
  },
  {
    id: 'van-dyk-2019',
    citation: 'van Dyk N et al. Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: a systematic review and meta-analysis of 8459 athletes. Br J Sports Med 2019;53(21):1362–70.',
    url: 'https://bjsm.bmj.com/content/53/21/1362',
  },
  {
    id: 'askling-2013',
    citation: 'Askling CM et al. Acute hamstring injuries in Swedish elite football: a prospective randomised controlled clinical trial comparing two rehabilitation protocols. Br J Sports Med 2013;47(15):953–9.',
    url: 'https://bjsm.bmj.com/content/47/15/953',
  },
  {
    id: 'haroy-2019',
    citation: 'Harøy J et al. The Adductor Strengthening Programme prevents groin problems among male football players: a cluster-randomised controlled trial. Br J Sports Med 2019;53(3):150–7.',
    url: 'https://bjsm.bmj.com/content/53/3/150',
  },
  {
    id: 'alfredson-1998',
    citation: 'Alfredson H et al. Heavy-load eccentric calf muscle training for the treatment of chronic Achilles tendinosis. Am J Sports Med 1998;26(3):360–6. (Protocol as summarised in later systematic reviews.)',
  },
  {
    id: 'kongsgaard-2009',
    citation: 'Kongsgaard M et al. Corticosteroid injections, eccentric decline squat training and heavy slow resistance training in patellar tendinopathy. Scand J Med Sci Sports 2009;19(6):790–802.',
    url: 'https://research.regionh.dk/en/publications/corticosteroid-injections-eccentric-decline-squat-training-and-he/',
  },
  {
    id: 'dumoulin-2018',
    citation: 'Dumoulin C, Cacciari LP, Hay-Smith EJC. Pelvic floor muscle training versus no treatment, or inactive control treatments, for urinary incontinence in women. Cochrane Database Syst Rev 2018;10:CD005654.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30288727/',
  },
  {
    id: 'nice-ng123',
    citation: 'National Institute for Health and Care Excellence. Urinary incontinence and pelvic organ prolapse in women: management (NG123), 2019.',
    url: 'https://www.nice.org.uk/guidance/ng123',
  },
  {
    id: 'fifa-11plus',
    citation: 'Sadigursky D et al. The FIFA 11+ injury prevention program for soccer players: a systematic review. BMC Sports Sci Med Rehabil 2017;9:18.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5704377/',
  },
];
