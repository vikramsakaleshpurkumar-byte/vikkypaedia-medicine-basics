/**
 * Vikkypaedia v9.3 — Harrison's 22nd Edition Visuals Gallery (Tables, Flowcharts, Algorithms & Figures)
 * Displays extracted original Harrison's 22e Tables, Diagnostic Flowcharts, Algorithms & Figures
 * with category filter pills, tap-to-zoom full-screen lightbox, and unit interactive branching algorithm.
 */

import { AlgorithmViewer } from './algorithm-viewer.js';
import { UNIT_ALGO_MAP } from '../data/algorithms.js';

export class VisualGallery {
  constructor(containerEl, visualsList, chapterObj, unitIndex) {
    this.container = containerEl;
    this.allVisuals = visualsList || [];
    this.chapter = chapterObj;
    this.unitIndex = unitIndex;
    this.filterKind = 'ALL'; // 'ALL' | 'Table' | 'Algorithm / Flowchart' | 'Figure'
  }

  escapeHtml(str = '') {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  render() {
    if (!this.container) return;
    const tablesCnt = this.allVisuals.filter((v) => v.kind === 'Table').length;
    const algosCnt = this.allVisuals.filter((v) => v.kind === 'Algorithm / Flowchart').length;
    const figsCnt = this.allVisuals.filter((v) => v.kind === 'Figure').length;

    const filtered = this.filterKind === 'ALL'
      ? this.allVisuals
      : this.allVisuals.filter((v) => v.kind === this.filterKind);

    this.container.innerHTML = `
      <div class="visuals-shell">
        <div class="visuals-header-card">
          <div>
            <span class="sandbox-tag">📊 Original Harrison's 22nd Edition Visuals · ${this.chapter?.label || ''}</span>
            <h3 class="visuals-title">${this.chapter?.title || 'Clinical Tables, Flowcharts & Figures'}</h3>
            <p class="visuals-sub">Tap any Table, Diagnostic Flowchart, Algorithm, or Clinical Figure below to open full-screen zoom mode for crisp bedside revision.</p>
          </div>
          <div class="visuals-filter-pills">
            <button type="button" class="preset-btn ${this.filterKind === 'ALL' ? 'active' : ''}" data-vkind="ALL">All (${this.allVisuals.length})</button>
            ${tablesCnt ? `<button type="button" class="preset-btn ${this.filterKind === 'Table' ? 'active' : ''}" data-vkind="Table">📋 Tables (${tablesCnt})</button>` : ''}
            ${algosCnt ? `<button type="button" class="preset-btn ${this.filterKind === 'Algorithm / Flowchart' ? 'active' : ''}" data-vkind="Algorithm / Flowchart">🔀 Flowcharts / Algos (${algosCnt})</button>` : ''}
            ${figsCnt ? `<button type="button" class="preset-btn ${this.filterKind === 'Figure' ? 'active' : ''}" data-vkind="Figure">🖼️ Figures (${figsCnt})</button>` : ''}
          </div>
        </div>

        ${filtered.length ? `
          <div class="visuals-grid">
            ${filtered.map((v, idx) => `
              <figure class="visual-card" data-vis-idx="${idx}">
                <div class="visual-card-top">
                  <span class="vis-code-badge vis-kind-${v.kind === 'Table' ? 'table' : v.kind === 'Figure' ? 'fig' : 'algo'}">${this.escapeHtml(v.code)}</span>
                  <span class="vis-kind-tag">${this.escapeHtml(v.kind)} · PDF p.${v.page}</span>
                </div>
                <button type="button" class="vis-img-btn" data-zoom-src="${this.escapeHtml(v.src)}" data-zoom-code="${this.escapeHtml(v.code)}" data-zoom-cap="${this.escapeHtml(v.caption)}" aria-label="Zoom ${this.escapeHtml(v.code)}">
                  <img src="${this.escapeHtml(v.src)}" alt="${this.escapeHtml(v.code + ' ' + v.caption)}" loading="lazy" class="vis-thumb-img">
                  <span class="vis-zoom-pill">🔍 Tap to Zoom</span>
                </button>
                <figcaption class="vis-caption">
                  <strong>${this.escapeHtml(v.code)}:</strong> ${this.escapeHtml(v.caption || 'Harrison’s 22nd Edition Clinical Visual')}
                </figcaption>
              </figure>
            `).join('')}
          </div>
        ` : `
          <div class="visuals-empty-box">
            <p><strong>No standalone print figures/tables in ${this.chapter?.label}</strong> — explore the interactive chapter Mind Map and interactive branching Clinical Algorithm directly below!</p>
          </div>
        `}

        <div class="visuals-interactive-algo">
          <div class="vis-algo-banner">
            <span class="sandbox-tag">🗺️ Interactive Branching Bedside Algorithm</span>
            <h4>Click Through Step-by-Step Clinical Decisions for Unit ${this.unitIndex + 1}</h4>
          </div>
          <div id="vis-algo-mount"></div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('[data-vkind]').forEach((b) => {
      b.addEventListener('click', () => {
        this.filterKind = b.dataset.vkind;
        this.render();
      });
    });

    this.container.querySelectorAll('[data-zoom-src]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.app?.openImageLightbox(btn.dataset.zoomSrc, btn.dataset.zoomCode, btn.dataset.zoomCap);
      });
    });

    const algoKey = UNIT_ALGO_MAP[this.unitIndex] || 'chestPain';
    new AlgorithmViewer(this.container.querySelector('#vis-algo-mount'), algoKey).render();
  }
}
