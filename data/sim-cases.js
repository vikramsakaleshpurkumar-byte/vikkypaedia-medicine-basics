/**
 * Vikkypaedia Medicine Basics (Harrison's 22nd Edition)
 * 3 Unfolding Branching Internal Medicine ER & Ward Simulations
 */

export const simCases = {
  aortic_dissection_trap: {
    id: "aortic_dissection_trap",
    badge: "CASE 1 · CHEST PAIN EMERGENCY",
    patient: {
      name: "Mr. Rajesh Kulkarni",
      age: "62 years",
      weight: "78 kg",
      avatar: "🫀",
      setting: "Emergency Department · Resuscitation Bay 1"
    },
    intro: "A 62-year-old man with poorly controlled hypertension arrives clutching his chest after sudden-onset 'ripping' substernal pain radiating straight between his scapulae 35 minutes ago. He is diaphoretic and mildly nauseated. EMS gave aspirin en route and flags 'Possible Inferior STEMI' after seeing 1.5 mm ST elevation in leads II, III, and aVF.",
    citations: [11, 6, 31],
    nodes: {
      start: {
        stage: "Stage 1 of 3 · 10-Minute Lethal Exclusion (Ch. 15)",
        vitals: { hr: "112", bp: "194/108 (R) | 156/86 (L)", pp: "86 mmHg", crt: "2.5s", spo2: "97%", temp: "36.8°C" },
        labs: [
          "12-Lead ECG: 1.5 mm ST elevation in II, III, aVF; sinus tachycardia",
          "Physical Exam: 38 mmHg inter-arm systolic BP differential; faint early diastolic decrescendo murmur at right sternal border",
          "Point-of-care hs-cTnI: Pending"
        ],
        narrative: "The cath-lab fellow calls asking if you want to immediately load IV Heparin + Ticagrelor and rush to primary PCI for inferior STEMI. Look carefully at the bilateral blood pressures, pain quality, and new diastolic murmur.",
        choices: [
          {
            text: "Administer IV Heparin bolus + Ticagrelor immediately and activate fibrinolysis",
            next: "catastrophic_bleed",
            deltaScore: -35,
            feedbackType: "danger",
            feedback: "CRITICAL TRAP! Anticoagulation or fibrinolysis in an Acute Type A Aortic Dissection extending into the Right Coronary Artery ostium causes catastrophic intrapericardial rupture and death [Ref 11]."
          },
          {
            text: "HOLD anticoagulants/thrombolytics! Suspect Acute Type A Aortic Dissection -> Start IV Esmolol/Labetalol FIRST + emergent CTA / bedside TEE",
            next: "impulse_control",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "EXCELLENT! Abrupt 'ripping' interscapular pain + >20 mmHg inter-arm SBP differential + new aortic regurgitation murmur + inferior ST elevation (RCA ostial flap) is classic Type A Aortic Dissection [Ref 6, 11]."
          },
          {
            text: "Give IV Nitroprusside alone first to rapidly drop systolic BP below 120 mmHg",
            next: "nitroprusside_trap",
            deltaScore: -20,
            feedbackType: "warning",
            feedback: "UNSAFE SEQUENCE! Vasodilators BEFORE beta-blockade trigger reflex sympathetic tachycardia, increasing aortic wall shear stress (dP/dt) and accelerating dissection propagation [Ref 11]."
          }
        ]
      },
      catastrophic_bleed: {
        stage: "Recovery Point · Hemodynamic Collapse Avoided",
        vitals: { hr: "134", bp: "84/50", pp: "34 mmHg", crt: "4.5s", spo2: "93%", temp: "36.6°C" },
        labs: [
          "Bedside POCUS: Dilated aortic root with intimal flap + expanding pericardial effusion!",
          "Nursing Alert: Reversal protocol ready — STOP heparin immediately!"
        ],
        narrative: "Bedside ultrasound reveals a proximal ascending aortic intimal flap with retrograde extension toward the aortic valve and right coronary ostium. You stop anticoagulation before further damage. What is the mandatory anti-impulse pharmacologic sequence?",
        choices: [
          {
            text: "Start IV Beta-Blocker (Esmolol or Labetalol) FIRST to target HR <60 bpm, THEN add IV Nicardipine if SBP remains >120 mmHg, + stat CT Surgery",
            next: "final_success",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "Correct rescue! Reducing ventricular ejection velocity (dP/dt) via beta-blockade BEFORE vasodilators is mandatory in acute aortic syndrome [Ref 11]."
          }
        ]
      },
      nitroprusside_trap: {
        stage: "Stage 2 of 3 · Correcting Reflex Tachycardia",
        vitals: { hr: "136", bp: "148/82", pp: "66 mmHg", crt: "3.0s", spo2: "96%", temp: "36.8°C" },
        labs: [
          "Telemetry: HR surged from 112 -> 136 bpm after unopposed vasodilator",
          "Patient reports worsening tearing pain toward the abdomen"
        ],
        narrative: "Unopposed vasodilation provoked reflex tachycardia, increasing shear stress (dP/dt) on the false lumen. What must you do immediately?",
        choices: [
          {
            text: "Initiate IV Esmolol infusion immediately to achieve HR <60 bpm and SBP 100–120 mmHg, and obtain stat CTA / Cardiothoracic Surgery consult",
            next: "impulse_control",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "Right correction! Beta-blockers MUST precede vasodilators in acute aortic dissection to blunt dP/dt [Ref 11]."
          }
        ]
      },
      impulse_control: {
        stage: "Stage 2 of 3 · Imaging & Definitive Management",
        vitals: { hr: "58", bp: "112/68", pp: "44 mmHg", crt: "2.0s", spo2: "98%", temp: "36.8°C" },
        labs: [
          "Emergent CTA Chest: Stanford Type A (DeBakey Type I) ascending aortic dissection involving the aortic root & RCA ostium",
          "IV Esmolol achieved HR 58 bpm, SBP 112 mmHg; IV Fentanyl eased pain"
        ],
        narrative: "CTA confirms Stanford Type A ascending aortic dissection extending into the aortic root with moderate aortic regurgitation. Which definitive disposition matches Harrison's 22e Ch. 15?",
        choices: [
          {
            text: "Admit to medical ward for oral antihypertensive titration and repeat CTA in 48 hours",
            next: "final_success",
            deltaScore: -25,
            feedbackType: "danger",
            feedback: "INCORRECT! Medical management alone is reserved for uncomplicated Stanford Type B (descending) dissection. Untreated Type A dissection carries ~1–2% mortality per hour!"
          },
          {
            text: "Emergent open Cardiothoracic Surgical repair of the ascending aorta while maintaining strict IV beta-blockade & opioid analgesia",
            next: "final_success",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "SPOT ON! Stanford Type A (ascending aorta) is a surgical emergency because of imminent risk of cardiac tamponade, aortic rupture, coronary occlusion, and severe AR [Ref 11]."
          }
        ]
      },
      final_success: {
        stage: "Case 1 Complete · Harrison's 22e Debrief",
        vitals: { hr: "58", bp: "110/64", pp: "46 mmHg", crt: "<2s", spo2: "99%", temp: "36.8°C" },
        labs: [
          "Operating Room Transfer Complete — Ascending Aorta & Root Repaired",
          "Diagnostic Pearl: Always inspect BOTH arm BPs & pain quality before anticoagulating an inferior STEMI!"
        ],
        narrative: "Mr. Kulkarni survives emergent ascending aortic repair because you avoided premature closure on the EMS 'STEMI' label (Ch. 10), used high-LR physical exam clues (Ch. 8), and followed anti-impulse therapy (beta-blocker FIRST -> HR <60, SBP 100–120 -> surgery, Ch. 15).",
        isEnd: true,
        choices: []
      }
    }
  },

  febrile_petechial_coma: {
    id: "febrile_petechial_coma",
    badge: "CASE 2 · FEVER, RASH & COMA",
    patient: {
      name: "Ms. Ananya Sharma",
      age: "21 years",
      weight: "56 kg",
      avatar: "🧠",
      setting: "Rural District Hospital ER · Night Shift"
    },
    intro: "A 21-year-old university hostel resident is brought in by roommates with 10 hours of severe headache, vomiting, and rapidly worsening confusion. She now only groans to painful stimuli (GCS 8: E2 V2 M4). Her oral temperature is 39.6°C and her shins show clusters of dark red spots that do NOT blanch under a glass slide.",
    citations: [13, 14, 18, 32],
    nodes: {
      start: {
        stage: "Stage 1 of 3 · Immediate Stabilization & Golden Hour (Ch. 21, 30)",
        vitals: { hr: "136", bp: "82/46 (MAP 58)", pp: "36 mmHg", crt: "4.0s", spo2: "94%", temp: "39.6°C" },
        labs: [
          "GCS 8 (E2 V2 M4); Pupils 3 mm symmetric & reactive; Marked nuchal rigidity",
          "Skin: Rapidly spreading non-blanching petechiae & palpable purpura on legs/trunk",
          "qSOFA = 3/3 (RR 28, GCS <15, SBP <=100)"
        ],
        narrative: "A junior colleague suggests sending her to the radiology suite first for a non-contrast Head CT and then performing a lumbar puncture BEFORE giving any antibiotics so CSF cultures stay clean. What is your immediate bedside action?",
        choices: [
          {
            text: "Delay antibiotics until Head CT and lumbar puncture are completed so CSF Gram stain isn't sterilized",
            next: "delayed_abx",
            deltaScore: -35,
            feedbackType: "danger",
            feedback: "FATAL DELAY! In febrile petechial shock / suspected meningococcal meningitis, EVERY hour of antibiotic delay sharply increases mortality. NEVER delay antibiotics for CT or LP [Ref 14, 18, 32]."
          },
          {
            text: "Secure airway/O2 + check bedside glucose -> Draw 2 blood cultures -> Give IV Dexamethasone + Ceftriaxone 2g + Vancomycin IMMEDIATELY + 30 mL/kg crystalloid bolus",
            next: "shock_reassess",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "TEXTBOOK LIFE-SAVING ACTION! Draw blood cultures, immediately give IV Dexamethasone (before/with 1st antibiotic) + Ceftriaxone + Vancomycin, check capillary glucose (coma protocol), and initiate sepsis fluid resuscitation [Ref 14, 18, 32]."
          },
          {
            text: "Give oral Acetaminophen and observe for 2 hours to see if fever drops before ordering labs",
            next: "delayed_abx",
            deltaScore: -30,
            feedbackType: "danger",
            feedback: "UNSAFE! Non-blanching petechiae + fever + hypotension + GCS 8 is fulminant meningococcemia / bacterial meningitis with septic shock — an immediate resuscitation emergency [Ref 14]."
          }
        ]
      },
      delayed_abx: {
        stage: "Recovery Point · Septic Shock Escalation",
        vitals: { hr: "148", bp: "72/38 (MAP 49)", pp: "34 mmHg", crt: "5.0s", spo2: "90%", temp: "39.8°C" },
        labs: [
          "Point-of-care Glucose: 52 mg/dL (Hypoglycemia!)",
          "Lactate: 5.4 mmol/L; Platelets: 68,000/uL"
        ],
        narrative: "Her BP crashes to 72/38 and bedside glucose returns 52 mg/dL! Remember Harrison's 22e Ch. 30 (Coma) and Ch. 21 (Fever & Rash). Execute the full rescue bundle now:",
        choices: [
          {
            text: "Give IV Thiamine 100 mg + 25g Dextrose, draw blood cultures, push IV Dexamethasone + Ceftriaxone 2g + Vancomycin NOW, and start balanced crystalloid resuscitation",
            next: "shock_reassess",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "Great recovery! Checking glucose early in coma and giving immediate empiric IV antibiotics + fluids stabilizes the patient [Ref 14, 18]."
          }
        ]
      },
      shock_reassess: {
        stage: "Stage 2 of 3 · Vasopressor & Airway/Imaging Decision",
        vitals: { hr: "126", bp: "78/44 (MAP 55)", pp: "34 mmHg", crt: "3.5s", spo2: "96%", temp: "39.1°C" },
        labs: [
          "Glucose normalized to 124 mg/dL; 1.7 L balanced crystalloid infused",
          "Lactate: 4.8 mmol/L; Persistent hypotension (MAP 55 mmHg) after initial fluid bolus",
          "Airway secured via endotracheal intubation for GCS 8"
        ],
        narrative: "After 30 mL/kg crystalloids, her MAP remains 55 mmHg (septic shock). Also, should you perform an immediate lumbar puncture without Head CT?",
        choices: [
          {
            text: "Start IV Norepinephrine titrated to MAP >=65 mmHg + obtain Head CT BEFORE LP (due to GCS <10 / coma) + initiate droplet precautions & close-contact chemoprophylaxis",
            next: "final_success",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "EXCELLENT! Norepinephrine is the first-line vasopressor in septic shock (target MAP >=65 mmHg [Ref 32]); altered consciousness (GCS <10) requires Head CT before LP to rule out mass/herniation [Ref 18], and Neisseria meningitidis requires droplet isolation + rifampin/ciprofloxacin/ceftriaxone prophylaxis for roommates [Ref 14]."
          },
          {
            text: "Start IV Dopamine and perform immediate blind lumbar puncture at the bedside despite GCS 8",
            next: "final_success",
            deltaScore: -20,
            feedbackType: "warning",
            feedback: "SUBOPTIMAL! Norepinephrine is superior to dopamine (lower arrhythmia & mortality risk [Ref 32]), and severely altered consciousness (GCS <10) is an indication for Head CT prior to LP [Ref 18]."
          }
        ]
      },
      final_success: {
        stage: "Case 2 Complete · Harrison's 22e Debrief",
        vitals: { hr: "98", bp: "108/66 (MAP 80)", pp: "42 mmHg", crt: "2.0s", spo2: "99%", temp: "37.8°C" },
        labs: [
          "Blood Cultures: Gram-negative diplococci (Neisseria meningitidis)",
          "Head CT: No mass or herniation; ICU transfer stabilized on Norepinephrine"
        ],
        narrative: "Ms. Sharma makes a full neurologic recovery! You mastered Harrison's 22e Fever & Rash emergency triage (Ch. 21), Coma ABC + Glucose/Thiamine protocol (Ch. 30), and Surviving Sepsis 1-hour bundle (Ref 32).",
        isEnd: true,
        choices: []
      }
    }
  },

  acid_base_hyperk_ascites: {
    id: "acid_base_hyperk_ascites",
    badge: "CASE 3 · ELECTROLYTES, ABG & ASCITES",
    patient: {
      name: "Mr. Vikram Nair",
      age: "54 years",
      weight: "68 kg",
      avatar: "🧪",
      setting: "Internal Medicine Ward · Acute Deterioration"
    },
    intro: "A 54-year-old man with Child-Pugh C alcohol-related cirrhosis and ascites is admitted with diffuse abdominal tenderness, confusion, and oliguria (urine output 15 mL/h). Stat labs and ECG return with multiple critical abnormalities.",
    citations: [24, 26, 27, 25],
    nodes: {
      start: {
        stage: "Stage 1 of 3 · Lethal Electrolyte Priority (Ch. 56)",
        vitals: { hr: "52", bp: "92/54 (MAP 67)", pp: "38 mmHg", crt: "3.0s", spo2: "96%", temp: "38.2°C" },
        labs: [
          "Serum K+: 7.1 mEq/L | Na+: 124 mEq/L | Cl-: 92 mEq/L | HCO3-: 12 mEq/L | Albumin: 2.0 g/dL | Cr: 3.1 mg/dL",
          "ABG: pH 7.24, PaCO2 26 mmHg, Lactate 4.9 mmol/L",
          "ECG: Tall peaked T waves, flattened P waves, widened QRS (148 ms)!"
        ],
        narrative: "Look at the stat ECG (widened QRS 148 ms with K+ 7.1 mEq/L) alongside his metabolic acidosis (pH 7.24, HCO3- 12) and hyponatremia (Na+ 124). What is the SINGLE FIRST drug you must push IV right now?",
        choices: [
          {
            text: "IV Calcium Gluconate 10% (10 mL = 1 g over 2–3 min) FIRST to stabilize the cardiac membrane",
            next: "abg_workup",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "LIFE SAVED! Widened QRS in hyperkalemia heralds imminent sine-wave VF/asystole. IV Calcium gluconate antagonizes cardiac membrane excitability within 1–3 minutes—follow immediately with IV Insulin+Dextrose [Ref 26]."
          },
          {
            text: "Oral Sodium Zirconium Cyclosilicate / Kayexalate alone and repeat K+ in 4 hours",
            next: "cardiac_arrest_warning",
            deltaScore: -35,
            feedbackType: "danger",
            feedback: "FATAL DELAY! Oral potassium binders take hours to act and do NOT protect a heart already showing QRS widening (148 ms) [Ref 26]."
          },
          {
            text: "Infuse 300 mL of 3% Hypertonic Saline rapidly to raise Na+ from 124 to 136 mEq/L today",
            next: "cardiac_arrest_warning",
            deltaScore: -30,
            feedbackType: "danger",
            feedback: "DOUBLE ERROR! First, hyperkalemia with widened QRS kills in minutes; second, raising Na+ by 12 mEq/L in a malnourished cirrhotic risks catastrophic Osmotic Demyelination Syndrome [Ref 26]."
          }
        ]
      },
      cardiac_arrest_warning: {
        stage: "Recovery Point · Sine-Wave ECG Alert!",
        vitals: { hr: "40", bp: "78/42", pp: "36 mmHg", crt: "4.0s", spo2: "94%", temp: "38.2°C" },
        labs: [
          "Telemetry Alarm: QRS widening to 170 ms — impending hyperkalemic cardiac arrest!"
        ],
        narrative: "The cardiac monitor alarms with worsening bradycardia and QRS widening. Act immediately using the Harrison's 22e Ch. 56 Hyperkalemia Triad:",
        choices: [
          {
            text: "Push 10 mL of 10% IV Calcium Gluconate immediately, then give IV Regular Insulin (10 U) + Dextrose 50% (25g) and nebulized Albuterol",
            next: "abg_workup",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "QRS narrows back to 104 ms within 2 minutes! Now let's decode his Acid-Base & Ascites diagnosis [Ref 26]."
          }
        ]
      },
      abg_workup: {
        stage: "Stage 2 of 3 · Albumin-Corrected Anion Gap & Ascites Paracentesis (Ch. 53, 58)",
        vitals: { hr: "84", bp: "98/58", pp: "40 mmHg", crt: "2.5s", spo2: "97%", temp: "38.2°C" },
        labs: [
          "ECG: QRS narrowed to 102 ms; K+ trending down to 6.1 after Insulin + D50",
          "Uncorrected AG = 124 - (92 + 12) = 20 | Albumin = 2.0 g/dL -> Corrected AG = 25!",
          "Winter's Expected PaCO2 = (1.5 × 12) + 8 ± 2 = 26 ± 2 mmHg (Measured = 26 -> Appropriate compensation!)",
          "Diagnostic Paracentesis: Serum Albumin 2.0, Ascitic Albumin 0.5 -> SAAG = 1.5 g/dL; Ascitic PMN = 640 cells/uL!"
        ],
        narrative: "Look at the paracentesis results: SAAG = 1.5 g/dL (>=1.1 = portal hypertension) and Ascitic PMN = 640 cells/uL (>=250 cells/uL). What is the diagnosis and immediate evidence-based treatment?",
        choices: [
          {
            text: "Spontaneous Bacterial Peritonitis (SBP) — Start IV Ceftriaxone 2g daily immediately + IV Albumin (1.5 g/kg Day 1, 1.0 g/kg Day 3) to prevent Hepatorenal Syndrome",
            next: "final_success",
            deltaScore: 0,
            feedbackType: "success",
            feedback: "MASTERY! Ascitic PMN >=250/uL defines SBP regardless of culture pending status. Immediate 3rd-generation cephalosporin (ceftriaxone/cefotaxime) + IV albumin markedly lowers renal failure and mortality [Ref 24]."
          },
          {
            text: "Wait 48 hours for ascitic fluid bacterial culture growth before initiating antibiotics",
            next: "final_success",
            deltaScore: -25,
            feedbackType: "danger",
            feedback: "UNSAFE! Never await culture confirmation when ascitic PMN >=250 cells/uL; many SBP cases are culture-negative neutrocytic ascites and require immediate empiric IV antibiotics [Ref 24]."
          }
        ]
      },
      final_success: {
        stage: "Case 3 Complete · Harrison's 22e Debrief",
        vitals: { hr: "78", bp: "106/64", pp: "42 mmHg", crt: "2.0s", spo2: "98%", temp: "37.4°C" },
        labs: [
          "K+ 5.2 mEq/L; Na+ gently rising at +4 mEq/L/24h (ODS-safe!)",
          "Corrected AG = 25 (Lactic Acidosis from SBP sepsis); Appropriate Winter's respiratory compensation",
          "IV Ceftriaxone + Albumin initiated; urine output improving"
        ],
        narrative: "You navigated three intersecting Harrison's 22e crises simultaneously: Cardiac membrane stabilization in hyperkalemia (Ch. 56), Albumin-corrected Anion Gap + Winter's Formula (Ch. 58), and Portal-Hypertensive Ascites + SBP treatment (Ch. 53)!",
        isEnd: true,
        choices: []
      }
    }
  }
};
