/**
 * Vikkypaedia — Medicine Basics Module (Harrison's Principles of Internal Medicine, 22nd Edition)
 * Main Application Controller (v9.2 · Chapter-Centric 6-Tab Study Cockpit + 30 Full Chapters)
 */

import { QuizEngine } from './components/quiz-engine.js';
import { FlashcardEngine } from './components/flashcard-engine.js';
import { AlgorithmViewer } from './components/algorithm-viewer.js';
import { ProgressTracker } from './components/progress-tracker.js';
import { ClinicalSimulator } from './components/clinical-sim.js';
import { TapSequencePuzzle, UNIT_PUZZLES } from './components/tap-sequence-puzzle.js';
import { renderUnitSandbox, renderBayesSandbox, renderAaGradientSandbox, renderAcidBaseSodiumSandbox, renderPharmacokineticsSandbox } from './components/bedside-sandboxes.js';
import { generateDynamicCases } from './components/parameterized-engine.js';
import { ChapterReader } from './components/chapter-reader.js';
import { MindMapViewer } from './components/mindmap-viewer.js';
import { VisualGallery } from './components/visual-gallery.js';
import { REFERENCES, LESSON_REFS } from './data/references.js';

window.MedApp = {
  state: {
    currentModuleId: null,
    currentUnitIndex: 0,
    currentChapterNum: 1,
    activeTabPanel: 'panel-full-chapter',
    profile: JSON.parse(localStorage.getItem('med-basics-profile') || 'null') || { role: 'PG', mode: 'all' }
  },
  events: new EventTarget(),
  emit(ev, detail) { this.events.dispatchEvent(new CustomEvent(ev, { detail })); },
  on(ev, fn) { this.events.addEventListener(ev, fn); },
  data: { curriculum: null, chapters: [], visuals: [], medications: null, vitalSigns: null }
};

class MedicineBasicsApp {
  constructor() {
    this.progress = new ProgressTracker();
    this.currentQuiz = null;
    this.refCategory = 'ALL';
    this.refSearch = '';
    this.landingChapterSearch = '';
    this.sidebarChapterSearch = '';
    this.flashcardScope = 'chapter'; // 'chapter' | 'unit'
  }

  async init() {
    this.registerServiceWorker();
    this.setupDialogLightDismissFallback();
    this.setupThemeSync();
    await this.loadData();
    this.bindGlobalListeners();
    this.bindStudyTabs();
    this.renderLandingChaptersHub();
    this.renderLandingSyllabus();
    this.renderLandingReferences();
    this.syncProfileUI();

    const last = this.progress.getLastActive();
    const firstMod = window.MedApp.data.curriculum?.modules?.[0];
    if (firstMod) {
      window.MedApp.state.currentModuleId = firstMod.id;
      window.MedApp.state.currentUnitIndex = last?.unitIndex || 0;
      const unitChs = this.getChaptersForUnit(window.MedApp.state.currentUnitIndex);
      if (unitChs.length) window.MedApp.state.currentChapterNum = unitChs[0].chapterNum;
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  setupDialogLightDismissFallback() {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e, dialog) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
        let pressedOutside = false;
        dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
        dialog.addEventListener('pointerup', (e) => {
          if (pressedOutside && outside(e, dialog)) dialog.close();
        });
      }
    }
  }

  setupThemeSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'vp-med-color-scheme') {
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) meta.content = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'light dark';
      }
    });
  }

  toggleDarkMode() {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = (() => { try { return localStorage.getItem('vp-med-color-scheme'); } catch { return null; } })();
    const currentRendered = stored === 'light' || stored === 'dark' ? stored : (systemIsDark ? 'dark' : 'light');
    const target = currentRendered === 'dark' ? 'light' : 'dark';
    const systemScheme = systemIsDark ? 'dark' : 'light';

    try {
      if (target === systemScheme) {
        localStorage.removeItem('vp-med-color-scheme');
        if (meta) meta.content = 'light dark';
        this.toast(`Reverted to System Theme (${target === 'dark' ? 'Night Shift' : 'Daylight'})`);
      } else {
        localStorage.setItem('vp-med-color-scheme', target);
        if (meta) meta.content = target;
        this.toast(target === 'dark' ? '🌙 OLED Night Shift Mode Enabled' : '☀️ Daylight Clinical Mode Enabled');
      }
    } catch {
      if (meta) meta.content = target;
    }
  }

  async loadData() {
    try {
      const [curriculum, chaptersBundle, visualsBundle, medications, vitalSigns] = await Promise.all([
        fetch('data/curriculum.json').then((r) => r.json()),
        fetch('data/chapters.json').then((r) => r.json()),
        fetch('data/visuals.json').then((r) => r.json()).catch(() => ({ visuals: [] })),
        fetch('data/medications.json').then((r) => r.json()),
        fetch('data/vital-signs.json').then((r) => r.json())
      ]);
      window.MedApp.data.curriculum = curriculum;
      window.MedApp.data.chapters = chaptersBundle.chapters || [];
      window.MedApp.data.visuals = visualsBundle.visuals || [];
      window.MedApp.data.medications = medications;
      window.MedApp.data.vitalSigns = vitalSigns;
    } catch (err) {
      console.error('Failed to load course data:', err);
      this.toast('Could not load course JSON. Please serve via HTTP or open the standalone HTML.');
    }
  }

  getVisualsForChapter(chNum) {
    return (window.MedApp.data.visuals || []).filter((v) => v.chapterNum === Number(chNum));
  }

  getChaptersForUnit(unitIndex) {
    return (window.MedApp.data.chapters || []).filter((c) => c.unitIndex === unitIndex);
  }

  getChapterByNum(chNum) {
    return (window.MedApp.data.chapters || []).find((c) => c.chapterNum === Number(chNum));
  }

  /* ── VIEW SWITCHING ── */
  enterClassroom(unitIndex = null, chapterNum = null, tabPanelId = null) {
    document.getElementById('course-landing').style.display = 'none';
    document.getElementById('course-player').style.display = 'flex';
    const mod = window.MedApp.data.curriculum?.modules?.[0];
    if (!mod) return;
    const targetIdx = unitIndex !== null ? unitIndex : (window.MedApp.state.currentUnitIndex || 0);
    this.navigateTo(mod.id, targetIdx, chapterNum, tabPanelId);
  }

  openChapterDirect(chapterNum, tabPanelId = 'panel-full-chapter') {
    const ch = this.getChapterByNum(chapterNum);
    if (!ch) return;
    this.enterClassroom(ch.unitIndex, ch.chapterNum, tabPanelId);
  }

  returnToLanding() {
    document.getElementById('course-player').style.display = 'none';
    document.getElementById('course-landing').style.display = 'block';
    this.renderLandingChaptersHub();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── ACCESSIBLE 6-TAB STUDY COCKPIT (Modern Web Guidance Compliant) ── */
  bindStudyTabs() {
    const tablist = document.querySelector('#study-tabs .study-tablist');
    if (!tablist) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = [...document.querySelectorAll('#study-tabs [role="tabpanel"]')];

    const selectTab = (targetTab, shouldFocus = false) => {
      if (!targetTab) return;
      const targetPanelId = targetTab.dataset.panel;
      window.MedApp.state.activeTabPanel = targetPanelId;

      tabs.forEach((t) => {
        const isSel = t === targetTab;
        t.setAttribute('aria-selected', String(isSel));
        t.toggleAttribute('focusgroupstart', isSel);
      });

      panels.forEach((p) => {
        const isSel = p.id === targetPanelId;
        if (isSel) {
          p.removeAttribute('hidden');
          p.setAttribute('tabindex', '0');
        } else {
          p.setAttribute('hidden', 'until-found');
          p.removeAttribute('tabindex');
        }
      });

      targetTab.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      if (shouldFocus) targetTab.focus();

      // Update mobile bottom bar active state
      document.querySelectorAll('.mob-btn[data-quick-tab]').forEach((mb) => {
        mb.classList.toggle('active', mb.dataset.quickTab === targetPanelId);
      });
    };

    this.selectStudyTabByPanel = (panelId) => {
      const tab = tabs.find((t) => t.dataset.panel === panelId);
      if (tab) selectTab(tab, false);
    };

    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => selectTab(tab, false));
      // Arrow-key navigation fallback when native focusgroup is unsupported
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          selectTab(tabs[(idx + 1) % tabs.length], true);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          selectTab(tabs[(idx - 1 + tabs.length) % tabs.length], true);
        } else if (e.key === 'Home') {
          e.preventDefault();
          selectTab(tabs[0], true);
        } else if (e.key === 'End') {
          e.preventDefault();
          selectTab(tabs[tabs.length - 1], true);
        }
      });
    });

    // Sync browser Find-in-Page (`beforematch`) with hidden="until-found" tab panels
    panels.forEach((panel) => {
      panel.addEventListener('beforematch', () => {
        const matchingTab = tabs.find((t) => t.dataset.panel === panel.id);
        if (matchingTab) selectTab(matchingTab, false);
      });
    });
  }

  /* ── LANDING PAGE: 30 INDIVIDUAL CHAPTERS DIRECT HUB ── */
  renderLandingChaptersHub() {
    const grid = document.getElementById('landing-chapters-grid');
    const countEl = document.getElementById('landing-chapter-count');
    if (!grid) return;

    const q = this.landingChapterSearch.trim().toLowerCase();
    const list = (window.MedApp.data.chapters || []).filter((c) => {
      if (!q) return true;
      return `${c.label} ${c.title} ${c.authors} ${(c.quickRevision || []).join(' ')}`.toLowerCase().includes(q);
    });

    if (countEl) countEl.textContent = `Showing ${list.length} of ${(window.MedApp.data.chapters || []).length} Harrison's 22e chapters`;

    grid.innerHTML = list.map((c) => {
      const isRead = this.progress.isChapterRead(c.chapterNum);
      const visCnt = this.getVisualsForChapter(c.chapterNum).length;
      return `
        <div class="ch-hub-card">
          <div class="ch-hub-top">
            <span class="ch-hub-badge">${c.label}${isRead ? ' · ✓ Read' : ''}</span>
            <span class="ch-hub-meta">Unit ${c.unitIndex + 1} · ${visCnt} Tables/Figs</span>
          </div>
          <h4>${c.title}</h4>
          <p class="ch-hub-auth">${c.authors} · ${c.pages}</p>
          <div class="ch-hub-actions">
            <button type="button" class="ch-act-btn primary" data-open-ch="${c.chapterNum}" data-open-tab="panel-full-chapter">📖 Read Full</button>
            <button type="button" class="ch-act-btn" data-open-ch="${c.chapterNum}" data-open-tab="panel-visuals">📊 Tables/Figs (${visCnt})</button>
            <button type="button" class="ch-act-btn" data-open-ch="${c.chapterNum}" data-open-tab="panel-mindmap">🧠 Mind Map</button>
            <button type="button" class="ch-act-btn" data-open-ch="${c.chapterNum}" data-open-tab="panel-flashcards">🃏 Cards (${c.flashcards.length})</button>
            <button type="button" class="ch-act-btn" style="grid-column:1 / -1;" data-open-ch="${c.chapterNum}" data-open-tab="panel-quiz">📝 Chapter Quiz (${c.label})</button>
          </div>
        </div>
      `;
    }).join('') || `<p style="color:var(--text-muted);">No chapters matched "${this.landingChapterSearch}".</p>`;

    grid.querySelectorAll('[data-open-ch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.openChapterDirect(parseInt(btn.dataset.openCh, 10), btn.dataset.openTab);
      });
    });
  }

  /* ── LANDING PAGE: 10-UNIT SYLLABUS ── */
  renderLandingSyllabus() {
    const el = document.getElementById('landing-syllabus-accordion');
    const mod = window.MedApp.data.curriculum?.modules?.[0];
    if (!el || !mod) return;

    el.innerHTML = mod.units.map((u, idx) => {
      const unitChs = this.getChaptersForUnit(idx);
      return `
        <div class="syl-item ${idx === 0 ? 'open' : ''}">
          <button type="button" class="syl-header" aria-expanded="${idx === 0 ? 'true' : 'false'}">
            <span class="syl-num">${idx + 1}</span>
            <span class="syl-title-wrap">
              <strong>${u.title}</strong>
              <small>${u.subtitle}</small>
            </span>
            <span aria-hidden="true">${idx === 0 ? '▲' : '▼'}</span>
          </button>
          <div class="syl-body">
            <div class="syl-tags">
              <span class="syl-tag">📖 ${unitChs.length} Full Chapters</span>
              <span class="syl-tag">🧠 ${unitChs.length} Mind Maps</span>
              <span class="syl-tag">📝 ${u.mustKnow.quiz.length} MCQs</span>
              ${u.hasSandbox ? '<span class="syl-tag">🧪 Bedside Sandbox</span>' : ''}
              ${u.hasPuzzle ? '<span class="syl-tag">🧩 Sequence Puzzle</span>' : ''}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:0.45rem;margin:0.65rem 0 0.9rem;">
              ${unitChs.map((c) => `
                <button type="button" class="preset-btn" data-syl-ch="${c.chapterNum}">📖 ${c.label}: ${c.title}</button>
              `).join('')}
            </div>
            <button type="button" class="syl-jump-btn" data-jump-unit="${idx}">Open Unit ${idx + 1} Study Cockpit →</button>
          </div>
        </div>
      `;
    }).join('');

    el.querySelectorAll('.syl-header').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.syl-item');
        const isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
        btn.lastElementChild.textContent = isOpen ? '▲' : '▼';
      });
    });
    el.querySelectorAll('[data-jump-unit]').forEach((btn) => {
      btn.addEventListener('click', () => this.enterClassroom(parseInt(btn.dataset.jumpUnit, 10), null, 'panel-full-chapter'));
    });
    el.querySelectorAll('[data-syl-ch]').forEach((btn) => {
      btn.addEventListener('click', () => this.openChapterDirect(parseInt(btn.dataset.sylCh, 10), 'panel-full-chapter'));
    });
  }

  renderLandingReferences() {
    const grid = document.getElementById('landing-ref-grid');
    if (!grid) return;
    const q = this.refSearch.trim().toLowerCase();
    const filtered = REFERENCES.filter((r) => {
      const catOk = this.refCategory === 'ALL' || r.category === this.refCategory;
      const textOk = !q || `${r.tag} ${r.citation} ${r.keyTakeaway} ${r.chapter}`.toLowerCase().includes(q);
      return catOk && textOk;
    });

    grid.innerHTML = filtered.map((r) => `
      <div class="ref-card">
        <div class="ref-card-top">
          <span class="ref-id-badge">Ref #${r.id} · ${r.chapter}</span>
          <span class="ref-cat-tag">${r.category}</span>
        </div>
        <h4>${r.tag}</h4>
        <p class="ref-citation">${r.citation}</p>
        <p class="ref-takeaway"><strong>Key Takeaway:</strong> ${r.keyTakeaway}</p>
      </div>
    `).join('') || `<p style="color:var(--text-muted);">No citations matched "${this.refSearch}".</p>`;
  }

  isUnitUnlocked(mod, unitIndex) {
    if (unitIndex === 0) return true;
    if (!this.progress.data.masteryGatingEnabled) return true;
    return this.progress.isUnitComplete(mod.id, mod.units[unitIndex - 1].id);
  }

  /* ── COURSE PLAYER NAVIGATION ── */
  navigateTo(moduleId, unitIndex = 0, chapterNum = null, tabPanelId = null) {
    const mod = window.MedApp.data.curriculum?.modules?.find((m) => m.id === moduleId);
    if (!mod) return;
    unitIndex = Math.max(0, Math.min(unitIndex, mod.units.length - 1));

    if (!this.isUnitUnlocked(mod, unitIndex)) {
      this.toast(`🔒 Strict Exam Mode is ON: Score ≥90% on Unit ${unitIndex} or uncheck Strict Exam Mode in ⚙️ Settings.`);
      return;
    }

    const unitChs = this.getChaptersForUnit(unitIndex);
    const chosenCh = chapterNum && unitChs.some((c) => c.chapterNum === Number(chapterNum))
      ? Number(chapterNum)
      : (unitChs[0]?.chapterNum || 1);

    window.MedApp.state.currentModuleId = moduleId;
    window.MedApp.state.currentUnitIndex = unitIndex;
    window.MedApp.state.currentChapterNum = chosenCh;
    this.progress.setLastActive(moduleId, unitIndex);

    this.renderSidebar();
    this.renderBreadcrumbs(mod, mod.units[unitIndex], this.getChapterByNum(chosenCh));
    this.renderUnitHero(mod, mod.units[unitIndex], unitIndex);
    this.renderChapterPickerBar(unitChs, chosenCh);
    this.renderUnitNotesAndLabs(mod, mod.units[unitIndex], unitIndex);
    this.renderChapterScopedTabs(mod, mod.units[unitIndex], unitIndex, chosenCh);
    this.updateOverallProgress();
    this.updateFooterNav(mod, mod.units[unitIndex], unitIndex);

    if (tabPanelId && this.selectStudyTabByPanel) {
      this.selectStudyTabByPanel(tabPanelId);
    }

    this.closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectActiveChapter(chapterNum) {
    const mod = window.MedApp.data.curriculum?.modules?.[0];
    const unitIndex = window.MedApp.state.currentUnitIndex;
    window.MedApp.state.currentChapterNum = Number(chapterNum);
    const unitChs = this.getChaptersForUnit(unitIndex);
    this.renderSidebar();
    this.renderBreadcrumbs(mod, mod.units[unitIndex], this.getChapterByNum(chapterNum));
    this.renderChapterPickerBar(unitChs, Number(chapterNum));
    this.renderChapterScopedTabs(mod, mod.units[unitIndex], unitIndex, Number(chapterNum));
  }

  renderSidebar() {
    // 1. Render 30 Individual Chapters list
    const chEl = document.getElementById('sidebar-chapters');
    const q = this.sidebarChapterSearch.trim().toLowerCase();
    const curCh = window.MedApp.state.currentChapterNum;
    if (chEl) {
      const chs = (window.MedApp.data.chapters || []).filter((c) =>
        !q || `${c.label} ${c.title} ${c.authors}`.toLowerCase().includes(q)
      );
      chEl.innerHTML = chs.map((c) => {
        const isRead = this.progress.isChapterRead(c.chapterNum);
        const isCur = c.chapterNum === curCh;
        return `
          <li class="sb-module ${isCur ? 'active' : ''} ${isRead ? 'complete' : ''}" data-sb-ch="${c.chapterNum}">
            <span class="sb-num-badge">${isRead ? '✓' : c.chapterNum}</span>
            <span>
              <span class="sb-module-title">${c.label}: ${c.title}</span>
              <span class="sb-unit-time">Unit ${c.unitIndex + 1} · ~${c.readMinutes}m · ${c.flashcards.length} cards</span>
            </span>
          </li>
        `;
      }).join('') || `<li style="padding:0.5rem;font-size:0.82rem;color:var(--text-muted);">No matching chapters</li>`;

      chEl.querySelectorAll('[data-sb-ch]').forEach((item) => {
        item.addEventListener('click', () => {
          this.openChapterDirect(parseInt(item.dataset.sbCh, 10), window.MedApp.state.activeTabPanel);
        });
      });
    }

    // 2. Render 10 Units list
    const el = document.getElementById('sidebar-modules');
    const mod = window.MedApp.data.curriculum?.modules?.[0];
    if (!el || !mod) return;
    const currentIdx = window.MedApp.state.currentUnitIndex;

    el.innerHTML = mod.units.map((u, i) => {
      const done = this.progress.isUnitComplete(mod.id, u.id);
      const unlocked = this.isUnitUnlocked(mod, i);
      const best = this.progress.getUnitBestScore(mod.id, u.id);
      return `
        <li class="sb-module ${i === currentIdx ? 'active' : ''} ${!unlocked ? 'locked' : ''} ${done ? 'complete' : ''}" data-unit-idx="${i}">
          <span class="sb-num-badge">${done ? '✓' : !unlocked ? '🔒' : i + 1}</span>
          <span>
            <span class="sb-module-title">${u.title}</span>
            <span class="sb-unit-time">${(u.chapters || []).join(', ')} · ${u.mustKnow.quiz.length} MCQs${best !== null ? ` · ${best}%` : ''}</span>
          </span>
        </li>
      `;
    }).join('');

    el.querySelectorAll('.sb-module').forEach((item) => {
      item.addEventListener('click', () => this.navigateTo(mod.id, parseInt(item.dataset.unitIdx, 10)));
    });
  }

  renderBreadcrumbs(mod, unit, ch) {
    const el = document.getElementById('breadcrumbs');
    if (!el) return;
    el.innerHTML = `<span>Unit ${window.MedApp.state.currentUnitIndex + 1}: ${unit.title}</span><span>›</span><strong>${ch ? `${ch.label}: ${ch.title}` : ''}</strong>`;
  }

  renderUnitHero(mod, unit, unitIndex) {
    document.getElementById('unit-hero-area').innerHTML = `
      <div class="unit-hero">
        <div class="unit-hero-badge">Unit ${unitIndex + 1} of ${mod.units.length} &middot; ${(unit.chapters || []).join(' · ')} &middot; ${unit.mustKnow.quiz.length} Tiered MCQs</div>
        <h1>${unit.title}</h1>
        <p>${unit.subtitle}</p>
      </div>
    `;
  }

  renderChapterPickerBar(unitChs, activeChNum) {
    const bar = document.getElementById('chapter-picker-bar');
    if (!bar) return;
    bar.innerHTML = `
      <span class="cp-label">Select Chapter:</span>
      ${unitChs.map((c) => {
        const isRead = this.progress.isChapterRead(c.chapterNum);
        return `
          <button type="button" class="cp-pill ${c.chapterNum === activeChNum ? 'active' : ''}" data-pick-ch="${c.chapterNum}">
            ${isRead ? '<span class="cp-read-dot">✓</span>' : ''}
            <span>${c.label}: ${c.title}</span>
          </button>
        `;
      }).join('')}
    `;
    bar.querySelectorAll('[data-pick-ch]').forEach((btn) => {
      btn.addEventListener('click', () => this.selectActiveChapter(parseInt(btn.dataset.pickCh, 10)));
    });
  }

  /* ── RENDER ALL CHAPTER-SCOPED TABS (Full Chapter, Tables/Figures, Mind Map, Flashcards, Chapter Quiz) ── */
  renderChapterScopedTabs(mod, unit, unitIndex, chNum) {
    const chObj = this.getChapterByNum(chNum);
    const unitChs = this.getChaptersForUnit(unitIndex);
    const chVisuals = this.getVisualsForChapter(chNum);

    // Update Visuals Tab badge count
    const visTabBtn = document.getElementById('tab-visuals');
    if (visTabBtn) visTabBtn.textContent = `📊 Tables & Figures (${chVisuals.length})`;

    // 1. TAB 1: FULL CHAPTER READER + INLINE VISUALS STRIP + 60-SEC REVISION
    const readerMount = document.getElementById('mount-full-chapter');
    if (readerMount && chObj) {
      new ChapterReader(readerMount, chObj, {
        visuals: chVisuals,
        isRead: this.progress.isChapterRead(chObj.chapterNum),
        onOpenVisualsTab: () => this.selectStudyTabByPanel?.('panel-visuals'),
        onToggleRead: (num, isRead) => {
          this.progress.setChapterRead(num, isRead);
          this.renderSidebar();
          this.renderChapterPickerBar(unitChs, num);
          this.updateOverallProgress();
          this.toast(isRead ? `✓ Marked Ch. ${num} as Read!` : `Unmarked Ch. ${num}`);
        }
      }).render();
    }

    // 2. TAB 2: DEDICATED TABLES, FLOWCHARTS, ALGORITHMS & FIGURES GALLERY
    const visMount = document.getElementById('mount-visuals');
    if (visMount && chObj) {
      new VisualGallery(visMount, chVisuals, chObj, unitIndex).render();
    }

    // 2. TAB 3: INTERACTIVE CHAPTER MIND MAP
    const mmMount = document.getElementById('mount-mindmap');
    if (mmMount && chObj) {
      new MindMapViewer(mmMount, chObj).render();
    }

    // 3. TAB 4: DEDICATED PER-CHAPTER (OR FULL-UNIT) SM-2 FLASHCARDS
    const fcMount = document.getElementById('mount-flashcards');
    if (fcMount && chObj) {
      const renderDeck = () => {
        const unitCards = unitChs.flatMap((c) => c.flashcards.map((f) => ({ ...f, ch: c.label })));
        const chCards = chObj.flashcards.map((f) => ({ ...f, ch: chObj.label }));
        const deckCards = this.flashcardScope === 'chapter' ? chCards : unitCards;
        const deckTitle = this.flashcardScope === 'chapter'
          ? `${chObj.label}: ${chObj.title} Flashcards`
          : `All Unit ${unitIndex + 1} Flashcards (${unitChs.map((c) => c.label).join(', ')})`;

        fcMount.innerHTML = `
          <div class="fc-scope-bar">
            <button type="button" class="preset-btn ${this.flashcardScope === 'chapter' ? 'active' : ''}" data-fcscope="chapter">🃏 Just ${chObj.label} (${chCards.length} cards)</button>
            <button type="button" class="preset-btn ${this.flashcardScope === 'unit' ? 'active' : ''}" data-fcscope="unit">📚 Full Unit ${unitIndex + 1} (${unitCards.length} cards)</button>
            <button type="button" class="preset-btn" id="fc-open-all120">🔥 Open All 120 Cards</button>
          </div>
          <div id="fc-engine-host"></div>
        `;
        fcMount.querySelectorAll('[data-fcscope]').forEach((b) => {
          b.addEventListener('click', () => { this.flashcardScope = b.dataset.fcscope; renderDeck(); });
        });
        fcMount.querySelector('#fc-open-all120')?.addEventListener('click', () => this.openClinicalTool('all-flashcards'));
        new FlashcardEngine(fcMount.querySelector('#fc-engine-host'), deckCards, deckTitle).render();
      };
      renderDeck();
    }

    // 4. TAB 5: INDIVIDUAL CHAPTER & UNIT QUIZ
    const quizSection = document.getElementById('unit-quiz-section');
    if (quizSection) {
      quizSection.innerHTML = `<div id="must-quiz-container"></div>`;
      this.currentQuiz = new QuizEngine(document.getElementById('must-quiz-container'), unit.mustKnow.quiz, {
        unitIndex,
        initialChapterFilter: chObj ? chObj.label : 'ALL',
        passThreshold: 90,
        onComplete: (stats) => {
          this.progress.markQuizPassed(mod.id, unit.id, stats.percentage);
          this.renderSidebar();
          this.updateOverallProgress();
          this.updateFooterNav(mod, unit, unitIndex);
          if (stats.percentage >= 90) this.toast(`🎉 ${chObj ? chObj.label : 'Unit'} Quiz Mastered (${stats.percentage}%)!`);
        }
      });
      this.currentQuiz.render();
    }
  }

  /* ── RENDER REVISION NOTES TAB & LABS TAB ── */
  formatMarkdownInline(str = '') {
    return str
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[Ref ([\d,\s]+)\]/g, (_, nums) => {
        const firstId = parseInt(nums.split(',')[0].trim(), 10);
        return `<button type="button" class="cite-chip" data-ref-id="${firstId}">[Ref ${nums}]</button>`;
      });
  }

  renderPoints(points = [], unitIdx, tierKey) {
    return points.map((pt, idx) => {
      if (pt.type === 'table') {
        const capId = `tbl-u${unitIdx}-${tierKey}-${idx}`;
        const headers = pt.headers || [];
        return `
          <div class="point-block">
            <h4 id="${capId}">${this.formatMarkdownInline(pt.title)}</h4>
            <div tabindex="0" role="region" aria-labelledby="${capId}" class="table-wrapper">
              <table class="clinical-table">
                <thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
                <tbody>
                  ${(pt.rows || []).map((row) => `
                    <tr>
                      <th scope="row">${this.formatMarkdownInline(row[0] || '')}</th>
                      ${row.slice(1).map((cell, ci) => `<td data-label="${(headers[ci + 1] || '').replace(/"/g, '&quot;')}">${this.formatMarkdownInline(cell)}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      if (pt.type === 'callout') {
        return `<div class="point-callout"><h4>${this.formatMarkdownInline(pt.title)}</h4><p>${this.formatMarkdownInline(pt.body)}</p></div>`;
      }
      return `<div class="point-block"><h4>${this.formatMarkdownInline(pt.title)}</h4><p>${this.formatMarkdownInline(pt.body)}</p></div>`;
    }).join('');
  }

  renderTierCard(cls, icon, title, desc, points, collapsed, unitIdx, key) {
    return `
      <section class="tier-section tier-${cls} ${collapsed ? 'collapsed' : ''}">
        <button type="button" class="tier-toggle" aria-expanded="${!collapsed}">
          <span class="tier-head-text"><strong>${icon} ${title}</strong><small>${desc}</small></span>
          <span class="tier-chevron" aria-hidden="true">${collapsed ? '▼' : '▲'}</span>
        </button>
        <div class="tier-body">${this.renderPoints(points, unitIdx, key)}</div>
      </section>
    `;
  }

  renderUnitNotesAndLabs(mod, unit, unitIndex) {
    // TAB 2: 3-TIER CBME REVISION NOTES
    const role = window.MedApp.state.profile.role || 'PG';
    const tierEl = document.getElementById('tier-content');
    let html = '';
    html += this.renderTierCard('must', '🔴', 'L1 · Must-Know (Nursing & Core Bedside Triage)', 'Essential stabilization, red flags & safety ceilings', unit.mustKnow?.points, false, unitIndex, 'l1');
    if (role !== 'Nurse' && unit.shouldKnow?.points?.length) {
      html += this.renderTierCard('should', '🟡', 'L2 · Should-Know (UG / MBBS Clerkship)', 'Diagnostic criteria, bedside equations & clinical reasoning', unit.shouldKnow.points, false, unitIndex, 'l2');
    }
    if (role !== 'Nurse' && unit.couldKnow?.points?.length) {
      html += this.renderTierCard('could', '🟢', 'L3 · Could-Know (PG / Internal Medicine Resident)', 'Subtle Harrison’s 22e pitfalls, mimics & ICU pearls', unit.couldKnow.points, role === 'UG', unitIndex, 'l3');
    }
    tierEl.innerHTML = html;

    tierEl.querySelectorAll('.tier-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sec = btn.closest('.tier-section');
        const isCollapsed = sec.classList.toggle('collapsed');
        btn.setAttribute('aria-expanded', String(!isCollapsed));
        btn.querySelector('.tier-chevron').textContent = isCollapsed ? '▼' : '▲';
      });
    });

    const evEl = document.getElementById('unit-evidence-area');
    const unitRefs = (LESSON_REFS[unitIndex] || [1, 3]).map((id) => REFERENCES.find((r) => r.id === id)).filter(Boolean);
    evEl.innerHTML = `
      <div class="unit-evidence-card">
        <div class="ev-top">
          <div>
            <span class="ev-eyebrow">VERIFIED HARRISON'S 22nd EDITION ANCHORS</span>
            <h4>Primary Chapters &amp; Guidelines Mapped to Unit ${unitIndex + 1}</h4>
          </div>
          <button type="button" class="ev-open-all-btn" id="open-full-refs-unit">📖 Open All 35 Citations</button>
        </div>
        <div class="onsite-cite-bar">
          ${unitRefs.map((r) => `<button type="button" class="cite-chip" data-ref-id="${r.id}">[Ref ${r.id}] ${r.tag}</button>`).join('')}
        </div>
      </div>
    `;
    evEl.querySelector('#open-full-refs-unit')?.addEventListener('click', () => this.openClinicalTool('references-lib'));

    document.getElementById('panel-notes').querySelectorAll('.cite-chip').forEach((chip) => {
      chip.addEventListener('click', () => this.showSingleReferenceModal(parseInt(chip.dataset.refId, 10)));
    });

    // TAB 6: SANDBOXES, TAP-PUZZLES, ALGORITHMS & ER SIMULATOR
    const sbEl = document.getElementById('unit-sandbox-area');
    sbEl.innerHTML = '';
    if (unit.hasSandbox) renderUnitSandbox(sbEl, unitIndex);

    const pzEl = document.getElementById('unit-puzzle-area');
    pzEl.innerHTML = '';
    if (UNIT_PUZZLES[unitIndex]) new TapSequencePuzzle(pzEl, UNIT_PUZZLES[unitIndex]);

    const shortcutsEl = document.getElementById('unit-lab-shortcuts');
    shortcutsEl.innerHTML = `
      <div class="lab-shortcuts-grid">
        <button type="button" class="lab-shortcut-card" data-lab-tool="er-sim">
          <strong>🏥 Virtual ER Simulator (3 Unfolding Cases)</strong>
          <span>Aortic Dissection Trap · Febrile Petechial Coma · Hyperkalemia/ABG/SBP</span>
        </button>
        <button type="button" class="lab-shortcut-card" data-lab-tool="param-drill">
          <strong>🎲 PrairieLearn Parameterized Drill Lab</strong>
          <span>Infinite randomized labs &amp; vitals so you can practice without memorizing</span>
        </button>
        <button type="button" class="lab-shortcut-card" data-lab-tool="sandboxes">
          <strong>🧪 All 4 Bedside Calculators</strong>
          <span>Bayes LR · A–a O₂ Gradient · Acid-Base/ODS · Pharmacokinetics/CrCl</span>
        </button>
        <button type="button" class="lab-shortcut-card" data-lab-tool="algorithms">
          <strong>🗺️ Interactive Clinical Algorithms</strong>
          <span>Chest Pain 10-Min · Hyponatremia · 4-Step ABG · Coma Stabilization</span>
        </button>
      </div>
    `;
    shortcutsEl.querySelectorAll('[data-lab-tool]').forEach((b) => {
      b.addEventListener('click', () => this.openClinicalTool(b.dataset.labTool));
    });

    const simArea = document.getElementById('unit-sim-area');
    simArea.innerHTML = '';
    if (unitIndex === mod.units.length - 1) new ClinicalSimulator(simArea).render();
  }

  updateOverallProgress() {
    const overall = this.progress.getOverallProgress(window.MedApp.data.curriculum);
    const totalChs = (window.MedApp.data.chapters || []).length || 30;
    const chPct = Math.round((overall.readChapters / totalChs) * 100);
    const displayPct = Math.max(overall.percentage, chPct);
    document.querySelectorAll('.nav-progress-fill, #sb-prog-fill').forEach((el) => { el.style.width = `${displayPct}%`; });
    document.querySelectorAll('.nav-progress-pct, #sb-prog-pct').forEach((el) => { el.textContent = `${displayPct}%`; });
    const statsEl = document.getElementById('sb-read-stats');
    if (statsEl) statsEl.textContent = `${overall.readChapters}/${totalChs} Chapters Read · ${overall.completed}/10 Units`;
  }

  updateFooterNav(mod, unit, unitIndex) {
    const prevBtn = document.getElementById('btn-prev-unit');
    const nextBtn = document.getElementById('btn-complete');
    prevBtn.disabled = unitIndex === 0;
    const isComplete = this.progress.isUnitComplete(mod.id, unit.id);
    const freeBrowse = !this.progress.data.masteryGatingEnabled;
    const isLast = unitIndex === mod.units.length - 1;

    if (isComplete || freeBrowse) {
      nextBtn.disabled = false;
      nextBtn.classList.remove('locked');
      nextBtn.textContent = isLast ? '🏆 Generate SHA-256 Certificate →' : `Next Unit (Unit ${unitIndex + 2}) →`;
    } else {
      nextBtn.disabled = true;
      nextBtn.classList.add('locked');
      nextBtn.textContent = '🔒 Score ≥90% on Quiz to Unlock Next Unit';
    }
  }

  /* ── NATIVE <dialog> BOTTOM-SHEET MODAL TOOLS ── */
  openDialog(title, htmlContent, onMount = null) {
    const dialog = document.getElementById('clinical-dialog');
    document.getElementById('clinical-dialog-title').textContent = title;
    const body = document.getElementById('clinical-dialog-body');
    body.innerHTML = htmlContent;
    if (typeof onMount === 'function') onMount(body);
    if (!dialog.open) dialog.showModal();
  }

  showSingleReferenceModal(refId) {
    const r = REFERENCES.find((x) => x.id === refId);
    if (!r) return;
    this.openDialog(`Verified Reference #${r.id} · ${r.chapter}`, `
      <div class="ref-card">
        <div class="ref-card-top"><span class="ref-id-badge">${r.chapter} · ${r.pages}</span><span class="ref-cat-tag">${r.category}</span></div>
        <h4>${r.tag}</h4>
        <p class="ref-citation">${r.citation}</p>
        <p class="ref-takeaway"><strong>Harrison's 22e Clinical Anchor:</strong> ${r.keyTakeaway}</p>
      </div>
    `);
  }

  openImageLightbox(src, code, caption) {
    let zoomPct = 100;
    this.openDialog(`${code} — Harrison's 22nd Edition`, `
      <div class="lightbox-controls">
        <span class="sandbox-tag" style="margin:0;">🔍 High-Res Textbook Zoom</span>
        <div style="display:flex;gap:0.4rem;align-items:center;">
          <button type="button" class="preset-btn" id="lb-zout">− Zoom Out</button>
          <span id="lb-zval" class="mm-zoom-lbl">100%</span>
          <button type="button" class="preset-btn" id="lb-zin">+ Zoom In</button>
          <button type="button" class="preset-btn" id="lb-zfit">Fit</button>
        </div>
      </div>
      <div class="lightbox-stage">
        <img id="lb-img" class="lightbox-img" src="${src}" alt="${code}" style="width:100%;">
      </div>
      <p class="lightbox-caption"><strong>${code}:</strong> ${caption || ''}</p>
    `, (body) => {
      const img = body.querySelector('#lb-img');
      const lbl = body.querySelector('#lb-zval');
      const setZ = (z) => { zoomPct = Math.min(240, Math.max(60, z)); img.style.width = `${zoomPct}%`; lbl.textContent = `${zoomPct}%`; };
      body.querySelector('#lb-zout').addEventListener('click', () => setZ(zoomPct - 25));
      body.querySelector('#lb-zin').addEventListener('click', () => setZ(zoomPct + 25));
      body.querySelector('#lb-zfit').addEventListener('click', () => setZ(100));
    });
  }

  async openClinicalTool(tool) {
    this.closeMobileSidebar();
    if (tool === 'visuals-atlas') {
      const allV = window.MedApp.data.visuals || [];
      this.openDialog(`Harrison's 22e Visual Atlas (${allV.length} Tables, Flowcharts & Figures)`, `
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;margin-bottom:0.85rem;">
          <input type="search" id="atlas-search" class="ref-search-input" style="max-width:none;flex:1;" placeholder="Search all 177 visuals (e.g., chest, HEART, nomogram, rash, hyponatremia, anemia, Table 15)...">
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <button type="button" class="preset-btn active" data-akind="ALL">All (${allV.length})</button>
            <button type="button" class="preset-btn" data-akind="Table">📋 Tables</button>
            <button type="button" class="preset-btn" data-akind="Algorithm / Flowchart">🔀 Algos</button>
            <button type="button" class="preset-btn" data-akind="Figure">🖼️ Figures</button>
          </div>
        </div>
        <div id="atlas-grid" class="visuals-grid"></div>
      `, (body) => {
        let aKind = 'ALL';
        let aQuery = '';
        const grid = body.querySelector('#atlas-grid');
        const draw = () => {
          const q = aQuery.trim().toLowerCase();
          const list = allV.filter((v) =>
            (aKind === 'ALL' || v.kind === aKind) &&
            (!q || `${v.code} ch ${v.chapterNum} ${v.kind} ${v.caption}`.toLowerCase().includes(q))
          );
          grid.innerHTML = list.slice(0, 60).map((v) => `
            <figure class="visual-card">
              <div class="visual-card-top">
                <span class="vis-code-badge vis-kind-${v.kind === 'Table' ? 'table' : v.kind === 'Figure' ? 'fig' : 'algo'}">${v.code}</span>
                <span class="vis-kind-tag">Ch. ${v.chapterNum} · ${v.kind}</span>
              </div>
              <button type="button" class="vis-img-btn" data-az-src="${v.src}" data-az-code="${v.code}" data-az-cap="${v.caption.replace(/"/g, '&quot;')}">
                <img src="${v.src}" alt="${v.code}" loading="lazy" class="vis-thumb-img">
                <span class="vis-zoom-pill">🔍 Zoom</span>
              </button>
              <figcaption class="vis-caption"><strong>${v.code}:</strong> ${v.caption.slice(0, 140)}${v.caption.length > 140 ? '…' : ''}</figcaption>
            </figure>
          `).join('') + (list.length > 60 ? `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:0.84rem;">Showing first 60 of ${list.length} matches — type a keyword above to narrow down.</p>` : '');
          grid.querySelectorAll('[data-az-src]').forEach((b) => {
            b.addEventListener('click', () => this.openImageLightbox(b.dataset.azSrc, b.dataset.azCode, b.dataset.azCap));
          });
        };
        body.querySelector('#atlas-search').addEventListener('input', (e) => { aQuery = e.target.value; draw(); });
        body.querySelectorAll('[data-akind]').forEach((b) => {
          b.addEventListener('click', () => {
            body.querySelectorAll('[data-akind]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            aKind = b.dataset.akind;
            draw();
          });
        });
        draw();
      });
    } else if (tool === 'er-sim') {
      this.openDialog('Virtual Internal Medicine ER & Ward Simulator', `<div id="modal-sim-mount"></div>`, (body) => {
        new ClinicalSimulator(body.querySelector('#modal-sim-mount')).render();
      });
    } else if (tool === 'param-drill') {
      this.openDialog('PrairieLearn Dynamic Parameterized Clinical Drill', `<div id="modal-param-mount"></div>`, (body) => {
        const mount = body.querySelector('#modal-param-mount');
        const renderFresh = () => {
          const cases = generateDynamicCases();
          mount.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;">
              <span style="font-size:0.86rem;color:var(--text-secondary);">Fresh randomized vitals &amp; labs generated every attempt!</span>
              <button type="button" id="regen-param-btn" class="preset-btn active">🎲 Generate New Numbers</button>
            </div>
            <div id="param-quiz-host"></div>
          `;
          mount.querySelector('#regen-param-btn').addEventListener('click', renderFresh);
          new QuizEngine(mount.querySelector('#param-quiz-host'), cases, { passThreshold: 80 }).render();
        };
        renderFresh();
      });
    } else if (tool === 'sandboxes') {
      this.openDialog('Andrew Ng Bedside Clinical Sandboxes', `
        <div class="algo-switcher">
          <button type="button" class="preset-btn active" data-sb="bayes">Bayes LR (Ch.4)</button>
          <button type="button" class="preset-btn" data-sb="aa">A–a Gradient (Ch.42)</button>
          <button type="button" class="preset-btn" data-sb="ab">Acid-Base &amp; ODS (Ch.56/58)</button>
          <button type="button" class="preset-btn" data-sb="pk">PK &amp; CrCl (Ch.55/71)</button>
        </div>
        <div id="sb-tool-host"></div>
      `, (body) => {
        const host = body.querySelector('#sb-tool-host');
        const show = (k) => {
          host.innerHTML = '';
          if (k === 'bayes') renderBayesSandbox(host);
          else if (k === 'aa') renderAaGradientSandbox(host);
          else if (k === 'ab') renderAcidBaseSodiumSandbox(host);
          else renderPharmacokineticsSandbox(host);
        };
        body.querySelectorAll('[data-sb]').forEach((b) => {
          b.addEventListener('click', () => {
            body.querySelectorAll('[data-sb]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            show(b.dataset.sb);
          });
        });
        show('bayes');
      });
    } else if (tool === 'algorithms') {
      this.openDialog("Harrison's 22e Bedside Decision Algorithms", `<div id="modal-algo-mount"></div>`, (body) => {
        new AlgorithmViewer(body.querySelector('#modal-algo-mount')).render();
      });
    } else if (tool === 'all-flashcards' || tool === 'flashcards') {
      const allCards = (window.MedApp.data.chapters || []).flatMap((c) => c.flashcards.map((f) => ({ ...f, ch: c.label })));
      this.openDialog(`All ${allCards.length} Harrison's 22e SM-2 Flashcards`, `<div id="modal-fc-mount"></div>`, (body) => {
        new FlashcardEngine(body.querySelector('#modal-fc-mount'), allCards, `Master Deck (${allCards.length} Cards · All 30 Chapters)`).render();
      });
    } else if (tool === 'vitals-ref') {
      const vs = window.MedApp.data.vitalSigns;
      this.openDialog("Adult Vitals, qSOFA & Panic Lab Cutoffs (Harrison's 22e)", `
        <div class="point-callout"><h4>qSOFA Rapid Bedside Sepsis Screen</h4><ul>${(vs?.qsofaCriteria || []).map((x) => `<li>${x}</li>`).join('')}</ul></div>
        <div tabindex="0" role="region" aria-label="Adult normal and critical vitals" class="table-wrapper">
          <table class="clinical-table">
            <thead><tr><th>Parameter</th><th>Normal</th><th>Warning</th><th>Critical Red Flag</th></tr></thead>
            <tbody>${(vs?.adultNormalVitals || []).map((r) => `<tr><th>${r.parameter}</th><td data-label="Normal">${r.normal}</td><td data-label="Warning">${r.warning}</td><td data-label="Critical">${r.critical}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <h4 style="margin-top:1.1rem;">Critical Lab Panic Values &amp; Guardrails</h4>
        <div tabindex="0" role="region" aria-label="Critical lab values" class="table-wrapper">
          <table class="clinical-table">
            <thead><tr><th>Lab</th><th>Normal</th><th>Panic Threshold</th><th>Harrison's 22e Pearl</th></tr></thead>
            <tbody>${(vs?.criticalLabs || []).map((r) => `<tr><th>${r.lab}</th><td data-label="Normal">${r.normal}</td><td data-label="Panic">${r.panic}</td><td data-label="Pearl">${r.pearl}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      `);
    } else if (tool === 'formulary') {
      const meds = window.MedApp.data.medications || [];
      this.openDialog("Internal Medicine Emergency Drug Formulary (Harrison's 22e)", `
        <div style="display:grid;gap:0.75rem;">
          ${meds.map((m) => `
            <div class="ref-card">
              <div class="ref-card-top"><span class="ref-id-badge">${m.category}</span></div>
              <h4>💊 ${m.name}</h4>
              <p class="ref-citation"><strong>Indication:</strong> ${m.indication}</p>
              <p class="ref-citation"><strong>Dose:</strong> ${m.dose}</p>
              <p class="ref-takeaway"><strong>⚠️ Safety Alert:</strong> ${m.safetyAlert}</p>
            </div>
          `).join('')}
        </div>
      `);
    } else if (tool === 'references-lib') {
      this.openDialog("35 Verified Harrison's 22nd Edition & Guideline Citations", `
        <div style="display:grid;gap:0.7rem;">
          ${REFERENCES.map((r) => `
            <div class="ref-card">
              <div class="ref-card-top"><span class="ref-id-badge">Ref #${r.id} · ${r.chapter}</span><span class="ref-cat-tag">${r.category}</span></div>
              <h4>${r.tag}</h4>
              <p class="ref-citation">${r.citation}</p>
              <p class="ref-takeaway">${r.keyTakeaway}</p>
            </div>
          `).join('')}
        </div>
      `);
    } else if (tool === 'certificate') {
      const name = localStorage.getItem('med-basics-user-name') || 'Clinician Learner';
      const role = window.MedApp.state.profile.role;
      const overall = this.progress.getOverallProgress(window.MedApp.data.curriculum);
      const hash = await this.progress.generateVerificationHash(name, role, overall);
      const earned = overall.completed >= overall.total && overall.total > 0;
      this.openDialog('Tamper-Resistant SHA-256 CME Verification Certificate', `
        <div class="cert-card">
          <div style="font-size:0.76rem;letter-spacing:0.1em;color:#5eead4;font-weight:800;">VIKKYPAEDIA ACADEMY · CRYPTOGRAPHICALLY VERIFIED</div>
          <h3 style="margin:0.5rem 0 0.2rem;font-size:1.45rem;">Vikkypaedia Medicine Basics Module</h3>
          <p style="margin:0 0 1rem;color:#cbd5e1;font-size:0.88rem;">Harrison's Principles of Internal Medicine, 22nd Edition (30 Full Chapters)</p>
          <div style="font-size:1.3rem;font-weight:900;margin-bottom:0.35rem;">${name}</div>
          <div style="font-size:0.86rem;color:#94a3b8;">Track: ${role} &middot; Chapters Read: ${overall.readChapters}/30 &middot; Units Mastered (≥90%): ${overall.completed}/${overall.total}</div>
          <div class="cert-hash-box">SHA-256 VERIFICATION ID: ${hash}</div>
          <p style="font-size:0.84rem;color:${earned ? '#5eead4' : '#fde68a'};margin:0 0 1rem;">
            ${earned ? '✅ Full Mastery Verified — Ready for Institutional Audit & Print!' : '⏳ Read chapters & score ≥90% across all 10 unit quizzes to finalize completion status.'}
          </p>
          <button type="button" class="btn-primary-action" onclick="window.print()">🖨️ Print / Save PDF Certificate</button>
        </div>
      `);
    }
  }

  syncProfileUI() {
    const role = window.MedApp.state.profile.role || 'PG';
    const name = localStorage.getItem('med-basics-user-name') || `${role} Clinician`;
    const roleLabels = { Nurse: 'L1 · Nursing & Triage', UG: 'L2 · MBBS Clerkship', PG: 'L3 · PG / Resident (All Tiers)' };
    const nameEl = document.getElementById('sb-profile-name');
    const roleEl = document.getElementById('course-role-label');
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = roleLabels[role] || role;
    document.querySelectorAll('.hero-track-pill').forEach((p) => { p.classList.toggle('active', p.dataset.role === role); });
  }

  openLoginDialog() {
    const d = document.getElementById('login-dialog');
    document.getElementById('login-name').value = localStorage.getItem('med-basics-user-name') || '';
    document.getElementById('login-role').value = window.MedApp.state.profile.role || 'PG';
    document.getElementById('gating-toggle').checked = this.progress.data.masteryGatingEnabled;
    if (!d.open) d.showModal();
  }

  closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('open');
  }

  bindGlobalListeners() {
    document.getElementById('landing-logo-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.getElementById('enter-course-btn')?.addEventListener('click', () => this.enterClassroom(0, 1, 'panel-full-chapter'));
    document.getElementById('launch-atlas-direct-btn')?.addEventListener('click', () => this.openClinicalTool('visuals-atlas'));
    document.getElementById('launch-sim-direct-btn')?.addEventListener('click', () => { this.enterClassroom(0); this.openClinicalTool('er-sim'); });
    document.getElementById('launch-param-direct-btn')?.addEventListener('click', () => { this.enterClassroom(0); this.openClinicalTool('param-drill'); });

    document.getElementById('back-to-landing-btn')?.addEventListener('click', () => this.returnToLanding());
    document.getElementById('back-to-landing-logo')?.addEventListener('click', () => this.returnToLanding());
    document.getElementById('open-login-modal-btn')?.addEventListener('click', () => this.openLoginDialog());

    // Hero track selector
    document.querySelectorAll('.hero-track-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        window.MedApp.state.profile.role = pill.dataset.role;
        localStorage.setItem('med-basics-profile', JSON.stringify(window.MedApp.state.profile));
        this.syncProfileUI();
        this.toast(`Track set to ${pill.dataset.role}`);
      });
    });

    // Landing 30-Chapter search
    document.getElementById('landing-chapter-search')?.addEventListener('input', (e) => {
      this.landingChapterSearch = e.target.value;
      this.renderLandingChaptersHub();
    });

    // Sidebar 30-Chapters <-> 10-Units switcher + search
    document.querySelectorAll('.sb-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sb-mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const showCh = btn.dataset.sbmode === 'chapters';
        document.getElementById('sb-chapters-pane').style.display = showCh ? 'block' : 'none';
        document.getElementById('sb-units-pane').style.display = showCh ? 'none' : 'block';
      });
    });
    document.getElementById('sb-chapter-search')?.addEventListener('input', (e) => {
      this.sidebarChapterSearch = e.target.value;
      this.renderSidebar();
    });

    // Landing Reference filters & search
    document.querySelectorAll('.ref-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ref-cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.refCategory = btn.dataset.cat;
        this.renderLandingReferences();
      });
    });
    document.getElementById('landing-ref-search')?.addEventListener('input', (e) => {
      this.refSearch = e.target.value;
      this.renderLandingReferences();
    });

    // Profile/Settings dialog submit
    document.getElementById('login-submit')?.addEventListener('click', () => {
      const name = document.getElementById('login-name').value.trim();
      const role = document.getElementById('login-role').value;
      const gating = document.getElementById('gating-toggle').checked;
      if (name) localStorage.setItem('med-basics-user-name', name);
      window.MedApp.state.profile.role = role;
      localStorage.setItem('med-basics-profile', JSON.stringify(window.MedApp.state.profile));
      this.progress.data.masteryGatingEnabled = gating;
      this.progress.save();
      this.syncProfileUI();
      document.getElementById('login-dialog').close();
      if (document.getElementById('course-player').style.display !== 'none') {
        this.navigateTo(window.MedApp.state.currentModuleId, window.MedApp.state.currentUnitIndex, window.MedApp.state.currentChapterNum);
      }
      this.toast(`Saved: ${role} Track · ${gating ? 'Strict 90% Gate ON' : 'Open Revision Mode'}`);
    });

    // Mobile sidebar & bottom quick-tab bar
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebar-backdrop').classList.toggle('open');
    });
    document.getElementById('sidebar-backdrop')?.addEventListener('click', () => this.closeMobileSidebar());

    document.querySelectorAll('[data-quick-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.closeMobileSidebar();
        this.selectStudyTabByPanel?.(btn.dataset.quickTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('[data-action="dark-mode"]').forEach((btn) => btn.addEventListener('click', () => this.toggleDarkMode()));
    document.querySelectorAll('[data-action="settings"]').forEach((btn) => btn.addEventListener('click', () => this.openLoginDialog()));
    document.querySelectorAll('[data-action="certificate"]').forEach((btn) => btn.addEventListener('click', () => this.openClinicalTool('certificate')));
    document.querySelectorAll('[data-action="units"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebar-backdrop').classList.toggle('open');
      });
    });
    document.querySelectorAll('[data-clinical]').forEach((btn) => {
      btn.addEventListener('click', () => this.openClinicalTool(btn.dataset.clinical));
    });

    document.getElementById('btn-prev-unit')?.addEventListener('click', () => {
      this.navigateTo(window.MedApp.state.currentModuleId, window.MedApp.state.currentUnitIndex - 1);
    });
    document.getElementById('btn-complete')?.addEventListener('click', () => {
      const mod = window.MedApp.data.curriculum?.modules?.[0];
      if (!mod) return;
      const idx = window.MedApp.state.currentUnitIndex;
      if (idx === mod.units.length - 1) this.openClinicalTool('certificate');
      else this.navigateTo(mod.id, idx + 1);
    });
  }

  toast(msg) {
    const host = document.getElementById('toast-container');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast-pill';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

window.app = new MedicineBasicsApp();
window.app.init();
