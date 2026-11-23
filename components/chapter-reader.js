/**
 * Vikkypaedia v9.5 — Full Harrison's 22nd Edition Chapter Reader
 * Features:
 * - Clean true two-column textbook reading order (zero scrambled columns!)
 * - Inline embedded Harrison's 22e Tables, Flowcharts, Algorithms & Figures right inside the prose
 * - Clickable hyperlink pills on EVERY mention of "Fig. X-Y" / "Figure X-Y" / "Table X-Y" in the text -> instant Zoom Lightbox!
 * - Live in-chapter search & highlight, Section Jump TOC, A-/A+ font sizing, and 60-Second Quick Revision toggle.
 */

export class ChapterReader {
  constructor(containerEl, chapterObj, options = {}) {
    this.container = containerEl;
    this.chapter = chapterObj;
    this.visuals = options.visuals || [];
    this.visualById = new Map(this.visuals.map((v) => [v.id, v]));
    this.visualByCode = new Map();
    this.visuals.forEach((v) => {
      const norm = v.code.toUpperCase().replace(/\s+/g, ' ');
      if (!this.visualByCode.has(norm)) this.visualByCode.set(norm, v);
    });
    this.onToggleRead = options.onToggleRead || (() => {});
    this.onOpenVisualsTab = options.onOpenVisualsTab || (() => {});
    this.isRead = Boolean(options.isRead);
    this.viewMode = 'full';
    this.searchTerm = '';
    this.fontSize = Number(localStorage.getItem('vp-reader-font-px') || 16);
  }

  escapeHtml(str = '') {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * Formats paragraph text with search highlighting AND clickable hyperlinks
   * for every Figure/Table reference (e.g., "Fig. 51-2", "Table 15-1", "FIGURE 58-1").
   */
  formatParagraphHtml(rawText, query) {
    let html = this.escapeHtml(rawText);

    // 1. Highlight search matches first (before injecting HTML buttons)
    if (query && query.trim().length >= 2) {
      const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="reader-hl">$1</mark>');
    }

    // 2. Linkify EVERY "Fig. X-Y", "Figure X-Y", "Table X-Y" mention that matches an extracted visual!
    const allVisuals = window.MedApp?.data?.visuals || this.visuals;
    const findVisual = (kindWord, chStr, numStr) => {
      const kind = kindWord.toLowerCase().startsWith('tab') ? 'TABLE' : 'FIGURE';
      const code = `${kind} ${parseInt(chStr, 10)}-${parseInt(numStr, 10)}`;
      return this.visualByCode.get(code) || allVisuals.find((v) => v.code.toUpperCase() === code);
    };

    html = html.replace(
      /\b(Figures?|Figs?\.|Tables?)\s*(\d{1,2})[-–](\d{1,2})\b/gi,
      (full, kindWord, chStr, numStr) => {
        const vis = findVisual(kindWord, chStr, numStr);
        if (!vis) return full;
        const icon = vis.kind === 'Table' ? '📋' : vis.kind === 'Algorithm / Flowchart' ? '🔀' : '🖼️';
        return `<button type="button" class="inline-vis-link" data-zoom-src="${this.escapeHtml(vis.src)}" data-zoom-code="${this.escapeHtml(vis.code)}" data-zoom-cap="${this.escapeHtml(vis.caption)}" title="Tap to open ${this.escapeHtml(vis.code)} in zoom lightbox">${icon} ${full} 🔍</button>`;
      }
    );

    return html;
  }

  renderInlineVisualCard(vis) {
    if (!vis) return '';
    return `
      <figure class="inline-figure-card">
        <div class="visual-card-top">
          <span class="vis-code-badge vis-kind-${vis.kind === 'Table' ? 'table' : vis.kind === 'Figure' ? 'fig' : 'algo'}">${this.escapeHtml(vis.code)}</span>
          <span class="vis-kind-tag">${this.escapeHtml(vis.kind)} · Harrison's 22e (p.${vis.page})</span>
        </div>
        <button type="button" class="vis-img-btn" data-zoom-src="${this.escapeHtml(vis.src)}" data-zoom-code="${this.escapeHtml(vis.code)}" data-zoom-cap="${this.escapeHtml(vis.caption)}" aria-label="Zoom ${this.escapeHtml(vis.code)}">
          <img src="${this.escapeHtml(vis.src)}" alt="${this.escapeHtml(vis.code + ' ' + vis.caption)}" loading="lazy" class="vis-thumb-img inline-fig-img">
          <span class="vis-zoom-pill">🔍 Tap to Zoom Full Screen</span>
        </button>
        <figcaption class="vis-caption">
          <strong>${this.escapeHtml(vis.code)}:</strong> ${this.escapeHtml(vis.caption)}
        </figcaption>
      </figure>
    `;
  }

  render() {
    if (!this.container || !this.chapter) return;
    const ch = this.chapter;
    const q = this.searchTerm.trim().toLowerCase();

    let matchCount = 0;
    const renderedSections = (ch.sections || []).map((sec) => {
      const paras = (sec.paragraphs || []).filter((p) => {
        if (p.startsWith('[[VISUAL:')) {
          if (!q) return true;
          const vId = p.slice(9, -2);
          const vis = this.visualById.get(vId);
          const ok = vis && `${vis.code} ${vis.caption}`.toLowerCase().includes(q);
          if (ok) matchCount++;
          return ok;
        }
        if (!q) return true;
        const ok = p.toLowerCase().includes(q) || sec.heading.toLowerCase().includes(q);
        if (ok) matchCount++;
        return ok;
      });
      return { ...sec, paras };
    }).filter((s) => s.paras.length > 0);

    const visualsStripHtml = this.visuals.length
      ? `<div class="reader-vis-strip">
           <div class="reader-vis-strip-top">
             <span class="reader-toc-lbl" style="margin:0;">📊 Quick Visual Index for ${ch.label} (${this.visuals.length} Tables, Figures &amp; Flowcharts — also embedded inline below!)</span>
             <button type="button" class="reader-toc-pill" id="reader-open-vis-tab">Open Full Visuals &amp; Algo Tab →</button>
           </div>
           <div class="reader-vis-scroller">
             ${this.visuals.map((v) => `
               <button type="button" class="reader-vis-mini" data-zoom-src="${this.escapeHtml(v.src)}" data-zoom-code="${this.escapeHtml(v.code)}" data-zoom-cap="${this.escapeHtml(v.caption)}">
                 <img src="${this.escapeHtml(v.src)}" alt="${this.escapeHtml(v.code)}" loading="lazy">
                 <span class="mini-code">${this.escapeHtml(v.code)}</span>
                 <span class="mini-cap">${this.escapeHtml(v.caption.slice(0, 58))}${v.caption.length > 58 ? '…' : ''}</span>
               </button>
             `).join('')}
           </div>
         </div>`
      : '';

    const tocHtml = (ch.sections || []).length > 1
      ? `<div class="reader-toc">
           <span class="reader-toc-lbl">Jump to Section:</span>
           <div class="reader-toc-pills">
             ${ch.sections.map((s) => `<button type="button" class="reader-toc-pill" data-jump-sec="${s.id}">${this.escapeHtml(s.heading)}</button>`).join('')}
           </div>
         </div>`
      : '';

    this.container.innerHTML = `
      <div class="chapter-reader-shell">
        <div class="reader-top-card">
          <div class="reader-meta-row">
            <span class="sandbox-tag">📖 Harrison's 22nd Edition · ${ch.label} (${ch.pages})</span>
            <span class="reader-stats">${ch.wordCount.toLocaleString()} words &middot; ~${ch.readMinutes} min &middot; ${this.visuals.length} Inline Tables/Figs</span>
          </div>
          <h3 class="reader-title">${this.escapeHtml(ch.title)}</h3>
          <p class="reader-authors">Authors: ${this.escapeHtml(ch.authors)} &middot; <em>Tip: Tap any highlighted Fig./Table link or inline figure to zoom!</em></p>

          <div class="reader-controls-bar">
            <div class="reader-mode-group">
              <button type="button" class="preset-btn ${this.viewMode === 'full' ? 'active' : ''}" data-rmode="full">📖 Full Chapter + Inline Visuals</button>
              <button type="button" class="preset-btn ${this.viewMode === 'revision' ? 'active' : ''}" data-rmode="revision">⚡ 60-Sec Quick Revision</button>
            </div>
            <div class="reader-font-group">
              <button type="button" class="preset-btn" id="reader-font-dec" aria-label="Decrease font size">A−</button>
              <span class="reader-font-lbl">${this.fontSize}px</span>
              <button type="button" class="preset-btn" id="reader-font-inc" aria-label="Increase font size">A+</button>
              <button type="button" class="preset-btn ${this.isRead ? 'active' : ''}" id="reader-mark-done">
                ${this.isRead ? '✓ Chapter Read' : '○ Mark Read'}
              </button>
            </div>
          </div>

          ${this.viewMode === 'full' ? `
            <div class="reader-search-row">
              <input type="search" id="reader-search-input" class="ref-search-input"
                value="${this.escapeHtml(this.searchTerm)}"
                placeholder="Search inside ${ch.label} (e.g., algorithm, treatment, Table, Figure)..."
                aria-label="Search inside full chapter">
              ${q ? `<span class="reader-match-badge">${matchCount} matching item${matchCount === 1 ? '' : 's'}</span>` : ''}
            </div>
          ` : ''}
        </div>

        ${visualsStripHtml}

        ${this.viewMode === 'revision' ? `
          <div class="quick-rev-box">
            <h4>⚡ 60-Second High-Yield Revision Sheet — ${ch.label}: ${this.escapeHtml(ch.title)}</h4>
            <ul class="quick-rev-list">
              ${(ch.quickRevision || []).map((b) => `<li>${this.escapeHtml(b)}</li>`).join('')}
            </ul>
            <div class="quick-rev-cta">
              <button type="button" class="preset-btn active" data-rmode="full">📖 Switch to Complete Chapter + Inline Visuals →</button>
            </div>
          </div>
        ` : `
          ${tocHtml}
          <div class="reader-prose" style="font-size:${this.fontSize}px;">
            ${renderedSections.length ? renderedSections.map((sec) => `
              <section id="${sec.id}" class="reader-section">
                <h4 class="reader-sec-heading">${this.formatParagraphHtml(sec.heading, q)}</h4>
                ${sec.paras.map((p) => {
                  if (p.startsWith('[[VISUAL:')) {
                    const vId = p.slice(9, -2);
                    return this.renderInlineVisualCard(this.visualById.get(vId));
                  }
                  return `<p>${this.formatParagraphHtml(p, q)}</p>`;
                }).join('')}
              </section>
            `).join('') : `<p class="reader-empty">No passages matched "${this.escapeHtml(this.searchTerm)}" inside ${ch.label}.</p>`}
          </div>
        `}
      </div>
    `;

    this.container.querySelectorAll('[data-rmode]').forEach((b) => {
      b.addEventListener('click', () => { this.viewMode = b.dataset.rmode; this.render(); });
    });
    this.container.querySelector('#reader-font-dec')?.addEventListener('click', () => {
      this.fontSize = Math.max(13, this.fontSize - 1);
      try { localStorage.setItem('vp-reader-font-px', String(this.fontSize)); } catch {}
      this.render();
    });
    this.container.querySelector('#reader-font-inc')?.addEventListener('click', () => {
      this.fontSize = Math.min(22, this.fontSize + 1);
      try { localStorage.setItem('vp-reader-font-px', String(this.fontSize)); } catch {}
      this.render();
    });
    this.container.querySelector('#reader-mark-done')?.addEventListener('click', () => {
      this.isRead = !this.isRead;
      this.onToggleRead(this.chapter.chapterNum, this.isRead);
      this.render();
    });
    this.container.querySelector('#reader-open-vis-tab')?.addEventListener('click', () => this.onOpenVisualsTab());
    this.container.querySelectorAll('[data-zoom-src]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.app?.openImageLightbox(btn.dataset.zoomSrc, btn.dataset.zoomCode, btn.dataset.zoomCap);
      });
    });
    this.container.querySelector('#reader-search-input')?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      const pos = e.target.selectionStart;
      this.render();
      const inp = this.container.querySelector('#reader-search-input');
      if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
    });
    this.container.querySelectorAll('[data-jump-sec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.container.querySelector(`#${btn.dataset.jumpSec}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }
}
