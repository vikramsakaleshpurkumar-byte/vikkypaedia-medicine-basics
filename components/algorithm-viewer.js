/**
 * Vikkypaedia v9.1 — Interactive Harrison's 22e Bedside Algorithm Viewer
 */

import { algorithms } from '../data/algorithms.js';

export class AlgorithmViewer {
  constructor(containerEl, initialKey = 'chestPain') {
    this.containerEl = containerEl;
    this.keys = Object.keys(algorithms);
    this.currentKey = algorithms[initialKey] ? initialKey : this.keys[0];
    this.history = [];
    this.currentNodeId = algorithms[this.currentKey].startNode;
  }

  get currentAlgo() {
    return algorithms[this.currentKey];
  }

  selectAlgo(key) {
    if (!algorithms[key]) return;
    this.currentKey = key;
    this.history = [];
    this.currentNodeId = this.currentAlgo.startNode;
    this.render();
  }

  start() {
    this.history = [];
    this.currentNodeId = this.currentAlgo.startNode;
    this.render();
  }

  render() {
    if (!this.containerEl) return;
    const node = this.currentAlgo.nodes[this.currentNodeId];

    const switcher = this.keys.map((k) => `
      <button type="button" class="preset-btn ${k === this.currentKey ? 'active' : ''}" data-algo-key="${k}">
        ${algorithms[k].title.split('—')[0].split('(')[0].trim()}
      </button>
    `).join('');

    const historyHtml = this.history.length
      ? `<div class="algo-history">${this.history.map((id, i) => `
          <div class="algo-history-node">
            <span class="step-num">${i + 1}</span>
            <span class="step-text">${this.currentAlgo.nodes[id].text.replace(/\n/g, '<br>')}</span>
          </div>
          <div class="algo-arrow" aria-hidden="true">↓</div>
        `).join('')}</div>`
      : '';

    const optionsHtml = node.options?.length
      ? `<div class="algo-options">${node.options.map((opt) => `
          <button type="button" class="algo-btn" data-next="${opt.next}">${opt.text}</button>
        `).join('')}</div>`
      : `<div class="algo-terminal-tag">✅ End of Clinical Pathway — Tap Restart or switch algorithm above.</div>`;

    this.containerEl.innerHTML = `
      <div class="algorithm-viewer">
        <div class="algo-switcher">${switcher}</div>
        <h4 class="algo-title">${this.currentAlgo.title}</h4>
        <div class="algo-body">
          ${historyHtml}
          <div class="algo-current-node type-${node.type}">
            <span class="algo-node-tag">${node.type === 'decision' ? 'DECISION BRANCH' : 'IMMEDIATE CLINICAL ACTION'}</span>
            <div class="node-text">${node.text.replace(/\n/g, '<br>')}</div>
            ${optionsHtml}
          </div>
        </div>
        <div class="algo-footer">
          <button type="button" class="btn-clear-tray" id="algo-restart">↺ Restart This Algorithm</button>
        </div>
      </div>
    `;

    this.containerEl.querySelectorAll('[data-algo-key]').forEach((b) => {
      b.addEventListener('click', () => this.selectAlgo(b.dataset.algoKey));
    });
    this.containerEl.querySelectorAll('.algo-btn').forEach((b) => {
      b.addEventListener('click', () => {
        this.history.push(this.currentNodeId);
        this.currentNodeId = b.dataset.next;
        this.render();
      });
    });
    this.containerEl.querySelector('#algo-restart')?.addEventListener('click', () => this.start());
  }
}
