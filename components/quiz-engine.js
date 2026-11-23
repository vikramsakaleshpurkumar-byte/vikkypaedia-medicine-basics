/**
 * Vikkypaedia v9.2 — Board-Style Mastery Quiz Engine with Individual Chapter Filtering
 * Features:
 * - Filter by Individual Harrison's 22e Chapter (Ch. 1, Ch. 4, Ch. 10, etc.) AND by Competency Tier (L1/L2/L3)
 * - Khan Academy 3-Tier Socratic Progressive Hinting (Recall Probe -> Clinical Rule -> Harrison Anchor)
 * - Strict 90% Mastery Grading, Navigator Pills, Spaced Recall Flagging & Clickable Onsite Citations
 */

import { REFERENCES, LESSON_REFS } from '../data/references.js';

export class QuizEngine {
  constructor(containerEl, questions, options = {}) {
    this.containerEl = containerEl;
    this.allQuestions = (questions || []).map((q) => this.normalizeQuestion(q));
    this.options = options;
    this.unitIndex = options.unitIndex ?? (window.MedApp?.state?.currentUnitIndex || 0);
    this.passThreshold = options.passThreshold ?? 90;
    this.activeTierFilter = 'ALL';
    this.activeChapterFilter = options.initialChapterFilter || 'ALL';
    this.availableChapters = [...new Set(this.allQuestions.map((q) => q.chapter).filter(Boolean))];
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {};
    this.hintLevels = {};
    this.flagged = new Set();
    this.computeFilteredQuestions();
  }

  normalizeQuestion(q) {
    const text = q.text || q.stem || '';
    let opts = [];
    if (Array.isArray(q.options)) {
      opts = q.options.map((o, idx) =>
        typeof o === 'string'
          ? { text: o, correct: idx === q.correctIndex }
          : { text: o.text, correct: Boolean(o.correct) }
      );
    }
    const hints = Array.isArray(q.hints) && q.hints.length > 0
      ? q.hints
      : [
          "Pause and identify the primary physiologic mechanism or life-threatening red flag in the stem.",
          "Apply the bedside decision threshold or rule highlighted in this chapter's revision sheet.",
          "Anchor your choice to the primary Harrison's 22nd Edition chapter mapped below."
        ];
    return {
      ...q,
      text,
      chapter: q.chapter || q.category || '',
      options: opts,
      hints,
      tier: (q.tier || 'L1').toUpperCase()
    };
  }

  computeFilteredQuestions() {
    this.questions = this.allQuestions.filter((q) => {
      const chOk = this.activeChapterFilter === 'ALL' || q.chapter === this.activeChapterFilter;
      const tierOk = this.activeTierFilter === 'ALL' || q.tier === this.activeTierFilter;
      return chOk && tierOk;
    });
    if (!this.questions.length && this.allQuestions.length) {
      this.activeTierFilter = 'ALL';
      this.questions = this.allQuestions.filter((q) =>
        this.activeChapterFilter === 'ALL' || q.chapter === this.activeChapterFilter
      );
    }
    if (!this.questions.length) {
      this.activeChapterFilter = 'ALL';
      this.questions = [...this.allQuestions];
    }
  }

  applyChapterFilter(ch) {
    this.activeChapterFilter = ch;
    this.computeFilteredQuestions();
    this.currentIndex = 0;
    this.userAnswers = {};
    this.hintLevels = {};
    this.renderQuestion();
  }

  applyTierFilter(tier) {
    this.activeTierFilter = tier;
    this.computeFilteredQuestions();
    this.currentIndex = 0;
    this.userAnswers = {};
    this.hintLevels = {};
    this.renderQuestion();
  }

  getQuestionCitations(q) {
    const text = `${q.text || ''} ${q.rationale || ''}`;
    const matched = new Set();
    const explicit = [...text.matchAll(/\[?Ref\s+(\d+)\]?/gi)].map((m) => parseInt(m[1], 10));
    explicit.forEach((id) => { if (REFERENCES.some((r) => r.id === id)) matched.add(id); });
    const unitRefs = LESSON_REFS[this.unitIndex] || [1, 3, 7];
    for (const rId of unitRefs) {
      if (matched.size >= 3) break;
      matched.add(rId);
    }
    return [...matched].slice(0, 4);
  }

  renderTierBadge(tier = 'L1') {
    const map = {
      L1: { label: 'L1 · Nurse / Core', cls: 'q-tier-l1' },
      L2: { label: 'L2 · UG / MBBS', cls: 'q-tier-l2' },
      L3: { label: 'L3 · PG / Resident', cls: 'q-tier-l3' }
    };
    const info = map[tier.toUpperCase()] || map.L1;
    return `<span class="q-tier-badge ${info.cls}">${info.label}</span>`;
  }

  render() {
    if (!this.containerEl || !this.allQuestions.length) return;
    this.currentIndex = 0;
    this.userAnswers = {};
    this.hintLevels = {};
    this.renderQuestion();
  }

  renderQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    const qNum = this.currentIndex + 1;
    const total = this.questions.length;
    const prevAnswer = this.userAnswers[this.currentIndex];
    const isAnswered = prevAnswer !== undefined;
    const isFlagged = this.flagged.has(this.currentIndex);
    const refIds = this.getQuestionCitations(q);
    const hintLvl = this.hintLevels[this.currentIndex] || 0;
    const hintLabels = ['Recall Probe', 'Clinical Rule', "Harrison's 22e Anchor"];

    const chapterPool = this.activeChapterFilter === 'ALL'
      ? this.allQuestions
      : this.allQuestions.filter((x) => x.chapter === this.activeChapterFilter);
    const l1Count = chapterPool.filter((x) => x.tier === 'L1').length;
    const l2Count = chapterPool.filter((x) => x.tier === 'L2').length;
    const l3Count = chapterPool.filter((x) => x.tier === 'L3').length;

    const chapterBarHTML = this.availableChapters.length > 1
      ? `<div class="quiz-filter-bar quiz-ch-bar">
           <div class="quiz-filter-group">
             <span class="quiz-filter-label">Chapter Quiz:</span>
             <button type="button" class="q-ch-btn ${this.activeChapterFilter === 'ALL' ? 'active' : ''}" data-qch="ALL">All Unit (${this.allQuestions.length})</button>
             ${this.availableChapters.map((ch) => {
               const cnt = this.allQuestions.filter((x) => x.chapter === ch).length;
               return `<button type="button" class="q-ch-btn ${this.activeChapterFilter === ch ? 'active' : ''}" data-qch="${ch}">${ch} (${cnt})</button>`;
             }).join('')}
           </div>
         </div>`
      : '';

    const pillsHTML = this.questions.map((item, idx) => {
      const ans = this.userAnswers[idx];
      let cls = '';
      if (idx === this.currentIndex) cls += ' active';
      if (ans !== undefined) cls += item.options[ans]?.correct ? ' pill-correct' : ' pill-wrong';
      if (this.flagged.has(idx)) cls += ' pill-flagged';
      return `<button type="button" class="quiz-nav-pill ${cls}" data-qidx="${idx}" aria-label="Jump to Question ${idx + 1}">${idx + 1}</button>`;
    }).join('');

    this.containerEl.innerHTML = `
      <div class="quiz-container">
        ${chapterBarHTML}

        <div class="quiz-filter-bar">
          <div class="quiz-filter-group">
            <span class="quiz-filter-label">Tier:</span>
            <button type="button" class="q-filter-btn ${this.activeTierFilter === 'ALL' ? 'active' : ''}" data-tier="ALL">All (${chapterPool.length})</button>
            ${l1Count ? `<button type="button" class="q-filter-btn ${this.activeTierFilter === 'L1' ? 'active' : ''}" data-tier="L1">L1 (${l1Count})</button>` : ''}
            ${l2Count ? `<button type="button" class="q-filter-btn ${this.activeTierFilter === 'L2' ? 'active' : ''}" data-tier="L2">L2 (${l2Count})</button>` : ''}
            ${l3Count ? `<button type="button" class="q-filter-btn ${this.activeTierFilter === 'L3' ? 'active' : ''}" data-tier="L3">L3 (${l3Count})</button>` : ''}
          </div>
          <button type="button" class="q-flag-btn ${isFlagged ? 'flagged' : ''}" id="q-flag-toggle">
            ${isFlagged ? '★ Flagged' : '☆ Flag'}
          </button>
        </div>

        <div class="quiz-pills-row">${pillsHTML}</div>

        <div class="quiz-progress-info">
          <span>Question <strong>${qNum}</strong> of <strong>${total}</strong> &middot; Mastery Target: <strong>${this.passThreshold}%</strong></span>
          <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;">
            ${q.chapter ? `<span class="fc-ch-pill">${q.chapter}</span>` : ''}
            ${this.renderTierBadge(q.tier)}
          </div>
        </div>

        <h3 class="quiz-stem-text">${q.text}</h3>

        <div class="hint-accordion">
          ${q.hints.slice(0, hintLvl).map((h, i) => `
            <div class="hint-bubble hint-tier-${i + 1}">
              <strong>💡 Hint ${i + 1} (${hintLabels[i] || 'Guidance'}):</strong>
              <p>${h}</p>
            </div>
          `).join('')}
          ${!isAnswered && hintLvl < q.hints.length ? `
            <button type="button" class="btn-request-hint" id="btn-socratic-hint">
              💡 Need a Socratic Hint? (${hintLvl + 1} of ${q.hints.length} · ${hintLabels[hintLvl]})
            </button>
          ` : ''}
        </div>

        <div class="quiz-options-list">
          ${q.options.map((opt, i) => {
            let cls = 'quiz-option';
            let prefix = `<span class="opt-letter">${String.fromCharCode(65 + i)}</span>`;
            if (isAnswered) {
              if (opt.correct) { cls += ' correct'; prefix = `<span class="opt-letter">✓</span>`; }
              else if (i === prevAnswer && !opt.correct) { cls += ' wrong'; prefix = `<span class="opt-letter">✗</span>`; }
            }
            return `<button type="button" class="${cls}" data-index="${i}" ${isAnswered ? 'disabled' : ''}>${prefix}<span class="opt-text">${opt.text}</span></button>`;
          }).join('')}
        </div>

        <div class="quiz-feedback" style="display:${isAnswered ? 'block' : 'none'};">
          ${isAnswered ? this.renderRationaleHTML(q, q.options[prevAnswer]?.correct, refIds) : ''}
        </div>

        <div class="quiz-bottom-bar">
          <button type="button" class="quiz-prev-btn" ${this.currentIndex === 0 ? 'disabled' : ''}>← Prev</button>
          <div class="quiz-bottom-actions">
            ${Object.keys(this.userAnswers).length === this.questions.length
              ? `<button type="button" class="quiz-results-btn">Grade Assessment 🏆</button>`
              : ''}
            <button type="button" class="quiz-next-btn">
              ${qNum < total ? 'Next →' : 'Finish & Grade →'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.containerEl.querySelectorAll('.q-ch-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.applyChapterFilter(btn.dataset.qch));
    });
    this.containerEl.querySelectorAll('.q-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.applyTierFilter(btn.dataset.tier));
    });
    this.containerEl.querySelector('#q-flag-toggle')?.addEventListener('click', () => {
      if (this.flagged.has(this.currentIndex)) this.flagged.delete(this.currentIndex);
      else this.flagged.add(this.currentIndex);
      this.renderQuestion();
    });
    this.containerEl.querySelector('#btn-socratic-hint')?.addEventListener('click', () => {
      this.hintLevels[this.currentIndex] = Math.min(q.hints.length, hintLvl + 1);
      this.renderQuestion();
    });
    this.containerEl.querySelectorAll('.quiz-nav-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        this.currentIndex = parseInt(pill.dataset.qidx, 10);
        this.renderQuestion();
      });
    });
    this.containerEl.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.userAnswers[this.currentIndex] !== undefined) return;
        this.userAnswers[this.currentIndex] = parseInt(btn.dataset.index, 10);
        this.renderQuestion();
      });
    });
    this.containerEl.querySelector('.quiz-prev-btn')?.addEventListener('click', () => {
      if (this.currentIndex > 0) { this.currentIndex--; this.renderQuestion(); }
    });
    this.containerEl.querySelector('.quiz-next-btn')?.addEventListener('click', () => {
      if (this.currentIndex < this.questions.length - 1) { this.currentIndex++; this.renderQuestion(); }
      else this.showResults();
    });
    this.containerEl.querySelector('.quiz-results-btn')?.addEventListener('click', () => this.showResults());
    this.bindCitationChips();
  }

  renderRationaleHTML(q, isCorrect, refIds) {
    const chips = refIds.map((id) => {
      const ref = REFERENCES.find((r) => r.id === id);
      return ref ? `<button type="button" class="cite-chip" data-ref-id="${ref.id}">[Ref ${ref.id}: ${ref.tag}]</button>` : '';
    }).join('');

    return `
      <div class="${isCorrect ? 'quiz-rationale correct' : 'quiz-rationale wrong'}">
        <div class="rationale-header">
          <strong>${isCorrect ? '✅ Correct — Harrison’s 22e Rationale' : '❌ Incorrect — Clinical Teaching Pearl'}</strong>
        </div>
        ${q.rationale ? `<p class="rationale-text">${q.rationale}</p>` : ''}
        <div class="onsite-cite-bar">
          <span class="onsite-cite-label">📖 Verified Sources:</span>
          ${chips}
        </div>
      </div>
    `;
  }

  bindCitationChips() {
    this.containerEl.querySelectorAll('.cite-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        window.app?.showSingleReferenceModal(parseInt(chip.dataset.refId, 10));
      });
    });
  }

  showResults() {
    const stats = this.getScore();
    const passed = stats.percentage >= this.passThreshold;

    const tierStats = ['L1', 'L2', 'L3'].map((t) => {
      const indices = this.questions.map((q, i) => (q.tier === t ? i : -1)).filter((i) => i !== -1);
      const correct = indices.filter((i) => {
        const ans = this.userAnswers[i];
        return ans !== undefined && this.questions[i].options[ans]?.correct;
      }).length;
      return { tier: t, correct, total: indices.length };
    }).filter((t) => t.total > 0);

    this.containerEl.innerHTML = `
      <div class="quiz-results">
        <h3>${passed ? '🎉 Mastery Verified!' : '📝 Review & Retry Recommended'}</h3>
        <div class="quiz-score-ring ${passed ? 'ring-pass' : 'ring-fail'}">
          <span class="score-pct">${stats.percentage}%</span>
          <span class="score-detail">${stats.correct} / ${stats.total} Correct</span>
        </div>
        <p>${passed
          ? `Outstanding Harrison's 22e clinical mastery (${this.activeChapterFilter === 'ALL' ? 'Full Unit' : this.activeChapterFilter})!`
          : `Target mastery is ${this.passThreshold}%. Review every rationale below, flip the chapter flashcards, or try a fresh parameterized drill.`
        }</p>

        <div class="tier-breakdown-grid">
          ${tierStats.map((ts) => `
            <div class="tier-stat-card">
              <strong>${ts.tier} Tier</strong>
              <span>${ts.correct} / ${ts.total} (${Math.round((ts.correct / ts.total) * 100)}%)</span>
            </div>
          `).join('')}
        </div>

        <div class="quiz-result-actions">
          <button type="button" class="quiz-retry-btn">↺ Retry Quiz</button>
          <button type="button" class="quiz-review-btn" id="toggle-review-key">🔍 Review All Rationales</button>
          <button type="button" class="quiz-param-btn" id="open-param-drill">🎲 Parameterized Drill</button>
        </div>

        <div id="full-quiz-review" style="display:none;text-align:left;margin-top:1.25rem;">
          ${this.questions.map((q, idx) => {
            const ans = this.userAnswers[idx];
            const ok = ans !== undefined && q.options[ans]?.correct;
            const correctOpt = q.options.find((o) => o.correct);
            return `
              <div class="review-item-card ${ok ? 'rev-ok' : 'rev-err'}">
                <div class="rev-top">
                  <strong>Q${idx + 1} (${q.chapter}): ${ok ? '✅ Correct' : '❌ Missed'}</strong>
                  ${this.renderTierBadge(q.tier)}
                </div>
                <p class="rev-stem">${q.text}</p>
                <p class="rev-ans"><strong>Correct:</strong> ${correctOpt ? correctOpt.text : ''}</p>
                <p class="rev-rat">${q.rationale || ''}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.containerEl.querySelector('.quiz-retry-btn')?.addEventListener('click', () => {
      this.userAnswers = {};
      this.hintLevels = {};
      this.currentIndex = 0;
      this.renderQuestion();
    });
    this.containerEl.querySelector('#toggle-review-key')?.addEventListener('click', () => {
      const el = this.containerEl.querySelector('#full-quiz-review');
      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    });
    this.containerEl.querySelector('#open-param-drill')?.addEventListener('click', () => {
      window.app?.openClinicalTool('param-drill');
    });

    if (this.options.onComplete) this.options.onComplete(stats);
  }

  getScore() {
    let correct = 0;
    this.questions.forEach((q, idx) => {
      const ans = this.userAnswers[idx];
      if (ans !== undefined && q.options[ans]?.correct) correct++;
    });
    return {
      correct,
      total: this.questions.length,
      percentage: this.questions.length > 0 ? Math.round((correct / this.questions.length) * 100) : 0
    };
  }
}
