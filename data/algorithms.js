/**
 * Vikkypaedia Medicine Basics (v9.3) — 10 Interactive Branching Clinical Decision Algorithms
 * One dedicated interactive bedside algorithm mapped to EACH of the 10 Units (Harrison's 22e)
 */

export const UNIT_ALGO_MAP = {
  0: 'bayesianDecision',
  1: 'screeningSafety',
  2: 'febrileSepsis',
  3: 'chestPain',
  4: 'hypoxemiaWorkup',
  5: 'coma',
  6: 'giBleedAscites',
  7: 'hyponatremia',
  8: 'akiCoag',
  9: 'pkDosing'
};

export const algorithms = {
  bayesianDecision: {
    id: "bayesianDecision",
    title: "Unit 1 · Bayesian Diagnostic & Test-Treatment Threshold Algorithm (Ch. 4 & 10)",
    startNode: "pretest",
    nodes: {
      pretest: {
        type: "decision",
        text: "Step 1: Estimate Pre-Test Probability from History & Focused Exam (Ch. 1 & 4)",
        options: [
          { text: "Very Low (<5% — Below Testing Threshold)", next: "low" },
          { text: "Intermediate (10–75% — Inside Testing Zone)", next: "mid" },
          { text: "Very High (>80% — Above Treatment Threshold)", next: "high" }
        ]
      },
      low: {
        type: "action",
        text: "DO NOT ORDER LOW-SPECIFICITY SCREENING TESTS [Ch. 4]\n• At <5% prevalence, even a 95%-specific test yields mostly FALSE POSITIVES.\n• Take a Diagnostic Time-Out (Ch. 10): ask 'What critical don't-miss diagnosis could still hide here?' and follow up clinically.",
        options: []
      },
      mid: {
        type: "decision",
        text: "Step 2: Select a High-Impact Test (LR+ >10 to Rule In; LR− <0.1 to Rule Out)",
        options: [
          { text: "High-Sensitivity Test Negative (LR− <0.1, e.g. D-dimer in low-mid risk)", next: "ruleout" },
          { text: "High-Specificity Test Positive (LR+ >10)", next: "rulein" }
        ]
      },
      ruleout: {
        type: "action",
        text: "SAFELY RULED OUT (SnNout) [Ch. 4]\n• Post-test Odds = Pre-test Odds × LR− drops below the Testing Threshold.\n• Avoid unnecessary radiation/invasive cascades and arrange clear return precautions.",
        options: []
      },
      rulein: {
        type: "action",
        text: "DIAGNOSIS ESTABLISHED (SpPin) -> INITIATE THERAPY [Ch. 4]\n• Post-test probability crosses the Treatment Threshold.\n• Ensure closed-loop documentation & review disconfirming findings if patient fails to respond.",
        options: []
      },
      high: {
        type: "action",
        text: "INITIATE EMPIRIC THERAPY IMMEDIATELY [Ch. 4]\n• Do NOT delay life-saving treatment waiting for confirmatory low-LR tests when pre-test probability already exceeds the treatment threshold.",
        options: []
      }
    }
  },

  screeningSafety: {
    id: "screeningSafety",
    title: "Unit 2 · Evidence-Based Screening & Patient Safety Audit (Ch. 6, 7 & 8)",
    startNode: "start",
    nodes: {
      start: {
        type: "decision",
        text: "Evaluating a Preventive Screening Test (Wilson-Jungner Criteria, Table 6-1):",
        options: [
          { text: "Does RCT data show reduced disease-specific MORTALITY (not just longer survival)?", next: "rct_yes" },
          { text: "Only observational 5-year survival looks longer (no mortality RCT)", next: "bias_trap" }
        ]
      },
      rct_yes: {
        type: "action",
        text: "VALIDATED SCREENING INTERVENTION [Ch. 6]\n• Calculate NNS = 1 / ARR and discuss net benefit vs false-positive/overdiagnosis harm using shared decision-making.\n• Anchor every visit with hypothesis-driven physical exam (avoid 'iPatient' syndrome, Ch. 8) and closed-loop tracking (Ch. 7).",
        options: []
      },
      bias_trap: {
        type: "action",
        text: "BEWARE LEAD-TIME, LENGTH-TIME & OVERDIAGNOSIS BIAS [Ch. 6]\n• Earlier diagnosis moves the clock backward without delaying death (Lead-Time Bias) and catches indolent tumors (Length-Time Bias).\n• Do NOT recommend unvalidated population screening tests.",
        options: []
      }
    }
  },

  febrileSepsis: {
    id: "febrileSepsis",
    title: "Unit 3 · Acute Fever, Petechial Rash & FUO Triage Algorithm (Ch. 20, 21 & 22)",
    startNode: "triage",
    nodes: {
      triage: {
        type: "decision",
        text: "Oral Temp >37.7°C (22e Ch. 20): First exclude Hyperthermia & Fulminant Emergencies!",
        options: [
          { text: "Temp >41°C + Heat exposure / Antipsychotics (NMS) / Anesthetics -> Hyperthermia!", next: "hyperthermia" },
          { text: "Non-blanching petechiae/purpura OR qSOFA >=2 (RR>=22, GCS<15, SBP<=100)", next: "sepsis_now" },
          { text: "Stable fever >=38.3°C persisting >=3 weeks without diagnosis -> Classic FUO", next: "fuo" }
        ]
      },
      hyperthermia: {
        type: "action",
        text: "HYPERTHERMIA EMERGENCY (Set-Point UNCHANGED) [Ch. 20]\n• Antipyretics DO NOT WORK! Begin immediate rapid physical cooling (ice-water/evaporative).\n• Give IV Dantrolene (Malignant Hyperthermia / NMS) or Benzodiazepines + Cyproheptadine (Serotonin Syndrome).",
        options: []
      },
      sepsis_now: {
        type: "action",
        text: "GOLDEN-HOUR SEPSIS / MENINGOCOCCEMIA BUNDLE [Ch. 21, Ref 32]\n• Draw 2 blood cultures + lactate -> Push IV Dexamethasone + Ceftriaxone 2g + Vancomycin IMMEDIATELY (add Doxycycline if RMSF/tick exposure).\n• NEVER delay antibiotics for Head CT or LP! Give 30 mL/kg crystalloids -> Norepinephrine if MAP <65 mmHg.",
        options: []
      },
      fuo: {
        type: "action",
        text: "CLASSIC FUO STRUCTURED WORKUP [Ch. 22]\n• Complete structured minimal baseline labs + stop non-essential drugs (rule out drug fever).\n• Search for Potentially Diagnostic Clues (PDCs) across Infections, NIID (GCA/Still's), & Malignancy.\n• If no PDCs -> Order 18F-FDG-PET/CT! Avoid blind steroids/antibiotics in stable FUO.",
        options: []
      }
    }
  },

  chestPain: {
    id: "chestPain",
    title: "Unit 4 · Acute Chest Discomfort — 10-Minute Lethal Exclusion (Ch. 15)",
    startNode: "triage",
    nodes: {
      triage: {
        type: "action",
        text: "Immediate Bedside Triage (0–10 min):\n• Assess ABCs, vitals in BOTH arms, SpO2, IV access\n• Obtain & interpret 12-lead ECG within 10 minutes\n• Draw high-sensitivity cardiac troponin (hs-cTn), CBC, BMP",
        options: [
          { text: "ST-elevation or new LBBB / posterior STEMI on ECG", next: "stemi" },
          { text: "Abrupt tearing pain to back / >20 mmHg arm BP diff / new AR murmur", next: "dissection" },
          { text: "Non-diagnostic ECG — check hemodynamics & serial hs-cTn", next: "nonstemi_eval" }
        ]
      },
      stemi: {
        type: "action",
        text: "ST-ELEVATION MYOCARDIAL INFARCTION (STEMI) [Ch. 15]\n• Activate Cath Lab IMMEDIATELY (Door-to-Balloon <90 min) or Fibrinolysis if PCI >120 min away.\n• Aspirin 162–325 mg chewed + P2Y12 inhibitor + Anticoagulation (ONLY after checking arm BP symmetry!).",
        options: []
      },
      dissection: {
        type: "action",
        text: "SUSPECTED ACUTE AORTIC SYNDROME / DISSECTION [Ch. 15]\n• STOP anticoagulants & thrombolytics immediately!\n• IV Beta-Blocker FIRST (Esmolol or Labetalol) -> target HR <60 bpm, then SBP 100–120 mmHg.\n• Emergent CTA Chest/Abdomen (or bedside TEE) + Stat Cardiothoracic Surgery!",
        options: []
      },
      nonstemi_eval: {
        type: "decision",
        text: "Hemodynamically Unstable (SBP <90, SpO2 <90%, high JVP, unilateral silent lung)?",
        options: [
          { text: "YES — Unilateral absent breath sounds + shock", next: "ptx" },
          { text: "YES — Beck's triad / Pulsus paradoxus >12 OR acute RV strain (PE)", next: "pe_tamponade" },
          { text: "NO — Stable; run 0/1h or 0/2h hs-cTn + HEART / Wells score", next: "serial" }
        ]
      },
      ptx: {
        type: "action",
        text: "TENSION PNEUMOTHORAX [Ch. 15]\n• Do NOT wait for CXR! Immediate needle decompression followed by tube thoracostomy.",
        options: []
      },
      pe_tamponade: {
        type: "action",
        text: "CARDIAC TAMPONADE vs MASSIVE PE [Ch. 15]\n• Bedside POCUS immediately: pericardial effusion + RV collapse -> Emergent pericardiocentesis.\n• Acute RV dilation / DVT -> Anticoagulation & CTA-PE / thrombolysis evaluation.",
        options: []
      },
      serial: {
        type: "action",
        text: "STRUCTURED PATHWAY [Ch. 15, Ref 31]\n• Dynamic hs-cTn rise/fall -> NSTE-ACS protocol.\n• Diffuse PR depression + ST elevation relieved leaning forward -> Pericarditis.\n• Forceful emesis + subcutaneous air -> Boerhaave esophageal rupture (NPO + IV Abx + Surgery).",
        options: []
      }
    }
  },

  hypoxemiaWorkup: {
    id: "hypoxemiaWorkup",
    title: "Unit 5 · Hypoxemia (A–a Gradient), Cyanosis & Edema Algorithm (Ch. 39, 42 & 43)",
    startNode: "aa_step",
    nodes: {
      aa_step: {
        type: "decision",
        text: "Step 1: Calculate Alveolar–Arterial (A–a) O2 Gradient [Normal <= (Age/4) + 4 mmHg]",
        options: [
          { text: "NORMAL A–a Gradient + Elevated PaCO2 (>45 mmHg)", next: "hypovent" },
          { text: "ELEVATED A–a Gradient — Test response to 100% FiO2", next: "elevated_aa" },
          { text: "Normal PaO2 with SpO2 stuck ~85% (chocolate blood) OR normal SpO2 after smoke exposure", next: "dyshb" }
        ]
      },
      hypovent: {
        type: "action",
        text: "PURE ALVEOLAR HYPOVENTILATION [Ch. 42]\n• Look for CNS depression (opioids -> Naloxone!), neuromuscular weakness (myasthenia/GBS), or chest wall restriction.\n• Support ventilation (NIV / intubation) rather than oxygen alone.",
        options: []
      },
      elevated_aa: {
        type: "decision",
        text: "Step 2: Does PaO2 / SpO2 improve significantly with supplemental 100% O2?",
        options: [
          { text: "YES — Corrects readily with O2", next: "vq" },
          { text: "NO — Refractory to 100% FiO2!", next: "shunt" }
        ]
      },
      vq: {
        type: "action",
        text: "V/Q MISMATCH (Most Common) or DIFFUSION IMPAIRMENT [Ch. 42]\n• Evaluate for COPD/asthma exacerbation, Pulmonary Embolism, Pneumonia, CHF, or Interstitial Lung Disease.",
        options: []
      },
      shunt: {
        type: "action",
        text: "RIGHT-TO-LEFT SHUNT [Ch. 42]\n• Intrapulmonary (ARDS, dense consolidation/atelectasis, hepatopulmonary AVM -> platypnea-orthodeoxia) or Intracardiac R->L shunt.\n• Treat underlying alveolar collapse (PEEP/recruitment) or vascular shunt.",
        options: []
      },
      dyshb: {
        type: "action",
        text: "DYSHEMOGLOBINEMIA (MetHb vs CO Poisoning) [Ch. 42]\n• Methemoglobinemia (benzocaine/dapsone): SpO2 fixed ~85%, high PaO2, chocolate blood -> IV Methylene Blue!\n• CO poisoning: Order arterial CO-oximetry immediately -> 100% O2 / Hyperbaric O2.",
        options: []
      }
    }
  },

  coma: {
    id: "coma",
    title: "Unit 6 · Emergency Coma Stabilization & Brainstem Localization (Ch. 30)",
    startNode: "abc",
    nodes: {
      abc: {
        type: "action",
        text: "FIRST 5 MINUTES — STABILIZE & REVERSE [Ch. 30]\n• Airway (intubate if GCS <=8; C-spine protection if trauma)\n• Stat Glucose -> IV Thiamine 100 mg BEFORE/WITH 25 g IV Dextrose\n• IV Naloxone if pinpoint pupils / respiratory depression (RR <12)",
        options: [
          { text: "Unilateral dilated fixed pupil or focal motor deficit", next: "structural" },
          { text: "Symmetric reactive pupils, intact brainstem reflexes", next: "metabolic" },
          { text: "Fever, nuchal rigidity, or petechial rash", next: "meningitis" }
        ]
      },
      structural: {
        type: "action",
        text: "STRUCTURAL LESION / UNCAL HERNIATION (CN III) [Ch. 30]\n• Elevate HOB 30°, hyperosmolar therapy (IV Mannitol or 3% NaCl), emergent Non-Contrast Head CT, Neurosurgery STAT.",
        options: []
      },
      metabolic: {
        type: "action",
        text: "TOXIC-METABOLIC / BIHEMISPHERIC COMA [Ch. 30]\n• Preserved pupillary reflexes strongly favor metabolic/toxic etiology.\n• Check ABG (hypercapnia), Na+, Ca2+, ammonia, hepatic/renal panel, tox screen, and EEG (non-convulsive status).",
        options: []
      },
      meningitis: {
        type: "action",
        text: "CNS INFECTION EMERGENCY [Ch. 21, 30]\n• Blood cultures -> IV Dexamethasone + Ceftriaxone + Vancomycin (+ Acyclovir) IMMEDIATELY before CT/LP!",
        options: []
      }
    }
  },

  giBleedAscites: {
    id: "giBleedAscites",
    title: "Unit 7 · Acute GI Bleeding & Ascites SAAG/SBP Algorithm (Ch. 51 & 53)",
    startNode: "branch",
    nodes: {
      branch: {
        type: "decision",
        text: "Select Bedside GI Emergency Pathway:",
        options: [
          { text: "Acute Upper GI Bleeding (Hematemesis / Melena)", next: "ugib" },
          { text: "New or Hospitalized Ascites (Diagnostic Paracentesis)", next: "ascites" }
        ]
      },
      ugib: {
        type: "action",
        text: "ACUTE UGIB RESUSCITATION BUNDLE [Ch. 51]\n• 2 large-bore IVs + crystalloids (remember: early Hb is falsely normal!).\n• Restrictive PRBC transfusion threshold: Hb <7 g/dL (target 7–9).\n• IV PPI; if cirrhosis suspected -> add IV Octreotide + IV Ceftriaxone immediately -> EGD within 12–24h.",
        options: []
      },
      ascites: {
        type: "decision",
        text: "Check Ascitic Fluid PMN Count & SAAG (Serum Alb − Ascitic Alb):",
        options: [
          { text: "Ascitic PMN >= 250 cells/uL -> SBP Emergency!", next: "sbp" },
          { text: "PMN <250 & SAAG >=1.1 g/dL (Portal Hypertension)", next: "high_saag" },
          { text: "PMN <250 & SAAG <1.1 g/dL (Non-Portal)", next: "low_saag" }
        ]
      },
      sbp: {
        type: "action",
        text: "SPONTANEOUS BACTERIAL PERITONITIS (SBP) [Ch. 53]\n• Do NOT wait for culture! Start IV Ceftriaxone 2g daily NOW + IV Albumin (1.5 g/kg Day 1, 1.0 g/kg Day 3).",
        options: []
      },
      high_saag: {
        type: "action",
        text: "PORTAL HYPERTENSIVE ASCITES (SAAG >=1.1) [Ch. 53]\n• Ascitic Total Protein <2.5 g/dL -> Cirrhosis.\n• Ascitic Total Protein >=2.5 g/dL -> Cardiac Ascites (CHF / Constrictive Pericarditis).",
        options: []
      },
      low_saag: {
        type: "action",
        text: "NON-PORTAL ASCITES (SAAG <1.1) [Ch. 53]\n• Evaluate for Peritoneal Carcinomatosis (cytology), Tuberculous Peritonitis (ADA/AFB), Pancreatitis (amylase), or Nephrotic Syndrome.",
        options: []
      }
    }
  },

  hyponatremia: {
    id: "hyponatremia",
    title: "Unit 8 · Stepwise Hyponatremia & 4-Step Acid-Base Algorithm (Ch. 56 & 58)",
    startNode: "symptoms",
    nodes: {
      symptoms: {
        type: "decision",
        text: "Step 1: Severe CNS symptoms (seizures, coma) OR Acid-Base ABG evaluation?",
        options: [
          { text: "Hyponatremic Seizures / Coma -> Emergency!", next: "hypertonic" },
          { text: "Stable Hyponatremia -> Serum & Urine Osmolality Workup", next: "osmolality" },
          { text: "Switch to 4-Step Metabolic Acidosis (Winter's + Corrected AG)", next: "met_acid" }
        ]
      },
      hypertonic: {
        type: "action",
        text: "EMERGENT 3% HYPERTONIC SALINE [Ch. 56]\n• 100 mL IV 3% NaCl over 10 min (repeat x2 if needed) -> bump Na+ by 4–6 mEq/L.\n• STRICT ODS CEILING: Never exceed 8–10 mEq/L in 24h (4–6 mEq/L if high risk); use DDAVP + D5W if overcorrecting!",
        options: []
      },
      osmolality: {
        type: "action",
        text: "HYPONATREMIA WORKUP [Ch. 56]\n1. Correct Na+ for glucose (+1.6 to 2.4 per 100 mg/dL >100).\n2. Hypotonic (<275) + UOsm <100 -> Polydipsia / Beer potomania (high aquaresis risk!).\n3. UOsm >=100 -> Assess ECF volume: Hypovolemic (0.9% NaCl), Euvolemic/SIADH (fluid restriction — beware 0.9% NaCl desalination!), Hypervolemic (diuresis/fluid restriction).",
        options: []
      },
      met_acid: {
        type: "action",
        text: "4-STEP METABOLIC ACIDOSIS WORKUP [Ch. 58]\n1. Winter's Formula: Expected PaCO2 = (1.5 × HCO3-) + 8 ± 2.\n2. Albumin-Corrected AG = [Na − (Cl + HCO3)] + 2.5 × (4.0 − Albumin).\n3. High AG (>12) = GOLDMARK; Normal AG = Diarrhea / RTA / Saline.\n4. Delta-Delta (ΔAG / ΔHCO3): <1 = +NAGMA; >2 = +Metabolic Alkalosis.",
        options: []
      }
    }
  },

  akiCoag: {
    id: "akiCoag",
    title: "Unit 9 · AKI (Azotemia), Anemia & Coagulopathy Mixing Study (Ch. 55, 66 & 69)",
    startNode: "pick",
    nodes: {
      pick: {
        type: "decision",
        text: "Choose Bedside Renal / Hematology Algorithm:",
        options: [
          { text: "Acute Kidney Injury (Cr >=0.3 rise / oliguria)", next: "aki" },
          { text: "Anemia Kinetic & MCV Branching", next: "anemia" },
          { text: "Prolonged aPTT / PT Coagulopathy Mixing Study", next: "coag" }
        ]
      },
      aki: {
        type: "action",
        text: "STEPWISE AKI EVALUATION [Ch. 55]\n1. Postrenal FIRST: Bedside bladder scan / Foley decompression!\n2. Prerenal: BUN:Cr >20:1, FENa <1% (FEUrea <35% on diuretics), hyaline casts -> Volume + stop NSAIDs/ACEi.\n3. Intrinsic: Muddy brown casts (ATN), RBC casts (GN), WBC casts (AIN).",
        options: []
      },
      anemia: {
        type: "action",
        text: "ANEMIA RPI + MCV WORKUP [Ch. 66]\n• RPI >=2.5 -> Hemolysis (high LDH/iBili, low haptoglobin -> DAT/smear) or acute hemorrhage.\n• RPI <2 + MCV <80 -> Low ferritin = IDA; High ferritin/low TIBC = ACD; High RBC = Thalassemia.\n• RPI <2 + MCV >100 -> Check B12 & MMA (NEVER give folate alone in B12 deficiency!).",
        options: []
      },
      coag: {
        type: "action",
        text: "1:1 MIXING STUDY & DIC vs TTP [Ch. 69]\n• Normalizes with 1:1 normal plasma -> Factor Deficiency (Hemophilia / Vit K).\n• FAILS to normalize -> Circulating Inhibitor (Lupus Anticoagulant [thrombosis] or Anti-VIII [bleed]).\n• Low Plt + High PT/aPTT + Low Fibrinogen = DIC (vs Normal PT/aPTT in TTP -> Plasma Exchange!).",
        options: []
      }
    }
  },

  pkDosing: {
    id: "pkDosing",
    title: "Unit 10 · Safe Renal Prescribing, Capacity & SPIKES Protocol (Ch. 71, 12 & 13)",
    startNode: "start",
    nodes: {
      start: {
        type: "decision",
        text: "Select Pharmacology or Clinical Ethics Pathway:",
        options: [
          { text: "Dosing Drugs in Renal / Hepatic Impairment (Ch. 71)", next: "pk" },
          { text: "Assessing Decision-Making Capacity & Surrogates (Ch. 12)", next: "ethics" },
          { text: "Delivering Serious News — SPIKES Protocol (Ch. 13)", next: "spikes" }
        ]
      },
      pk: {
        type: "action",
        text: "HARRISON'S PK DOSING LAW [Ch. 71]\n• Loading Dose = (Vd × Ctarget)/F -> Give FULL Loading Dose in CKD!\n• Maintenance Dose = (CL × Css × τ)/F -> REDUCE dose or EXTEND interval based on Cockcroft-Gault CrCl.\n• Check CYP450 inducers/inhibitors & watch zero-order drugs (Phenytoin, Ethanol, Aspirin).",
        options: []
      },
      ethics: {
        type: "action",
        text: "CAPACITY & SURROGATE HIERARCHY [Ch. 12]\n• Verify 4 clinical criteria: Understanding, Appreciation, Reasoning, Communicating a choice.\n• Capacitated refusal MUST be honored. If lacking capacity: 1. Advance Directive -> 2. Substituted Judgment -> 3. Best Interests.",
        options: []
      },
      spikes: {
        type: "action",
        text: "SPIKES SERIOUS NEWS PROTOCOL [Ch. 13]\n• Setting (private, seated) -> Perception ('What have you been told?') -> Invitation -> Knowledge (clear, jargon-free) -> Emotions (empathy) -> Strategy & Summary.\n• Integrate Palliative Care early alongside curative treatment!",
        options: []
      }
    }
  }
};
