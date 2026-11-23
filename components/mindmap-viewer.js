/**
 * Vikkypaedia v9.2 — Interactive Visual Mind Map Viewer
 * Zero-dependency SVG radial/branch Mind Map + Mobile Expandable Concept Tree toggle
 * Dedicated mind map for every single Harrison's 22nd Edition chapter (all 30 chapters).
 */

export class MindMapViewer {
  constructor(containerEl, chapterObj) {
    this.container = containerEl;
    this.chapter = chapterObj;
    this.mode = 'visual'; // 'visual' (SVG) | 'tree' (mobile cards)
    this.zoom = 100;
    this.activeBranchIdx = null;
  }

  render() {
    if (!this.container || !this.chapter?.mindMap) return;
    const mm = this.chapter.mindMap;
    const branches = mm.branches || [];

    this.container.innerHTML = `
      <div class="mindmap-shell">
        <div class="mindmap-toolbar">
          <div>
            <span class="sandbox-tag">🧠 Interactive Chapter Mind Map · ${this.chapter.label}</span>
            <h4 class="mm-title">${mm.center}</h4>
            <p class="mm-sub">${mm.subtitle || this.chapter.title} — Tap any branch node to inspect high-yield revision pearls</p>
          </div>
          <div class="mm-controls">
            <button type="button" class="preset-btn ${this.mode === 'visual' ? 'active' : ''}" data-mm-mode="visual">🗺️ Visual Map</button>
            <button type="button" class="preset-btn ${this.mode === 'tree' ? 'active' : ''}" data-mm-mode="tree">🌿 Concept Tree</button>
            ${this.mode === 'visual' ? `
              <button type="button" class="preset-btn" data-mm-zoom="-15" aria-label="Zoom out">−</button>
              <span class="mm-zoom-lbl">${this.zoom}%</span>
              <button type="button" class="preset-btn" data-mm-zoom="15" aria-label="Zoom in">+</button>
            ` : ''}
          </div>
        </div>

        ${this.mode === 'visual' ? this.renderVisualSVG(mm, branches) : this.renderTreeCards(mm, branches)}

        ${this.activeBranchIdx !== null && branches[this.activeBranchIdx] ? `
          <div class="mm-focus-card" style="border-left-color:${branches[this.activeBranchIdx].color};">
            <div class="mm-focus-top">
              <strong style="color:${branches[this.activeBranchIdx].color};">📌 ${branches[this.activeBranchIdx].title} (${this.chapter.label})</strong>
              <button type="button" class="mm-focus-close" id="mm-close-focus" aria-label="Close highlight">✕</button>
            </div>
            <ul>${branches[this.activeBranchIdx].items.map((it) => `<li>${it}</li>`).join('')}</ul>
          </div>
        ` : ''}
      </div>
    `;

    this.container.querySelectorAll('[data-mm-mode]').forEach((b) => {
      b.addEventListener('click', () => { this.mode = b.dataset.mmMode; this.render(); });
    });
    this.container.querySelectorAll('[data-mm-zoom]').forEach((b) => {
      b.addEventListener('click', () => {
        this.zoom = Math.min(145, Math.max(70, this.zoom + Number(b.dataset.mmZoom)));
        this.render();
      });
    });
    this.container.querySelectorAll('[data-branch-idx]').forEach((node) => {
      node.addEventListener('click', () => {
        const idx = parseInt(node.dataset.branchIdx, 10);
        this.activeBranchIdx = this.activeBranchIdx === idx ? null : idx;
        this.render();
      });
    });
    this.container.querySelector('#mm-close-focus')?.addEventListener('click', () => {
      this.activeBranchIdx = null;
      this.render();
    });
  }

  escapeXml(str = '') {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  wrapSvgText(text, maxChars = 24) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = (cur + ' ' + w).trim();
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }

  renderVisualSVG(mm, branches) {
    // 4-quadrant balanced horizontal mind-map canvas (960 x 540)
    const W = 960;
    const H = 540;
    const cx = W / 2;
    const cy = H / 2;

    // Positions for up to 4 branches (top-left, top-right, bottom-left, bottom-right)
    const layouts = [
      { bx: 245, by: 135, side: -1 },
      { bx: 715, by: 135, side: 1 },
      { bx: 245, by: 405, side: -1 },
      { bx: 715, by: 405, side: 1 }
    ];

    let paths = '';
    let nodes = '';

    branches.slice(0, 4).forEach((br, idx) => {
      const pos = layouts[idx];
      const color = br.color || '#0f766e';
      const isFocused = this.activeBranchIdx === idx;

      // Smooth cubic bezier from center to branch hub
      const ctrlX = cx + pos.side * 120;
      paths += `<path d="M ${cx} ${cy} C ${ctrlX} ${cy}, ${ctrlX} ${pos.by}, ${pos.bx} ${pos.by}" fill="none" stroke="${color}" stroke-width="${isFocused ? 5 : 3.2}" stroke-linecap="round" opacity="${isFocused ? 1 : 0.82}"/>`;

      // Branch leaf items stacked cleanly near each hub
      const items = br.items || [];
      const startY = pos.by - ((items.length - 1) * 44) / 2;
      const leafX = pos.side < 0 ? 18 : 776;
      const leafW = 168;

      items.forEach((item, li) => {
        const ly = startY + li * 44;
        const anchorX = pos.side < 0 ? leafX + leafW : leafX;
        const hubEdgeX = pos.bx + pos.side * 72;
        paths += `<path d="M ${hubEdgeX} ${pos.by} C ${(hubEdgeX + anchorX) / 2} ${pos.by}, ${(hubEdgeX + anchorX) / 2} ${ly}, ${anchorX} ${ly}" fill="none" stroke="${color}" stroke-width="1.8" opacity="0.55"/>`;

        const lines = this.wrapSvgText(item, 22);
        nodes += `
          <g class="mm-svg-node" data-branch-idx="${idx}" style="cursor:pointer;">
            <rect x="${leafX}" y="${ly - 17}" width="${leafW}" height="34" rx="8" fill="var(--bg-surface)" stroke="${color}" stroke-width="${isFocused ? 2.2 : 1.3}"/>
            ${lines.length === 1
              ? `<text x="${leafX + leafW / 2}" y="${ly + 4}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--text-primary)">${this.escapeXml(lines[0])}</text>`
              : `<text x="${leafX + leafW / 2}" y="${ly - 3}" text-anchor="middle" font-size="9.8" font-weight="600" fill="var(--text-primary)">${this.escapeXml(lines[0])}</text>
                 <text x="${leafX + leafW / 2}" y="${ly + 10}" text-anchor="middle" font-size="9.8" font-weight="600" fill="var(--text-primary)">${this.escapeXml(lines[1])}</text>`
            }
          </g>
        `;
      });

      // Branch hub pill
      const bLines = this.wrapSvgText(br.title, 18);
      nodes += `
        <g class="mm-svg-hub" data-branch-idx="${idx}" style="cursor:pointer;">
          <rect x="${pos.bx - 74}" y="${pos.by - 24}" width="148" height="48" rx="14" fill="${color}" stroke="${isFocused ? '#ffffff' : 'none'}" stroke-width="2.5"/>
          ${bLines.length === 1
            ? `<text x="${pos.bx}" y="${pos.by + 5}" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff">${this.escapeXml(bLines[0])}</text>`
            : `<text x="${pos.bx}" y="${pos.by - 3}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#ffffff">${this.escapeXml(bLines[0])}</text>
               <text x="${pos.bx}" y="${pos.by + 12}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#ffffff">${this.escapeXml(bLines[1])}</text>`
          }
        </g>
      `;
    });

    // Central Harrison's Chapter Hub
    const cLines = this.wrapSvgText(mm.center, 20);
    const centerNode = `
      <g>
        <rect x="${cx - 98}" y="${cy - 38}" width="196" height="76" rx="18" fill="#061326" stroke="#14b8a6" stroke-width="3.2"/>
        ${cLines.length === 1
          ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13.5" font-weight="900" fill="#ffffff">${this.escapeXml(cLines[0])}</text>`
          : `<text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">${this.escapeXml(cLines[0])}</text>
             <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#5eead4">${this.escapeXml(cLines[1])}</text>`
        }
      </g>
    `;

    return `
      <div class="mm-canvas-scroll" tabindex="0" role="region" aria-label="Interactive Mind Map for ${this.chapter.title}">
        <svg viewBox="0 0 ${W} ${H}" class="mm-svg" style="width:${this.zoom}%;min-width:680px;height:auto;display:block;margin:0 auto;">
          ${paths}
          ${nodes}
          ${centerNode}
        </svg>
      </div>
    `;
  }

  renderTreeCards(mm, branches) {
    return `
      <div class="mm-tree-grid">
        ${branches.map((br, idx) => `
          <div class="mm-tree-card" style="border-top:4px solid ${br.color};">
            <h5 style="color:${br.color};margin:0 0 0.55rem;font-size:0.96rem;">${idx + 1}. ${br.title}</h5>
            <ul class="mm-tree-list">
              ${(br.items || []).map((it) => `<li>${it}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  }
}
