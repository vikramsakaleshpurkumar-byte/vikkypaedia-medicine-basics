/**
 * Vikkypaedia v9.1 — Mobile Tap-to-Sequence Clinical Puzzle Engine (Runestone Adaptation)
 * Replaces frustrating mobile drag-and-drop with thumb-friendly >=48px tap-to-order chips.
 */

export const UNIT_PUZZLES = {
  2: {
    id: "puzzle-febrile-petechiae",
    title: "Tap-to-Sequence: Acute Febrile Patient with Non-Blanching Petechiae & Hypotension (Ch. 21, 30)",
    subtitle: "Tap clinical actions in exact life-saving priority order (1 -> 5):",
    steps: [
      { id: "abc", text: "1. Stabilize ABCs, high-flow O2, large-bore IV access & droplet isolation" },
      { id: "cultures", text: "2. Draw 2 sets of peripheral blood cultures + point-of-care glucose & lactate" },
      { id: "abx", text: "3. Push IV Dexamethasone + empiric Ceftriaxone 2g + Vancomycin IMMEDIATELY (do NOT await CT/LP)" },
      { id: "fluids", text: "4. Infuse balanced crystalloid bolus (30 mL/kg) & start Norepinephrine if MAP <65 mmHg" },
      { id: "imaging", text: "5. Perform Head CT (if GCS <10/focal deficit) -> Lumbar Puncture once hemodynamically stable" }
    ],
    correctOrder: ["abc", "cultures", "abx", "fluids", "imaging"],
    rationale: "Harrison's 22e Ch. 21 & Surviving Sepsis 2021 mandate ABC stabilization -> blood cultures -> immediate empiric IV antibiotics + dexamethasone BEFORE imaging or LP, followed by aggressive hemodynamic resuscitation."
  },
  3: {
    id: "puzzle-chest-pain",
    title: "Tap-to-Sequence: 10-Minute Acute Chest Discomfort Triage (Ch. 15)",
    subtitle: "Order the first 5 actions for a diaphoretic 60-year-old arriving with acute substernal chest pain:",
    steps: [
      { id: "vitals", text: "Assess ABCs, SpO2, cardiac monitor & bilateral arm blood pressures" },
      { id: "ecg", text: "Acquire & interpret 12-lead ECG within 10 minutes of arrival" },
      { id: "dissect", text: "Screen for aortic dissection red flags (tearing back pain, BP/pulse deficit) before anticoagulation" },
      { id: "troponin", text: "Draw high-sensitivity cardiac troponin (0h & 1–2h) and administer Aspirin if ACS suspected" },
      { id: "reperfuse", text: "Activate immediate reperfusion (PCI <90 min) for STEMI or structured HEART/CTA pathway" }
    ],
    correctOrder: ["vitals", "ecg", "dissect", "troponin", "reperfuse"],
    rationale: "Harrison's 22e Ch. 15 & AHA/ACC 2021 require immediate bilateral vitals + 10-minute ECG, ruling out aortic dissection before antiplatelet/anticoagulant loading, followed by serial hs-cTn and definitive reperfusion."
  },
  5: {
    id: "puzzle-coma",
    title: "Tap-to-Sequence: Immediate Bedside Stabilization of the Comatose Patient (Ch. 30)",
    subtitle: "Arrange the emergency coma evaluation sequence in correct priority order:",
    steps: [
      { id: "airway", text: "Secure Airway (intubate if GCS <=8), Breathing (O2) & Circulation (C-spine if trauma)" },
      { id: "glucose", text: "Check stat capillary glucose -> Give IV Thiamine 100 mg BEFORE/WITH 25g IV Dextrose" },
      { id: "naloxone", text: "Administer IV Naloxone if pinpoint pupils or respiratory depression (RR <12)" },
      { id: "brainstem", text: "Perform focused brainstem exam (pupillary light reflex, corneal, oculocephalic/VOR, motor posturing)" },
      { id: "ct", text: "Obtain emergent Non-Contrast Head CT (and treat herniation with 30° HOB + Mannitol/3% NaCl)" }
    ],
    correctOrder: ["airway", "glucose", "naloxone", "brainstem", "ct"],
    rationale: "Harrison's 22e Ch. 30 emphasizes securing ABCs and reversing lethal metabolic/toxic mimics (glucose + thiamine + naloxone) BEFORE localizing brainstem reflexes and transporting to Head CT."
  },
  6: {
    id: "puzzle-ugib",
    title: "Tap-to-Sequence: Massive Upper GI Bleeding in a Cirrhotic Patient (Ch. 51)",
    subtitle: "Tap steps in exact Harrison's 22e resuscitation order for hematemesis + melena:",
    steps: [
      { id: "iv", text: "Insert 2 large-bore peripheral IVs (16–18G), assess airway protection & start crystalloid resuscitation" },
      { id: "transfuse", text: "Type & crossmatch; transfuse PRBCs using restrictive target Hb <7 g/dL (avoid over-transfusion!)" },
      { id: "meds", text: "Start IV Octreotide + IV Ceftriaxone (SBP/infection prophylaxis) + IV Pantoprazole" },
      { id: "endo", text: "Perform urgent Upper Endoscopy (EGD) within 12–24 hours for variceal band ligation" }
    ],
    correctOrder: ["iv", "transfuse", "meds", "endo"],
    rationale: "Harrison's 22e Ch. 51: Hemodynamic resuscitation + restrictive transfusion (Hb <7 g/dL prevents rebleeding from elevated portal pressure) + early IV octreotide & ceftriaxone precede endoscopic band ligation."
  },
  7: {
    id: "puzzle-hyperkalemia",
    title: "Tap-to-Sequence: Severe Hyperkalemia (K+ 7.2 mEq/L) with Widened QRS (Ch. 56)",
    subtitle: "Order the emergency hyperkalemia intervention triad by speed of cardiac protection:",
    steps: [
      { id: "calcium", text: "Push IV Calcium Gluconate 10% (1 g over 2–3 min) -> Membrane stabilization (1–3 min)" },
      { id: "shift", text: "Administer IV Regular Insulin (10 U) + D50W (25g) + nebulized Albuterol -> Cellular shift (15–30 min)" },
      { id: "remove", text: "Initiate K+ elimination: IV Loop diuretic (if making urine), GI K+ binder, or emergent Hemodialysis" },
      { id: "monitor", text: "Maintain continuous ECG telemetry, stop offending RAAS/NSAIDs, and check hourly glucose x 6h" }
    ],
    correctOrder: ["calcium", "shift", "remove", "monitor"],
    rationale: "Harrison's 22e Ch. 56: Stabilize myocardium FIRST (Calcium), Shift K+ intracellularly SECOND (Insulin+Dextrose/Albuterol), Eliminate K+ THIRD (Diuretic/Binder/Dialysis), and Monitor closely for rebound hyperkalemia or hypoglycemia."
  }
};

export class TapSequencePuzzle {
  constructor(containerEl, puzzleConfig) {
    this.container = containerEl;
    this.config = puzzleConfig;
    this.scrambledSteps = [...puzzleConfig.steps].sort(() => Math.random() - 0.5);
    // Guarantee not accidentally pre-sorted
    if (this.scrambledSteps.every((s, i) => s.id === puzzleConfig.correctOrder[i]) && this.scrambledSteps.length > 1) {
      [this.scrambledSteps[0], this.scrambledSteps[1]] = [this.scrambledSteps[1], this.scrambledSteps[0]];
    }
    this.selected = [];
    this.result = null;
    this.render();
  }

  getStepText(id) {
    return this.config.steps.find((s) => s.id === id)?.text || id;
  }

  handleTap(stepId) {
    if (this.selected.includes(stepId)) {
      this.selected = this.selected.filter((id) => id !== stepId);
      this.result = null;
    } else {
      this.selected.push(stepId);
      if (this.selected.length === this.config.correctOrder.length) {
        const isCorrect = this.selected.every((id, idx) => id === this.config.correctOrder[idx]);
        this.result = isCorrect ? 'correct' : 'wrong';
      }
    }
    this.render();
  }

  reset() {
    this.selected = [];
    this.result = null;
    this.render();
  }

  render() {
    if (!this.container) return;
    const remaining = this.scrambledSteps.filter((s) => !this.selected.includes(s.id));

    this.container.innerHTML = `
      <div class="puzzle-card">
        <div class="puzzle-header">
          <span class="sandbox-tag">🧩 Runestone Mobile Tap-to-Sequence Puzzle</span>
          <h4>${this.config.title}</h4>
          <p class="puzzle-sub">${this.config.subtitle}</p>
        </div>

        <div class="sequence-slots" aria-label="Selected clinical sequence">
          ${this.selected.length === 0
            ? `<div class="slots-placeholder">Tap the clinical cards below in priority order (Step 1 first)...</div>`
            : this.selected.map((id, i) => {
                const slotCorrect = this.result && id === this.config.correctOrder[i];
                const slotWrong = this.result === 'wrong' && id !== this.config.correctOrder[i];
                return `
                  <button type="button" class="slot-chip ${slotCorrect ? 'slot-ok' : ''} ${slotWrong ? 'slot-err' : ''}" data-remove-id="${id}" title="Tap to remove">
                    <span class="slot-num">${i + 1}</span>
                    <span class="slot-text">${this.getStepText(id)}</span>
                    <span class="slot-x" aria-hidden="true">✕</span>
                  </button>
                `;
              }).join('')}
        </div>

        ${remaining.length > 0 ? `
          <div class="available-chips">
            ${remaining.map((s) => `
              <button type="button" class="tap-step-btn" data-add-id="${s.id}">
                <span class="tap-plus">+</span>
                <span>${s.text}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}

        ${this.result === 'correct' ? `
          <div class="puzzle-feedback ok">
            <strong>✅ Exact Harrison's 22e Priority Order Mastered!</strong>
            <p>${this.config.rationale}</p>
          </div>
        ` : ''}

        ${this.result === 'wrong' ? `
          <div class="puzzle-feedback err">
            <strong>⚠️ Sequence Needs Correction</strong> — Red-highlighted steps are out of clinical priority order. Tap any placed chip to reorder, or reset!
            <p>${this.config.rationale}</p>
          </div>
        ` : ''}

        <div class="puzzle-footer">
          <button type="button" class="btn-clear-tray">↺ Reset Sequence</button>
          <span class="puzzle-count">${this.selected.length} / ${this.config.correctOrder.length} placed</span>
        </div>
      </div>
    `;

    this.container.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.addEventListener('click', () => this.handleTap(btn.dataset.addId));
    });
    this.container.querySelectorAll('[data-remove-id]').forEach((btn) => {
      btn.addEventListener('click', () => this.handleTap(btn.dataset.removeId));
    });
    this.container.querySelector('.btn-clear-tray')?.addEventListener('click', () => this.reset());
  }
}
