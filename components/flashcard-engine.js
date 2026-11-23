/**
 * Vikkypaedia v9.2 — SM-2 Spaced Repetition Flashcard Engine
 * Supports individual chapter decks (all 30 Harrison's 22e chapters), unit decks,
 * or the complete 120+ card Medicine Basics deck with tap-to-flip & Browse/SM-2 modes.
 */

export const HARRISON_FLASHCARDS = [
  { id: "fc-01", ch: "Ch. 4", front: "Bayes' Theorem Formula for Diagnostic Testing", back: "Post-test Odds = Pre-test Odds × Likelihood Ratio (LR). LR+ > 10 strongly rules in; LR− < 0.1 strongly rules out." },
  { id: "fc-02", ch: "Ch. 20", front: "Harrison's 22e Temperature Cutoff Defining Fever vs Hyperpyrexia", back: "Fever = Oral temp > 37.7°C (>99.9°F, 99th percentile). Hyperpyrexia = > 41.5°C. Hyperthermia has an UNCHANGED set-point and ignores antipyretics." },
  { id: "fc-03", ch: "Ch. 56", front: "Maximum Safe 24h & 48h Correction Limits in Chronic Hyponatremia", back: "Never exceed 8–10 mEq/L in 24h (cap at 4–6 mEq/L in alcoholism, malnutrition, cirrhosis, or K+ <3.0) or 18 mEq/L in 48h to prevent ODS." },
  { id: "fc-04", ch: "Ch. 58", front: "Winter's Equation & Albumin-Corrected Anion Gap Formula", back: "Winter's: Expected PaCO2 = (1.5 × HCO3-) + 8 ± 2. Albumin-corrected AG = Measured AG + 2.5 × (4.0 − Serum Albumin g/dL)." }
];

export class FlashcardEngine {
  constructor(containerEl, customCards = null, deckTitle = "Harrison's 22e Flashcards") {
    this.containerEl = containerEl;
    this.deckTitle = deckTitle;
    this.storageKey = 'med-basics-flashcards-sm2';
    this.progress = {};
    this.browseMode = false;
    this.browseIndex = 0;
    this.flipped = false;
    this.loadProgress();
    this.initDeck(customCards && customCards.length ? customCards : HARRISON_FLASHCARDS);
  }

  loadProgress() {
    try { this.progress = JSON.parse(localStorage.getItem(this.storageKey) || '{}'); }
    catch { this.progress = {}; }
  }

  saveProgress() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.progress)); } catch {}
  }

  initDeck(rawCards) {
    this.cards = rawCards.map((c) => {
      const saved = this.progress[c.id];
      return {
        ...c,
        ch: c.ch || c.chapter || "Harrison's 22e",
        easeFactor: saved?.easeFactor ?? 2.5,
        interval: saved?.interval ?? 0,
        repetitions: saved?.repetitions ?? 0,
        nextReview: saved?.nextReview ?? 0
      };
    });
  }

  getDueCards() {
    const now = Date.now();
    return this.cards.filter((c) => c.nextReview <= now);
  }

  reviewCard(cardId, quality) {
    const card = this.cards.find((c) => c.id === cardId);
    if (!card) return;
    if (quality < 3) {
      card.repetitions = 0;
      card.interval = 0;
      card.nextReview = Date.now() + 60 * 1000;
    } else {
      if (card.repetitions === 0) card.interval = 1;
      else if (card.repetitions === 1) card.interval = 6;
      else card.interval = Math.round(card.interval * card.easeFactor);
      card.repetitions++;
      card.nextReview = Date.now() + card.interval * 86400000;
    }
    card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    this.progress[card.id] = {
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
      nextReview: card.nextReview
    };
    this.saveProgress();
  }

  render() {
    if (!this.containerEl) return;
    const due = this.getDueCards();
    const mastered = this.cards.filter((c) => c.repetitions >= 2).length;
    const activeList = this.browseMode ? this.cards : due;

    const headerHtml = `
      <div class="fc-deck-bar">
        <div>
          <span class="sandbox-tag">🃏 ${this.deckTitle}</span>
          <div class="fc-sub-stats">Total: <strong>${this.cards.length}</strong> &middot; Due: <strong>${due.length}</strong> &middot; Mastered: <strong>${mastered}</strong></div>
        </div>
        <div class="fc-mode-pills">
          <button type="button" class="preset-btn ${!this.browseMode ? 'active' : ''}" data-fcmode="sm2">🧠 SM-2 Due (${due.length})</button>
          <button type="button" class="preset-btn ${this.browseMode ? 'active' : ''}" data-fcmode="browse">📚 Browse All (${this.cards.length})</button>
        </div>
      </div>
    `;

    if (!activeList.length) {
      this.containerEl.innerHTML = `
        <div class="flashcard-engine">
          ${headerHtml}
          <div class="flashcard-done">
            <h3>🎉 All ${this.cards.length} Cards in This Deck Reviewed!</h3>
            <p>Switch to <strong>Browse All</strong> to revise every card right now, or reset this deck's SM-2 queue.</p>
            <div style="display:flex;gap:0.6rem;justify-content:center;flex-wrap:wrap;margin-top:0.85rem;">
              <button type="button" class="quiz-retry-btn" id="fc-reset-all">↺ Practice Deck Again</button>
              <button type="button" class="preset-btn" data-fcmode="browse">📚 Browse All Cards</button>
            </div>
          </div>
        </div>
      `;
      this.bindModeEvents();
      this.containerEl.querySelector('#fc-reset-all')?.addEventListener('click', () => {
        this.cards.forEach((c) => { c.nextReview = 0; });
        this.flipped = false;
        this.render();
      });
      return;
    }

    const idx = this.browseMode ? (this.browseIndex % activeList.length) : 0;
    const card = activeList[idx];

    this.containerEl.innerHTML = `
      <div class="flashcard-engine">
        ${headerHtml}
        <div class="fc-meta">
          <span class="fc-ch-pill">Harrison's 22e · ${card.ch}</span>
          <span>Card <strong>${idx + 1}</strong> of <strong>${activeList.length}</strong></span>
        </div>

        <div class="flashcard-card ${this.flipped ? 'is-flipped' : ''}" id="fc-tap-card" role="button" tabindex="0" aria-label="Tap to flip flashcard">
          <div class="fc-front">
            <span class="fc-side-lbl">ACTIVE RECALL PROMPT (TAP CARD TO FLIP)</span>
            <h4>${card.front}</h4>
          </div>
          <div class="fc-back" id="fc-back" style="display:${this.flipped ? 'block' : 'none'};">
            <span class="fc-side-lbl">VERIFIED HARRISON'S 22e ANSWER</span>
            <p>${card.back}</p>
          </div>
        </div>

        <div class="fc-controls">
          ${!this.flipped
            ? `<button type="button" class="fc-flip-btn" id="fc-flip">Tap to Reveal Answer</button>`
            : this.browseMode
              ? `<div class="quiz-bottom-bar" style="margin-top:0;">
                   <button type="button" class="quiz-prev-btn" id="fc-prev">← Prev Card</button>
                   <button type="button" class="quiz-next-btn" id="fc-next">Next Card →</button>
                 </div>`
              : `<div class="fc-rating-row" style="display:grid;">
                   <button type="button" class="fc-rate-btn rate-again" data-q="1">Again (1m)</button>
                   <button type="button" class="fc-rate-btn rate-hard" data-q="3">Hard (1d)</button>
                   <button type="button" class="fc-rate-btn rate-good" data-q="4">Good (${Math.max(1, card.interval || 1)}d)</button>
                   <button type="button" class="fc-rate-btn rate-easy" data-q="5">Easy (6d+)</button>
                 </div>`
          }
        </div>
      </div>
    `;

    this.bindModeEvents();
    const flipNow = () => { this.flipped = !this.flipped; this.render(); };
    this.containerEl.querySelector('#fc-flip')?.addEventListener('click', flipNow);
    this.containerEl.querySelector('#fc-tap-card')?.addEventListener('click', flipNow);
    this.containerEl.querySelector('#fc-prev')?.addEventListener('click', () => {
      this.browseIndex = (this.browseIndex - 1 + activeList.length) % activeList.length;
      this.flipped = false;
      this.render();
    });
    this.containerEl.querySelector('#fc-next')?.addEventListener('click', () => {
      this.browseIndex = (this.browseIndex + 1) % activeList.length;
      this.flipped = false;
      this.render();
    });
    this.containerEl.querySelectorAll('[data-q]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.reviewCard(card.id, parseInt(btn.dataset.q, 10));
        this.flipped = false;
        this.render();
      });
    });
  }

  bindModeEvents() {
    this.containerEl.querySelectorAll('[data-fcmode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.browseMode = btn.dataset.fcmode === 'browse';
        this.browseIndex = 0;
        this.flipped = false;
        this.render();
      });
    });
  }
}
