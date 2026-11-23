/**
 * Vikkypaedia v9.1 — Interactive Internal Medicine ER & Ward Simulator
 * 3 Selectable Branching Cases grounded in Harrison's 22nd Edition
 */

import { simCases } from '../data/sim-cases.js';
import { REFERENCES } from '../data/references.js';

export class ClinicalSimulator {
  constructor(containerEl, initialCaseId = 'aortic_dissection_trap') {
    this.container = containerEl;
    this.caseKeys = Object.keys(simCases);
    this.currentCaseId = simCases[initialCaseId] ? initialCaseId : this.caseKeys[0];
    this.currentNodeId = 'start';
    this.completedCases = new Set(JSON.parse(localStorage.getItem('vp-med-basics-sim-done') || '[]'));
    this.score = 100;
  }

  get caseData() {
    return simCases[this.currentCaseId];
  }

  renderRefChips(refIds = []) {
    if (!refIds?.length) return '';
    return `
      <div class="onsite-cite-bar">
        <span class="onsite-cite-label">📖 Harrison's 22e Evidence:</span>
        ${refIds.map((id) => {
          const ref = REFERENCES.find((r) => r.id === id);
          return ref ? `<button type="button" class="cite-chip" data-ref-id="${ref.id}">[Ref ${ref.id}: ${ref.tag}]</button>` : '';
        }).join('')}
      </div>
    `;
  }

  render() {
    if (!this.container) return;
    const tabsHTML = this.caseKeys.map((key, idx) => {
      const c = simCases[key];
      const isDone = this.completedCases.has(key);
      const isActive = key === this.currentCaseId;
      return `
        <button type="button" class="sim-case-tab ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" data-case-key="${key}">
          <span class="sim-tab-num">${isDone ? '✓' : idx + 1}</span>
          <div class="sim-tab-text">
            <span class="sim-tab-badge">${c.badge}</span>
            <span class="sim-tab-title">${c.patient.name} (${c.patient.age})</span>
          </div>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="sim-master-header">
        <div>
          <span class="sim-eyebrow">🏥 VIRTUAL INTERNAL MEDICINE ER &amp; WARD SIMULATOR</span>
          <h2 class="sim-main-heading">Branching Clinical Decision Lab (${this.completedCases.size}/${this.caseKeys.length} Mastered)</h2>
        </div>
        <div class="sim-score-pill">
          <span>Clinical Precision</span>
          <strong id="sim-score-val">${this.score}%</strong>
        </div>
      </div>

      <div class="sim-case-tabs">${tabsHTML}</div>

      <div class="sim-wrapper">
        <div class="sim-monitor-panel">
          <div class="sim-patient-header">
            <div class="sim-avatar">${this.caseData.patient.avatar}</div>
            <div class="sim-patient-info">
              <span class="sim-setting-tag">${this.caseData.patient.setting}</span>
              <h3>${this.caseData.patient.name}</h3>
              <span>Age: ${this.caseData.patient.age} &bull; Weight: ${this.caseData.patient.weight}</span>
            </div>
          </div>

          <div class="sim-vitals-grid" id="sim-vitals"></div>

          <div class="sim-labs-box">
            <h4>🧪 Bedside Exam, ECG &amp; Stat Labs</h4>
            <ul id="sim-labs-list"></ul>
          </div>

          <div class="sim-history">
            <h4>📋 Presenting Triage Summary</h4>
            <p>${this.caseData.intro}</p>
            ${this.renderRefChips(this.caseData.citations)}
          </div>
        </div>

        <div class="sim-action-panel">
          <div class="sim-stage-banner" id="sim-stage-banner"></div>
          <div id="sim-narrative" class="sim-narrative"></div>
          <div id="sim-feedback" class="sim-feedback" style="display:none;"></div>
          <div id="sim-choices" class="sim-choices"></div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.sim-case-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.currentCaseId = tab.dataset.caseKey;
        this.currentNodeId = 'start';
        this.score = 100;
        this.render();
      });
    });
    this.updateNode();
  }

  updateNode() {
    const node = this.caseData.nodes[this.currentNodeId];
    if (!node) return;

    const stageEl = this.container.querySelector('#sim-stage-banner');
    if (stageEl) stageEl.innerHTML = `<span class="sim-stage-pill">${node.stage || 'Decision Point'}</span>`;

    const vitalsEl = this.container.querySelector('#sim-vitals');
    if (vitalsEl && node.vitals) {
      vitalsEl.innerHTML = `
        <div class="vital-box hr"><span class="v-label">HR (ECG)</span><span class="v-val">${node.vitals.hr}</span><span class="v-unit">bpm</span></div>
        <div class="vital-box bp"><span class="v-label">NIBP</span><span class="v-val v-sm">${node.vitals.bp}</span><span class="v-unit">mmHg</span></div>
        <div class="vital-box pp"><span class="v-label">PULSE PRESS</span><span class="v-val v-sm">${node.vitals.pp}</span><span class="v-unit">perfusion</span></div>
        <div class="vital-box crt"><span class="v-label">CAP REFILL</span><span class="v-val">${node.vitals.crt}</span><span class="v-unit">target &lt;2s</span></div>
        <div class="vital-box spo2"><span class="v-label">SpO₂</span><span class="v-val">${node.vitals.spo2}</span><span class="v-unit">oximetry</span></div>
        <div class="vital-box temp"><span class="v-label">TEMP</span><span class="v-val">${node.vitals.temp}</span><span class="v-unit">oral/core</span></div>
      `;
    }

    const labsEl = this.container.querySelector('#sim-labs-list');
    if (labsEl) labsEl.innerHTML = (node.labs || []).map((l) => `<li>${l}</li>`).join('');

    const scoreEl = this.container.querySelector('#sim-score-val');
    if (scoreEl) scoreEl.textContent = `${Math.max(40, Math.min(100, this.score))}%`;

    const narrEl = this.container.querySelector('#sim-narrative');
    if (narrEl) narrEl.innerHTML = `<p>${node.narrative}</p>`;

    const choicesEl = this.container.querySelector('#sim-choices');
    const fbEl = this.container.querySelector('#sim-feedback');

    if (node.isEnd) {
      this.completedCases.add(this.currentCaseId);
      try {
        localStorage.setItem('vp-med-basics-sim-done', JSON.stringify([...this.completedCases]));
      } catch {}
      choicesEl.innerHTML = `
        <div class="sim-complete-banner">
          <h4>🏆 Simulation Completed — Precision Score: ${Math.max(40, this.score)}%</h4>
          <div class="sim-end-btns">
            <button type="button" class="sim-restart-btn">↺ Replay Case</button>
            <button type="button" class="sim-next-case-btn">Next Clinical Case →</button>
          </div>
        </div>
      `;
      choicesEl.querySelector('.sim-restart-btn')?.addEventListener('click', () => {
        this.currentNodeId = 'start';
        this.score = 100;
        this.render();
      });
      choicesEl.querySelector('.sim-next-case-btn')?.addEventListener('click', () => {
        const nextIdx = (this.caseKeys.indexOf(this.currentCaseId) + 1) % this.caseKeys.length;
        this.currentCaseId = this.caseKeys[nextIdx];
        this.currentNodeId = 'start';
        this.score = 100;
        this.render();
      });
    } else {
      choicesEl.innerHTML = (node.choices || []).map((c, idx) => `
        <button type="button" class="sim-choice-btn" data-choice-idx="${idx}">
          <span class="choice-idx">${String.fromCharCode(65 + idx)}</span>
          <span>${c.text}</span>
        </button>
      `).join('');

      choicesEl.querySelectorAll('.sim-choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const c = node.choices[parseInt(btn.dataset.choiceIdx, 10)];
          this.score = Math.max(40, Math.min(100, this.score + (c.deltaScore || 0)));
          if (fbEl) {
            fbEl.style.display = 'block';
            fbEl.className = `sim-feedback fb-${c.feedbackType || 'info'}`;
            fbEl.innerHTML = `<strong>Clinical Consequence:</strong> ${c.feedback}`;
          }
          this.currentNodeId = c.next;
          this.updateNode();
        });
      });
    }

    this.container.querySelectorAll('.cite-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        window.app?.showSingleReferenceModal(parseInt(chip.dataset.refId, 10));
      });
    });
  }
}
