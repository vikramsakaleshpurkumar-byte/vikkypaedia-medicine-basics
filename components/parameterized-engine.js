/**
 * Vikkypaedia v9.1 — PrairieLearn Dynamic Parameterized Clinical Case Generator
 * Generates infinite fresh adult clinical vignettes (randomized vitals, labs & probabilities)
 * so learners cannot memorize static answer keys on re-tests.
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateDynamicCases() {
  return [
    generateAcidBaseCase(),
    generateHyponatremiaCase(),
    generateAscitesCase(),
    generateHypoxemiaCase(),
    generateSepsisShockCase()
  ];
}

function generateAcidBaseCase() {
  const na = pick([136, 138, 140, 142]);
  const cl = pick([98, 100, 102]);
  const hco3 = pick([10, 12, 14, 16]);
  const alb = pick([2.0, 2.4, 2.8]);
  const rawAG = na - (cl + hco3);
  const corrAG = Number((rawAG + 2.5 * (4.0 - alb)).toFixed(1));
  const wintersMid = Math.round(1.5 * hco3 + 8);
  const isMixedRespAcid = Math.random() > 0.5;
  const paco2 = isMixedRespAcid ? wintersMid + 10 : wintersMid;

  return {
    id: 'dyn-abg',
    category: 'Ch. 58 · Acid-Base Parameterized Drill',
    stem: `A critically ill patient has Na+ ${na}, Cl- ${cl}, HCO3- ${hco3} mEq/L, serum Albumin ${alb.toFixed(1)} g/dL, arterial pH 7.22, and PaCO2 ${paco2} mmHg. What is the albumin-corrected Anion Gap and respiratory status?`,
    hints: [
      "Recall Probe: How does hypoalbuminemia affect the measured Anion Gap?",
      "Clinical Rule: Add +2.5 mEq/L to AG for each 1 g/dL drop in albumin below 4.0, and check Winter's formula PaCO2 = (1.5 × HCO3-) + 8 ± 2.",
      `Harrison's 22e Ch. 58 Anchor: Raw AG = ${na} - (${cl} + ${hco3}) = ${rawAG}. Albumin correction = +2.5 × (4.0 - ${alb.toFixed(1)}) = +${(2.5*(4-alb)).toFixed(1)}. Expected PaCO2 = ${wintersMid} ± 2 mmHg.`
    ],
    options: [
      {
        text: `Corrected AG ${corrAG} mEq/L with ${isMixedRespAcid ? 'concurrent primary Respiratory Acidosis' : 'appropriate respiratory compensation'}`,
        correct: true
      },
      {
        text: `Corrected AG ${rawAG} mEq/L (no albumin adjustment needed) with appropriate compensation`,
        correct: false
      },
      {
        text: `Corrected AG ${(corrAG - 5).toFixed(1)} mEq/L with concurrent Respiratory Alkalosis`,
        correct: false
      },
      {
        text: `Corrected AG ${corrAG} mEq/L with ${isMixedRespAcid ? 'appropriate respiratory compensation' : 'concurrent primary Respiratory Acidosis'}`,
        correct: false
      }
    ].sort(() => Math.random() - 0.5),
    rationale: `Raw AG = ${rawAG}. Because albumin is ${alb.toFixed(1)} g/dL, corrected AG = ${rawAG} + 2.5 × (4.0 - ${alb.toFixed(1)}) = ${corrAG} mEq/L. Winter's expected PaCO2 = (1.5 × ${hco3}) + 8 ± 2 = ${wintersMid - 2}–${wintersMid + 2} mmHg; measured PaCO2 (${paco2}) indicates ${isMixedRespAcid ? 'superimposed respiratory acidosis (CO2 retention)' : 'appropriate respiratory compensation'} [Harrison's 22e Ch. 58].`
  };
}

function generateHyponatremiaCase() {
  const startNa = pick([114, 116, 118, 120]);
  const highRisk = Math.random() > 0.5;
  const maxSafe24h = highRisk ? startNa + 6 : startNa + 8;
  const profile = highRisk
    ? "chronic alcohol use disorder, malnutrition, and K+ 2.8 mEq/L"
    : "chronic SIADH on thiazide diuretic without seizure";

  return {
    id: 'dyn-na',
    category: 'Ch. 56 · Hyponatremia ODS Safety Drill',
    stem: `A 58-year-old with ${profile} presents with chronic serum Na+ of ${startNa} mEq/L (mild nausea, no seizures). What is the safest 24-hour target Na+ ceiling to prevent Osmotic Demyelination Syndrome (ODS)?`,
    hints: [
      "Recall Probe: Why is rapid correction dangerous in chronic (>48h) hyponatremia?",
      "Clinical Rule: Brain cells lose organic osmolytes to adapt; rapid hypertonic shift shrinks oligodendrocytes causing ODS.",
      `Harrison's 22e Ch. 56 Anchor: Never exceed 8–10 mEq/L in 24h (strictly cap at 4–6 mEq/L in high-risk alcoholism, malnutrition, cirrhosis, or hypokalemia).`
    ],
    options: [
      { text: `Do not exceed ~${maxSafe24h} mEq/L at 24h (raise by ${highRisk ? '4–6' : '6–8'} mEq/L max)`, correct: true },
      { text: `Correct rapidly to 135 mEq/L (+${135 - startNa} mEq/L) within 12 hours using 3% saline`, correct: false },
      { text: `Raise to ${startNa + 14} mEq/L (+14 mEq/L) within 24 hours`, correct: false },
      { text: `Give hypotonic D5W to lower Na+ further before correcting`, correct: false }
    ].sort(() => Math.random() - 0.5),
    rationale: `Starting from ${startNa} mEq/L${highRisk ? ' with high ODS risk factors (alcoholism/malnutrition/hypokalemia)' : ''}, Harrison's 22e Ch. 56 strictly limits 24-hour correction to ${highRisk ? '4–6 mEq/L (target <= ' + maxSafe24h + ' mEq/L)' : '6–8 mEq/L (absolute max 8–10 mEq/L, target <= ' + maxSafe24h + ' mEq/L)'} to prevent Osmotic Demyelination Syndrome.`
  };
}

function generateAscitesCase() {
  const sAlb = pick([3.2, 3.0, 2.8, 3.4]);
  const isPortal = Math.random() > 0.4;
  const aAlb = isPortal ? Number((sAlb - pick([1.4, 1.6, 1.8])).toFixed(1)) : Number((sAlb - pick([0.6, 0.8])).toFixed(1));
  const saag = Number((sAlb - aAlb).toFixed(1));
  const pmn = pick([80, 120, 420, 680]);
  const hasSBP = pmn >= 250;

  return {
    id: 'dyn-ascites',
    category: 'Ch. 53 · Ascites SAAG & SBP Parameterized Drill',
    stem: `Diagnostic paracentesis reveals Serum Albumin ${sAlb.toFixed(1)} g/dL, Ascitic Albumin ${aAlb.toFixed(1)} g/dL, and Ascitic PMN count ${pmn} cells/uL. How do you interpret SAAG and infection status?`,
    hints: [
      "Recall Probe: How is SAAG calculated (subtraction or ratio)?",
      "Clinical Rule: SAAG = Serum Albumin − Ascitic Albumin. Cutoff is 1.1 g/dL; SBP cutoff is PMN >= 250 cells/uL.",
      `Harrison's 22e Ch. 53 Anchor: SAAG = ${sAlb.toFixed(1)} - ${aAlb.toFixed(1)} = ${saag.toFixed(1)} g/dL; PMN = ${pmn} cells/uL.`
    ],
    options: [
      {
        text: `SAAG ${saag.toFixed(1)} g/dL (${isPortal ? 'Portal hypertension' : 'Non-portal hypertension, e.g. malignancy/TB'}) + ${hasSBP ? 'Spontaneous Bacterial Peritonitis -> Start IV Ceftriaxone NOW' : 'No SBP (PMN <250/uL)'}`,
        correct: true
      },
      {
        text: `SAAG ${saag.toFixed(1)} g/dL (${isPortal ? 'Non-portal hypertension' : 'Portal hypertension'}) + ${hasSBP ? 'No SBP' : 'SBP emergency'}`,
        correct: false
      },
      {
        text: `SAAG ${saag.toFixed(1)} g/dL (${isPortal ? 'Portal hypertension' : 'Non-portal hypertension'}) + ${hasSBP ? 'No SBP (wait for PMN >1000)' : 'SBP -> Start IV Ceftriaxone'}`,
        correct: false
      },
      {
        text: `SAAG cannot be interpreted without ascitic LDH and amylase`,
        correct: false
      }
    ].sort(() => Math.random() - 0.5),
    rationale: `SAAG = ${sAlb.toFixed(1)} − ${aAlb.toFixed(1)} = ${saag.toFixed(1)} g/dL (${isPortal ? '>=1.1 g/dL indicates portal hypertension' : '<1.1 g/dL indicates non-portal cause like peritoneal carcinomatosis or TB'}). Ascitic PMN is ${pmn}/uL (${hasSBP ? '>=250/uL diagnoses SBP requiring immediate IV 3rd-gen cephalosporin + albumin' : '<250/uL excludes SBP'}) [Harrison's 22e Ch. 53].`
  };
}

function generateHypoxemiaCase() {
  const age = pick([32, 48, 64, 72]);
  const expectedAA = (age / 4) + 4;
  const isHypovent = Math.random() > 0.5;
  const paco2 = isHypovent ? pick([60, 64, 68]) : pick([30, 32, 34]);
  const pAO2 = Math.round(150 - paco2 / 0.8);
  const pao2 = isHypovent ? Math.max(48, pAO2 - Math.round(expectedAA - 2)) : 56;
  const aa = pAO2 - pao2;

  return {
    id: 'dyn-aa',
    category: 'Ch. 42 · Hypoxemia & A-a Gradient Drill',
    stem: `A ${age}-year-old on room air (FiO2 21%) has PaO2 ${pao2} mmHg and PaCO2 ${paco2} mmHg (PAO2 ≈ ${pAO2} mmHg; age-expected normal A-a gradient <= ${expectedAA.toFixed(0)} mmHg). What is the primary mechanism of hypoxemia?`,
    hints: [
      "Recall Probe: What separates hypoventilation from V/Q mismatch or shunt?",
      "Clinical Rule: Calculate A-a gradient = PAO2 − PaO2 and compare against (Age/4) + 4.",
      `Harrison's 22e Ch. 42 Anchor: Measured A-a = ${pAO2} - ${pao2} = ${aa} mmHg vs expected <= ${expectedAA.toFixed(0)} mmHg.`
    ],
    options: [
      {
        text: isHypovent
          ? `Pure Alveolar Hypoventilation (Normal A-a gradient ${aa} mmHg + elevated PaCO2 ${paco2})`
          : `Intrinsic V/Q Mismatch or Right-to-Left Shunt (Elevated A-a gradient ${aa} mmHg)`,
        correct: true
      },
      {
        text: isHypovent
          ? `Right-to-Left Intrapulmonary Shunt (Elevated A-a gradient)`
          : `Pure Alveolar Hypoventilation (Normal A-a gradient)`,
        correct: false
      },
      {
        text: `Severe Anemia causing reduced PaO2 on arterial blood gas`,
        correct: false
      },
      {
        text: `Carbon Monoxide poisoning lowering PaO2 directly`,
        correct: false
      }
    ].sort(() => Math.random() - 0.5),
    rationale: `Measured A-a gradient = ${pAO2} − ${pao2} = ${aa} mmHg (expected <= ${expectedAA.toFixed(0)} mmHg). ${isHypovent ? 'Because the A-a gradient is normal and PaCO2 is markedly elevated, the cause is pure alveolar hypoventilation (e.g., opioids/neuromuscular failure)' : 'Because the A-a gradient is markedly elevated, intrinsic parenchymal/vascular pathology (V/Q mismatch or shunt) is present'}. Note that anemia and CO poisoning lower O2 content without lowering PaO2 [Harrison's 22e Ch. 42].`
  };
}

function generateSepsisShockCase() {
  const wt = pick([60, 70, 80, 90]);
  const sbp = pick([78, 82, 86]);
  const dbp = pick([44, 48, 52]);
  const map = Math.round((sbp + 2 * dbp) / 3);
  const bolusMl = wt * 30;

  return {
    id: 'dyn-sepsis',
    category: 'Ch. 20 / SSC · Sepsis & MAP Parameterized Drill',
    stem: `A ${wt}-kg febrile patient (39.3°C, RR 26, confused) has BP ${sbp}/${dbp} mmHg and lactate 4.6 mmol/L. What is their Mean Arterial Pressure (MAP), initial crystalloid target (30 mL/kg), and first-line vasopressor if hypotension persists?`,
    hints: [
      "Recall Probe: How is MAP computed from SBP and DBP?",
      "Clinical Rule: MAP = (SBP + 2 × DBP) / 3; target MAP >= 65 mmHg; initial crystalloid = 30 mL/kg.",
      `Surviving Sepsis 2021 / Harrison's Anchor: MAP = (${sbp} + 2×${dbp})/3 = ${map} mmHg; 30 × ${wt} = ${bolusMl} mL; Norepinephrine is 1st-line.`
    ],
    options: [
      { text: `MAP ${map} mmHg; ${bolusMl} mL balanced crystalloid + IV antibiotics within 1h; Norepinephrine first-line to MAP >=65 mmHg`, correct: true },
      { text: `MAP ${Math.round((sbp + dbp)/2)} mmHg; ${wt * 10} mL crystalloid; Dopamine first-line`, correct: false },
      { text: `MAP ${map} mmHg; ${bolusMl} mL 5% Dextrose in Water; Phenylephrine first-line`, correct: false },
      { text: `MAP ${map} mmHg; withhold fluids and antibiotics until cultures return in 24h`, correct: false }
    ].sort(() => Math.random() - 0.5),
    rationale: `MAP = (${sbp} + 2×${dbp}) / 3 = ${map} mmHg (<65 mmHg). Initial resuscitation is 30 mL/kg = ${bolusMl} mL balanced crystalloid alongside broad-spectrum IV antimicrobials within 1 hour, and Norepinephrine is the first-line vasopressor targeting MAP >=65 mmHg [Ref 32].`
  };
}
