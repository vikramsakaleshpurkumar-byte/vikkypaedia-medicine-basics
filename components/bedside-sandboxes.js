/**
 * Vikkypaedia v9.1 — Andrew Ng Embedded Bedside Tap-Calculators & Physiological Sandboxes
 * Zero-dependency real-time clinical sandboxes with automated Harrison's 22e safety assertions.
 */

export function renderUnitSandbox(containerEl, unitIndex) {
  if (!containerEl) return;
  if (unitIndex === 0) renderBayesSandbox(containerEl);
  else if (unitIndex === 4) renderAaGradientSandbox(containerEl);
  else if (unitIndex === 7) renderAcidBaseSodiumSandbox(containerEl);
  else if (unitIndex === 9) renderPharmacokineticsSandbox(containerEl);
}

/* ── 1. UNIT 1: BAYESIAN PROBABILITY & LIKELIHOOD RATIO SANDBOX (Ch. 4) ── */
export function renderBayesSandbox(containerEl) {
  const state = { preProb: 20, lr: 5.0 };

  const update = () => {
    const preOdds = state.preProb / (100 - state.preProb);
    const postOdds = preOdds * state.lr;
    const postProb = Math.min(99.9, Math.max(0.1, (postOdds / (1 + postOdds)) * 100));

    let alertText = '';
    let alertCls = 'info';
    if (state.preProb < 5 && state.lr < 5) {
      alertCls = 'warn';
      alertText = `⚠️ <strong>False-Positive Trap (Ch. 4):</strong> With low pre-test probability (${state.preProb}%), even a positive test (LR ${state.lr.toFixed(1)}) yields only <strong>${postProb.toFixed(1)}%</strong> post-test probability — most positives are false positives! Avoid indiscriminate testing.`;
    } else if (postProb >= 80) {
      alertCls = 'ok';
      alertText = `✅ <strong>Treatment Threshold Crossed:</strong> Post-test probability is <strong>${postProb.toFixed(1)}%</strong> — high enough to initiate definitive therapy rather than delay for more tests [Harrison's 22e Ch. 4].`;
    } else {
      alertCls = 'info';
      alertText = `💡 <strong>Testing Zone:</strong> Post-test odds = Pre-test odds (${preOdds.toFixed(2)}) × LR (${state.lr.toFixed(1)}) = <strong>${postOdds.toFixed(2)}</strong> → Post-test probability <strong>${postProb.toFixed(1)}%</strong>. Consider an additional high-LR test.`;
    }

    containerEl.querySelector('#bayes-pre-val').textContent = `${state.preProb}%`;
    containerEl.querySelector('#bayes-lr-val').textContent = `${state.lr.toFixed(1)}×`;
    containerEl.querySelector('#bayes-post-val').textContent = `${postProb.toFixed(1)}%`;
    containerEl.querySelector('#bayes-odds-val').textContent = `${postOdds.toFixed(2)} : 1`;
    const alertEl = containerEl.querySelector('#bayes-alert');
    alertEl.className = `sandbox-clinical-alert alert-${alertCls}`;
    alertEl.innerHTML = alertText;
  };

  containerEl.innerHTML = `
    <div class="bedside-sandbox-card">
      <div class="sandbox-header">
        <span class="sandbox-tag">🧪 Andrew Ng Bedside Sandbox · Ch. 4</span>
        <h4>Bayesian Diagnostic Probability &amp; Likelihood Ratio Lab</h4>
      </div>
      <div class="sandbox-controls-grid">
        <div class="touch-stepper">
          <label for="bayes-pre-slider">Pre-Test Probability: <strong id="bayes-pre-val">20%</strong></label>
          <div class="stepper-controls">
            <button type="button" class="step-btn" data-dpre="-5">−</button>
            <input type="range" id="bayes-pre-slider" min="1" max="95" value="20" class="sandbox-slider">
            <button type="button" class="step-btn" data-dpre="5">+</button>
          </div>
        </div>
        <div class="touch-stepper">
          <label>Test Likelihood Ratio (LR): <strong id="bayes-lr-val">5.0×</strong></label>
          <div class="preset-pills">
            <button type="button" class="preset-btn" data-lr="0.1">LR− 0.1 (Strong Rule-Out)</button>
            <button type="button" class="preset-btn" data-lr="0.5">LR− 0.5</button>
            <button type="button" class="preset-btn active" data-lr="5.0">LR+ 5.0</button>
            <button type="button" class="preset-btn" data-lr="10.0">LR+ 10 (Strong Rule-In)</button>
          </div>
        </div>
      </div>
      <div class="sandbox-output-grid">
        <div class="output-cell">
          <span class="out-lbl">Post-Test Probability</span>
          <span id="bayes-post-val" class="out-val text-primary">55.6%</span>
        </div>
        <div class="output-cell">
          <span class="out-lbl">Post-Test Odds</span>
          <span id="bayes-odds-val" class="out-val">1.25 : 1</span>
        </div>
      </div>
      <div id="bayes-alert" class="sandbox-clinical-alert"></div>
    </div>
  `;

  const slider = containerEl.querySelector('#bayes-pre-slider');
  slider.addEventListener('input', () => { state.preProb = Number(slider.value); update(); });
  containerEl.querySelectorAll('[data-dpre]').forEach((b) => {
    b.addEventListener('click', () => {
      state.preProb = Math.min(95, Math.max(1, state.preProb + Number(b.dataset.dpre)));
      slider.value = state.preProb;
      update();
    });
  });
  containerEl.querySelectorAll('[data-lr]').forEach((b) => {
    b.addEventListener('click', () => {
      containerEl.querySelectorAll('[data-lr]').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      state.lr = Number(b.dataset.lr);
      update();
    });
  });
  update();
}

/* ── 2. UNIT 5: ALVEOLAR-ARTERIAL (A-a) O2 GRADIENT SANDBOX (Ch. 42) ── */
export function renderAaGradientSandbox(containerEl) {
  const state = { age: 52, fio2: 21, pao2: 62, paco2: 34 };

  const update = () => {
    const pAO2 = (state.fio2 / 100) * (760 - 47) - (state.paco2 / 0.8);
    const aaGrad = Math.max(0, pAO2 - state.pao2);
    const expectedNormal = (state.age / 4) + 4;
    const isElevated = aaGrad > expectedNormal;

    let mech = '';
    let cls = 'info';
    if (state.pao2 >= 80 && !isElevated) {
      cls = 'ok';
      mech = `✅ <strong>Normal Oxygenation &amp; Gas Exchange:</strong> Measured A-a gradient (${aaGrad.toFixed(1)} mmHg) is within expected normal for age (${expectedNormal.toFixed(1)} mmHg).`;
    } else if (!isElevated && state.paco2 > 45) {
      cls = 'warn';
      mech = `⚠️ <strong>Pure Hypoventilation (Normal A-a Gradient):</strong> Elevated PaCO2 (${state.paco2} mmHg) with normal A-a gradient (${aaGrad.toFixed(1)} ≤ ${expectedNormal.toFixed(1)} mmHg). Think CNS depression (opioids), neuromuscular weakness, or chest wall restriction [Ch. 42].`;
    } else if (isElevated) {
      cls = 'danger';
      mech = `🚨 <strong>Elevated A-a Gradient (${aaGrad.toFixed(1)} mmHg &gt; expected ${expectedNormal.toFixed(1)}):</strong> Indicates intrinsic lung/vascular pathology — <strong>V/Q mismatch</strong> (PE, pneumonia, COPD — corrects with O2), <strong>Right-to-Left Shunt</strong> (ARDS/consolidation — refractory to 100% O2), or <strong>Diffusion defect</strong> [Ch. 42].`;
    } else {
      cls = 'info';
      mech = `💡 <strong>Low Inspired O2 / High Altitude Pattern:</strong> Normal A-a gradient (${aaGrad.toFixed(1)} mmHg) without hypercapnia.`;
    }

    containerEl.querySelector('#aa-pao2-out').textContent = `${pAO2.toFixed(1)} mmHg`;
    containerEl.querySelector('#aa-grad-out').textContent = `${aaGrad.toFixed(1)} mmHg`;
    containerEl.querySelector('#aa-norm-out').textContent = `≤ ${expectedNormal.toFixed(1)} mmHg`;
    const alertEl = containerEl.querySelector('#aa-alert');
    alertEl.className = `sandbox-clinical-alert alert-${cls}`;
    alertEl.innerHTML = mech;
  };

  containerEl.innerHTML = `
    <div class="bedside-sandbox-card">
      <div class="sandbox-header">
        <span class="sandbox-tag">🧪 Andrew Ng Bedside Sandbox · Ch. 42</span>
        <h4>Alveolar–Arterial (A–a) O₂ Gradient &amp; Hypoxemia Classifier</h4>
      </div>
      <div class="sandbox-controls-grid four-col">
        <div class="touch-stepper">
          <label>Age (yrs)</label>
          <div class="stepper-controls">
            <button type="button" class="step-btn" data-k="age" data-d="-4">−</button>
            <span id="val-age" class="stepper-val">52</span>
            <button type="button" class="step-btn" data-k="age" data-d="4">+</button>
          </div>
        </div>
        <div class="touch-stepper">
          <label>FiO₂ (%)</label>
          <div class="stepper-controls">
            <button type="button" class="step-btn" data-k="fio2" data-d="-5">−</button>
            <span id="val-fio2" class="stepper-val">21%</span>
            <button type="button" class="step-btn" data-k="fio2" data-d="5">+</button>
          </div>
        </div>
        <div class="touch-stepper">
          <label>PaO₂ (mmHg)</label>
          <div class="stepper-controls">
            <button type="button" class="step-btn" data-k="pao2" data-d="-4">−</button>
            <span id="val-pao2" class="stepper-val">62</span>
            <button type="button" class="step-btn" data-k="pao2" data-d="4">+</button>
          </div>
        </div>
        <div class="touch-stepper">
          <label>PaCO₂ (mmHg)</label>
          <div class="stepper-controls">
            <button type="button" class="step-btn" data-k="paco2" data-d="-4">−</button>
            <span id="val-paco2" class="stepper-val">34</span>
            <button type="button" class="step-btn" data-k="paco2" data-d="4">+</button>
          </div>
        </div>
      </div>
      <div class="sandbox-output-grid three-col">
        <div class="output-cell"><span class="out-lbl">Alveolar PAO₂</span><span id="aa-pao2-out" class="out-val">—</span></div>
        <div class="output-cell"><span class="out-lbl">Measured A–a Gradient</span><span id="aa-grad-out" class="out-val text-primary">—</span></div>
        <div class="output-cell"><span class="out-lbl">Age-Expected Normal</span><span id="aa-norm-out" class="out-val">—</span></div>
      </div>
      <div id="aa-alert" class="sandbox-clinical-alert"></div>
    </div>
  `;

  const bounds = { age: [18, 96], fio2: [21, 100], pao2: [30, 140], paco2: [16, 85] };
  containerEl.querySelectorAll('[data-k]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.k;
      const d = Number(btn.dataset.d);
      state[k] = Math.min(bounds[k][1], Math.max(bounds[k][0], state[k] + d));
      containerEl.querySelector(`#val-${k}`).textContent = k === 'fio2' ? `${state[k]}%` : `${state[k]}`;
      update();
    });
  });
  update();
}

/* ── 3. UNIT 8: ACID-BASE (AG, WINTER'S, DELTA) & HYPONATREMIA ODS SAFETY SANDBOX (Ch. 56 & 58) ── */
export function renderAcidBaseSodiumSandbox(containerEl) {
  const state = { na: 132, cl: 96, hco3: 14, alb: 2.4, paco2: 29 };

  const update = () => {
    const rawAG = state.na - (state.cl + state.hco3);
    const corrAG = rawAG + 2.5 * (4.0 - state.alb);
    const wintersMid = (1.5 * state.hco3) + 8;
    const wintersLow = wintersMid - 2;
    const wintersHigh = wintersMid + 2;

    let respStatus = 'Appropriate respiratory compensation';
    if (state.paco2 > wintersHigh) respStatus = '⚠️ Concurrent Primary Respiratory ACIDOSIS (CO₂ retention!)';
    else if (state.paco2 < wintersLow) respStatus = '⚠️ Concurrent Primary Respiratory ALKALOSIS (e.g., salicylates/sepsis!)';

    let deltaMsg = '';
    if (corrAG > 12) {
      const deltaAG = corrAG - 12;
      const deltaHCO3 = Math.max(1, 24 - state.hco3);
      const ratio = deltaAG / deltaHCO3;
      if (ratio < 1.0) deltaMsg = `Delta-Delta Ratio = ${ratio.toFixed(2)} (<1.0): Mixed HAGMA + Non-Anion-Gap Acidosis (e.g. diarrhea/RTA).`;
      else if (ratio > 2.0) deltaMsg = `Delta-Delta Ratio = ${ratio.toFixed(2)} (>2.0): Mixed HAGMA + Metabolic Alkalosis (or chronic resp acidosis).`;
      else deltaMsg = `Delta-Delta Ratio = ${ratio.toFixed(2)} (1.0–2.0): Pure High-Anion-Gap Metabolic Acidosis (GOLDMARK).`;
    } else {
      deltaMsg = `Corrected AG (${corrAG.toFixed(1)}) is normal (<=12): Hyperchloremic Non-Anion-Gap Metabolic Acidosis (diarrhea, RTA, saline).`;
    }

    const odsNote = state.na < 130
      ? `<br>🚨 <strong>ODS Guardrail (Ch. 56):</strong> Serum Na⁺ is ${state.na} mEq/L — NEVER raise Na⁺ faster than <strong>8–10 mEq/L in 24h</strong> (4–6 mEq/L in chronic malnutrition/alcoholism/cirrhosis)!`
      : '';

    containerEl.querySelector('#ab-raw-ag').textContent = `${rawAG.toFixed(1)} mEq/L`;
    containerEl.querySelector('#ab-corr-ag').textContent = `${corrAG.toFixed(1)} mEq/L`;
    containerEl.querySelector('#ab-winters').textContent = `${wintersLow.toFixed(0)}–${wintersHigh.toFixed(0)} mmHg`;
    const alertEl = containerEl.querySelector('#ab-alert');
    alertEl.className = `sandbox-clinical-alert alert-${corrAG > 14 || state.na < 130 ? 'danger' : 'info'}`;
    alertEl.innerHTML = `<strong>Winter's Verdict:</strong> ${respStatus}<br><strong>Acid-Base Synthesis:</strong> ${deltaMsg}${odsNote}`;
  };

  containerEl.innerHTML = `
    <div class="bedside-sandbox-card">
      <div class="sandbox-header">
        <span class="sandbox-tag">🧪 Andrew Ng Bedside Sandbox · Ch. 56 &amp; 58</span>
        <h4>Albumin-Corrected Anion Gap, Winter's Formula &amp; ODS Guardrail Lab</h4>
      </div>
      <div class="sandbox-controls-grid five-col">
        <div class="touch-stepper"><label>Na⁺</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="na" data-d="-2">−</button><span id="abv-na" class="stepper-val">132</span><button type="button" class="step-btn" data-k="na" data-d="2">+</button></div></div>
        <div class="touch-stepper"><label>Cl⁻</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="cl" data-d="-2">−</button><span id="abv-cl" class="stepper-val">96</span><button type="button" class="step-btn" data-k="cl" data-d="2">+</button></div></div>
        <div class="touch-stepper"><label>HCO₃⁻</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="hco3" data-d="-2">−</button><span id="abv-hco3" class="stepper-val">14</span><button type="button" class="step-btn" data-k="hco3" data-d="2">+</button></div></div>
        <div class="touch-stepper"><label>Albumin</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="alb" data-d="-0.4">−</button><span id="abv-alb" class="stepper-val">2.4</span><button type="button" class="step-btn" data-k="alb" data-d="0.4">+</button></div></div>
        <div class="touch-stepper"><label>PaCO₂</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="paco2" data-d="-2">−</button><span id="abv-paco2" class="stepper-val">29</span><button type="button" class="step-btn" data-k="paco2" data-d="2">+</button></div></div>
      </div>
      <div class="sandbox-output-grid three-col">
        <div class="output-cell"><span class="out-lbl">Uncorrected AG</span><span id="ab-raw-ag" class="out-val">—</span></div>
        <div class="output-cell"><span class="out-lbl">Albumin-Corrected AG</span><span id="ab-corr-ag" class="out-val text-primary">—</span></div>
        <div class="output-cell"><span class="out-lbl">Winter's Expected PaCO₂</span><span id="ab-winters" class="out-val">—</span></div>
      </div>
      <div id="ab-alert" class="sandbox-clinical-alert"></div>
    </div>
  `;

  const bounds = { na: [110, 160], cl: [70, 125], hco3: [4, 24], alb: [1.2, 4.8], paco2: [12, 70] };
  containerEl.querySelectorAll('[data-k]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.k;
      const d = Number(btn.dataset.d);
      state[k] = Number(Math.min(bounds[k][1], Math.max(bounds[k][0], state[k] + d)).toFixed(1));
      containerEl.querySelector(`#abv-${k}`).textContent = k === 'alb' ? state[k].toFixed(1) : `${Math.round(state[k])}`;
      update();
    });
  });
  update();
}

/* ── 4. UNIT 10: CLINICAL PHARMACOKINETICS & COCKCROFT-GAULT CrCl SANDBOX (Ch. 55 & 71) ── */
export function renderPharmacokineticsSandbox(containerEl) {
  const state = { age: 68, wt: 70, scr: 1.8, female: false, vd: 50, cl: 4 };

  const update = () => {
    const crclBase = ((140 - state.age) * state.wt) / (72 * state.scr);
    const crcl = state.female ? crclBase * 0.85 : crclBase;
    const tHalf = (0.693 * state.vd) / state.cl;
    const ssTime = tHalf * 4.5;
    const loadingDose = state.vd * 10; // target 10 mg/L -> mg

    let alertCls = 'ok';
    let msg = `✅ <strong>Harrison's Ch. 71 Pharmacokinetic Law:</strong> Loading Dose (<strong>${loadingDose.toFixed(0)} mg</strong> for target 10 mg/L) depends ONLY on Volume of Distribution (V<sub>d</sub>) — <strong>do NOT reduce loading dose in renal failure</strong>! Reduce Maintenance Dose or extend dosing interval instead.`;
    if (crcl < 30) {
      alertCls = 'danger';
      msg = `🚨 <strong>Severe Renal Impairment (CrCl ${crcl.toFixed(1)} mL/min):</strong> Keep standard Loading Dose (${loadingDose.toFixed(0)} mg, V<sub>d</sub>-dependent), but <strong>drastically reduce Maintenance Dose</strong> for renally cleared drugs (vancomycin, aminoglycosides, LMWH, digoxin, gabapentin) and avoid NSAIDs!`;
    } else if (crcl < 60) {
      alertCls = 'warn';
      msg = `⚠️ <strong>Moderate Renal Impairment (CrCl ${crcl.toFixed(1)} mL/min):</strong> Renal clearance is reduced; steady state takes 4–5 half-lives (<strong>${ssTime.toFixed(1)} h</strong>). Adjust maintenance dosing intervals for renally cleared drugs [Ch. 55, 71].`;
    }

    containerEl.querySelector('#pk-crcl').textContent = `${crcl.toFixed(1)} mL/min`;
    containerEl.querySelector('#pk-thalf').textContent = `${tHalf.toFixed(1)} h`;
    containerEl.querySelector('#pk-ss').textContent = `${ssTime.toFixed(0)} h`;
    const alertEl = containerEl.querySelector('#pk-alert');
    alertEl.className = `sandbox-clinical-alert alert-${alertCls}`;
    alertEl.innerHTML = msg;
  };

  containerEl.innerHTML = `
    <div class="bedside-sandbox-card">
      <div class="sandbox-header">
        <span class="sandbox-tag">🧪 Andrew Ng Bedside Sandbox · Ch. 55 &amp; 71</span>
        <h4>Pharmacokinetics (t½, Steady State, Loading Dose) &amp; Cockcroft–Gault CrCl</h4>
      </div>
      <div class="sandbox-controls-grid four-col">
        <div class="touch-stepper"><label>Age (yrs)</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="age" data-d="-5">−</button><span id="pkv-age" class="stepper-val">68</span><button type="button" class="step-btn" data-k="age" data-d="5">+</button></div></div>
        <div class="touch-stepper"><label>Weight (kg)</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="wt" data-d="-5">−</button><span id="pkv-wt" class="stepper-val">70</span><button type="button" class="step-btn" data-k="wt" data-d="5">+</button></div></div>
        <div class="touch-stepper"><label>Serum Cr</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="scr" data-d="-0.3">−</button><span id="pkv-scr" class="stepper-val">1.8</span><button type="button" class="step-btn" data-k="scr" data-d="0.3">+</button></div></div>
        <div class="touch-stepper"><label>Clearance (L/h)</label><div class="stepper-controls"><button type="button" class="step-btn" data-k="cl" data-d="-1">−</button><span id="pkv-cl" class="stepper-val">4</span><button type="button" class="step-btn" data-k="cl" data-d="1">+</button></div></div>
      </div>
      <div style="margin:0.65rem 0;">
        <button type="button" id="pk-sex-toggle" class="preset-btn">Sex Modifier: Male (×1.0) — Tap to switch to Female (×0.85)</button>
      </div>
      <div class="sandbox-output-grid three-col">
        <div class="output-cell"><span class="out-lbl">Cockcroft–Gault CrCl</span><span id="pk-crcl" class="out-val text-primary">—</span></div>
        <div class="output-cell"><span class="out-lbl">Half-Life (0.693×Vd/CL)</span><span id="pk-thalf" class="out-val">—</span></div>
        <div class="output-cell"><span class="out-lbl">Time to Steady State</span><span id="pk-ss" class="out-val">—</span></div>
      </div>
      <div id="pk-alert" class="sandbox-clinical-alert"></div>
    </div>
  `;

  const bounds = { age: [20, 95], wt: [40, 130], scr: [0.6, 6.0], cl: [1, 15] };
  containerEl.querySelectorAll('[data-k]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.k;
      const d = Number(btn.dataset.d);
      state[k] = Number(Math.min(bounds[k][1], Math.max(bounds[k][0], state[k] + d)).toFixed(1));
      containerEl.querySelector(`#pkv-${k}`).textContent = k === 'scr' ? state[k].toFixed(1) : `${Math.round(state[k])}`;
      update();
    });
  });
  containerEl.querySelector('#pk-sex-toggle').addEventListener('click', (e) => {
    state.female = !state.female;
    e.target.textContent = state.female
      ? 'Sex Modifier: Female (×0.85) — Tap to switch to Male (×1.0)'
      : 'Sex Modifier: Male (×1.0) — Tap to switch to Female (×0.85)';
    update();
  });
  update();
}
