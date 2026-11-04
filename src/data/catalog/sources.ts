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
  // ---------- Rehabilitation protocols: lower extremity ----------
  {
    id: 'nice-cg124',
    citation: 'National Institute for Health and Care Excellence. Hip fracture: management (CG124), 2011, with later updates.',
    url: 'https://www.nice.org.uk/guidance/cg124',
  },
  {
    id: 'mcdonough-2021',
    citation: 'McDonough CM et al. Physical therapy management of older adults with hip fracture. J Orthop Sports Phys Ther 2021;51(2):CPG1–81.',
    url: 'https://www.jospt.org/doi/10.2519/jospt.2021.0301',
  },
  {
    id: 'ffn-weight-bearing-2025',
    citation: 'Fragility Fracture Network position on unrestricted weight-bearing after hip fracture surgery (2025).',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12217561/',
  },
  {
    id: 'femoral-nail-rehab-2009',
    citation: 'Review: Is there a standard rehabilitation protocol after femoral intramedullary nailing? (2009).',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19390375/',
  },
  {
    id: 'tibial-nail-weight-bearing-2022',
    citation: 'Outcomes of early versus delayed weight-bearing with intramedullary nailing of tibial shaft fractures: a systematic review and meta-analysis (2022).',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9532312/',
  },
  {
    id: 'tibial-plateau-weight-bearing-2025',
    citation: 'Early versus delayed weight-bearing following tibial plateau fracture surgery: a systematic review and meta-analysis (2025).',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12638072/',
  },
  {
    id: 'patella-orif-protocol',
    citation: 'Gundersen Health System Sports Medicine. Patella fracture ORIF rehabilitation program (2022).',
    url: 'https://www.gundersenhealth.org/sites/default/files/2022-06/Sports-Medicine-Protocol-Patella-Fracture-ORIF.pdf',
  },
  {
    id: 'wax-2024',
    citation: 'Bretherton CP et al. Early versus delayed weight-bearing following operatively treated ankle fracture (WAX): a non-inferiority, multicentre, randomised controlled trial. Lancet 2024;403(10446):2787–97.',
    url: 'https://evidence.nihr.ac.uk/alert/walking-just-2-weeks-after-ankle-surgery-is-safe-for-many',
  },
  {
    id: 'kortekangas-2019',
    citation: 'Kortekangas T et al. Three week versus six week immobilisation for stable Weber B type ankle fractures: randomised, multicentre, non-inferiority clinical trial. BMJ 2019;364:k5432.',
    url: 'https://doi.org/10.1136/bmj.k5432',
  },
  {
    id: 'heft-2014',
    citation: 'Griffin D et al. Operative versus non-operative treatment for closed, displaced, intra-articular fractures of the calcaneus (UK HeFT): randomised controlled trial. BMJ 2014;349:g4483.',
    url: 'https://wrap.warwick.ac.uk/id/eprint/63523/',
  },
  {
    id: 'fifth-metatarsal-2022',
    citation: 'Fifth metatarsal fractures: an update on management, complications, and outcomes. EFORT Open Rev 2022;7(1).',
    url: 'https://eor.bioscientifica.com/view/journals/eor/7/1/EOR-21-0025.xml',
  },
  {
    id: 'hip-precautions-2020',
    citation: 'Do hip precautions after posterior-approach total hip arthroplasty affect dislocation rates? A systematic review of 7 studies with 6,900 patients. Acta Orthop 2020.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32718213/',
  },
  {
    id: 'mgh-hip-arthroscopy',
    citation: 'Massachusetts General Hospital Sports Medicine. Rehabilitation protocol for hip arthroscopy for femoroacetabular impingement.',
    url: 'https://www.massgeneral.org/assets/MGH/pdf/orthopaedics/sports-medicine/physical-therapy/rehabilitation-protocol-for-hip-labral-postop.pdf',
  },
  {
    id: 'jette-2020',
    citation: 'Jette DU et al. Physical therapist management of total knee arthroplasty. Phys Ther 2020;100(9):1603–31.',
    url: 'https://academic.oup.com/ptj/article/100/9/1603/5857258',
  },
  {
    id: 'apta-tka-2026',
    citation: 'Clinical practice guideline for physical therapist management of total knee arthroplasty: revision 2026. Phys Ther 2026;106(7):pzag058.',
    url: 'https://academic.oup.com/ptj/article/106/7/pzag058/8742282',
  },
  {
    id: 'aspetar-aclr-2023',
    citation: 'Kotsifaki R et al. Aspetar clinical practice guideline on rehabilitation after anterior cruciate ligament reconstruction. Br J Sports Med 2023;57(9):500–14.',
    url: 'https://bjsm.bmj.com/content/57/9/500',
  },
  {
    id: 'moon-aclr-2015',
    citation: 'Wright RW, Haas AK et al. Anterior cruciate ligament reconstruction rehabilitation: MOON guidelines. Sports Health 2015;7(3):239–43.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4482298/',
  },
  {
    id: 'grindem-2016',
    citation: 'Grindem H et al. Simple decision rules can reduce reinjury risk by 84% after ACL reconstruction: the Delaware-Oslo ACL cohort study. Br J Sports Med 2016;50(13):804–8.',
    url: 'https://bjsm.bmj.com/content/50/13/804',
  },
  {
    id: 'meniscus-consensus-2024',
    citation: 'Pujol N et al. The formal EU-US Meniscus Rehabilitation 2024 Consensus: an ESSKA-AOSSM-AASPT initiative. Part I — rehabilitation management after meniscus surgery. Knee Surg Sports Traumatol Arthrosc 2025.',
    url: 'https://esskajournals.onlinelibrary.wiley.com/doi/10.1002/ksa.12674',
  },
  {
    id: 'mpfl-protocols',
    citation: 'Institutional MPFL reconstruction protocols, e.g. Banff Sport Medicine (2019), Sanford Health and Children’s Hospital of Philadelphia.',
    url: 'https://banffsportmed.ca/wp-content/uploads/2019/09/MPFL-Post-Operative-Sept-2019-FINAL.pdf',
  },
  {
    id: 'achilles-rehab-2022',
    citation: 'Rehabilitation following operative treatment of acute Achilles tendon ruptures: a systematic review and meta-analysis. EFORT Open Rev 2022;7(10).',
    url: 'https://eor.bioscientifica.com/view/journals/eor/7/10/EOR-22-0072.xml',
  },
  {
    id: 'ukstar-2020',
    citation: 'Costa ML et al. Plaster cast versus functional brace for non-surgical treatment of Achilles tendon rupture (UKSTAR): a multicentre randomised controlled trial and economic evaluation. Lancet 2020;395:441–8.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32035553/',
  },
  {
    id: 'mgh-brostrom',
    citation: 'Massachusetts General Hospital Sports Medicine. Rehabilitation protocol for Broström lateral ankle ligament repair.',
    url: 'https://www.massgeneral.org/assets/MGH/pdf/orthopaedics/sports-medicine/physical-therapy/rehabilitation-protocol-for-brostrom-repair.pdf',
  },
  {
    id: 'mgh-hallux-valgus',
    citation: 'Massachusetts General Hospital Foot & Ankle. Physical therapy guidelines for hallux valgus correction.',
    url: 'https://www.massgeneral.org/assets/MGH/pdf/orthopaedics/foot-ankle/PT-guidelines-hallux-valgus-correction-final.pdf',
  },
  // ---------- Rehabilitation protocols: upper extremity and spine ----------
  {
    id: 'cuff-mobilisation-2023',
    citation: 'Early versus delayed mobilization for arthroscopic rotator cuff repair (small to large sized tear): a meta-analysis of randomized controlled trials. BMC Musculoskelet Disord 2023.',
    url: 'https://bmcmusculoskeletdisord.biomedcentral.com/articles/10.1186/s12891-023-07075-5',
  },
  {
    id: 'instability-rts-2023',
    citation: 'Majority of studies show similar rates of return to play after arthroscopic Bankart repair or Latarjet procedure: a systematic review. Arthroscopy 2023.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37146663/',
  },
  {
    id: 'tsa-protocol-bwh',
    citation: 'Brigham and Women’s Faulkner Hospital Rehabilitation Services. Total shoulder arthroplasty guideline.',
    url: 'https://www.brighamandwomensfaulkner.org/assets/BWH/patients-and-families/rehabilitation-services/pdfs/total-shoulder-arthroplasty-guideline.pdf',
  },
  {
    id: 'rtsa-sling-2023',
    citation: 'No difference in complications between two-week vs. six-week duration of sling immobilization after reverse total shoulder arthroplasty (2023).',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10638591/',
  },
  {
    id: 'profher-2015',
    citation: 'Rangan A et al. Surgical vs nonsurgical treatment of adults with displaced fractures of the proximal humerus: the PROFHER randomized clinical trial. JAMA 2015;313(10):1037–47.',
    url: 'https://www.openhealthgroup.com/publication-library/surgical-vs-nonsurgical-treatment-of-adults-with-displaced-fractures-of-the-proximal-humerus-the-profher-randomized-clinical-trial/',
  },
  {
    id: 'phf-mobilisation-2025',
    citation: 'Early versus delayed mobilisation for non-surgically treated proximal humerus fractures: a systematic review and meta-analysis of randomised trials. BMC Musculoskelet Disord 2025.',
    url: 'https://link.springer.com/article/10.1186/s12891-025-08371-y',
  },
  {
    id: 'fish-2020',
    citation: 'Rämö L et al. Effect of surgery vs functional bracing on functional outcome among patients with closed displaced humeral shaft fractures: the FISH randomized clinical trial. JAMA 2020.',
    url: 'https://jamanetwork.com/journals/jama/fullarticle/2765728',
  },
  {
    id: 'olecranon-protocol',
    citation: 'Rothman Orthopaedics. ORIF olecranon physical therapy protocol.',
    url: 'https://www.rothmanortho.com/wp-content/uploads/files/post-op-protocols/brandon-j-erickson-md/ORIF%20Olecranon%20PT%20Protocol.pdf',
  },
  {
    id: 'radial-head-review-2017',
    citation: 'Radial head fractures: a review. Open Orthop J 2017;11:1405.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5721345/',
  },
  {
    id: 'distal-radius-elderly-2024',
    citation: 'A meta-analysis comparing volar locking plates and cast immobilization for distal radius fractures in the elderly. J Orthop Surg Res 2024.',
    url: 'https://link.springer.com/article/10.1186/s13018-024-05216-7',
  },
  {
    id: 'drafft-2014',
    citation: 'Costa ML et al. UK DRAFFT: a randomised controlled trial of percutaneous fixation with Kirschner wires versus volar locking-plate fixation in the treatment of adult patients with a dorsally displaced fracture of the distal radius. Health Technol Assess 2015.',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK276570/',
  },
  {
    id: 'swifft-2020',
    citation: 'Dias JJ et al. Surgery versus cast immobilisation for adults with a bicortical fracture of the scaphoid waist (SWIFFT): a pragmatic, multicentre, open-label, randomised superiority trial. Lancet 2020.',
    url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)30931-4/abstract',
  },
  {
    id: 'boxer-fracture-2022',
    citation: 'A systematic review and meta-analysis of the efficacy of buddy taping versus reduction and casting for non-operative management of closed fifth metacarpal neck fractures (2022).',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9512295/',
  },
  {
    id: 'biceps-protocol-bwh',
    citation: 'Brigham and Women’s Hospital. Distal biceps tendon repair rehabilitation protocol.',
    url: 'https://www.brighamandwomens.org/assets/BWH/patients-and-families/pdfs/elbow---distal-biceps-repair-protocol.pdf',
  },
  {
    id: 'ucl-protocol',
    citation: 'Rothman Orthopaedics. UCL reconstruction (Tommy John) physical therapy protocol.',
    url: 'https://www.rothmanortho.com/files/post-op-protocols/brandon-j-erickson-md/UCL%20Reconstruction%20(Tommy%20John)%20PT%20Protocol.pdf',
  },
  {
    id: 'flexor-tendon-2024',
    citation: 'Maximizing hand function following zone II flexor tendon repair: a systematic review and meta-analysis of rehabilitation strategies (2024).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11632816/',
  },
  {
    id: 'aaos-cts-2024',
    citation: 'American Academy of Orthopaedic Surgeons. Management of carpal tunnel syndrome: evidence-based clinical practice guideline (2024).',
    url: 'https://www.aaos.org/cts2cpg',
  },
  {
    id: 'nogg-vertebral-fracture',
    citation: 'National Osteoporosis Guideline Group (UK). Clinical guideline, section 8: management of symptomatic osteoporotic vertebral fractures.',
    url: 'https://www.nogg.org.uk/full-guideline/section-8-management-symptomatic-osteoporotic-vertebral-fractures',
  },
  {
    id: 'cochrane-discectomy-2014',
    citation: 'Oosterhuis T et al. Rehabilitation after lumbar disc surgery. Cochrane Database Syst Rev 2014;CD003007.',
    url: 'https://www.cochrane.org/CD003007/BACK_rehabilitation-after-surgery-for-herniation-of-the-lumbar-disc',
  },
  {
    id: 'eras-fusion-2021',
    citation: 'Consensus statement for perioperative care in lumbar spinal fusion: Enhanced Recovery After Surgery (ERAS®) Society recommendations. Spine J 2021.',
    url: 'https://www.thespinejournalonline.com/article/S1529-9430(21)00002-4/fulltext',
  },
  {
    id: 'acdf-restrictions-2020',
    citation: 'Postoperative restrictions after anterior cervical discectomy and fusion (survey of surgeons, 2020).',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7466012/',
  },
];
