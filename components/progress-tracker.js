/**
 * Vikkypaedia v9.2 — Progress Tracker, Chapter Read Tracker & SHA-256 Certificate Verification
 * Open revision enabled by default (optional Strict 90% Exam Gate in Settings).
 */

export class ProgressTracker {
  constructor() {
    this.storageKey = 'med-basics-mooc-progress-v92';
    this.data = {
      completedUnits: {},
      readChapters: [],
      quizScores: {},
      lastActive: null,
      streaks: { current: 0, lastStudyDate: null },
      badges: [],
      masteryGatingEnabled: false
    };
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) this.data = { ...this.data, ...JSON.parse(saved) };
      if (!Array.isArray(this.data.readChapters)) this.data.readChapters = [];
    } catch (e) {
      console.warn('Could not load progress:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      window.MedApp?.emit('progressUpdated', this.data);
    } catch (e) {
      console.warn('Could not save progress:', e);
    }
  }

  getLastActive() { return this.data.lastActive; }

  setLastActive(moduleId, unitIndex) {
    this.data.lastActive = { moduleId, unitIndex };
    this.save();
  }

  setChapterRead(chapterNum, isRead) {
    const num = Number(chapterNum);
    if (isRead && !this.data.readChapters.includes(num)) {
      this.data.readChapters.push(num);
      this.updateStreak();
    } else if (!isRead) {
      this.data.readChapters = this.data.readChapters.filter((n) => n !== num);
    }
    this.save();
  }

  isChapterRead(chapterNum) {
    return this.data.readChapters.includes(Number(chapterNum));
  }

  markUnitComplete(moduleId, unitId) {
    if (!this.data.completedUnits[moduleId]) this.data.completedUnits[moduleId] = [];
    if (!this.data.completedUnits[moduleId].includes(unitId)) {
      this.data.completedUnits[moduleId].push(unitId);
      this.updateStreak();
      this.checkBadges();
      this.save();
    }
  }

  isUnitComplete(moduleId, unitId) {
    return (this.data.completedUnits[moduleId] || []).includes(unitId);
  }

  markQuizPassed(moduleId, unitId, score) {
    if (!this.data.quizScores[moduleId]) this.data.quizScores[moduleId] = {};
    const prev = this.data.quizScores[moduleId][unitId] || 0;
    this.data.quizScores[moduleId][unitId] = Math.max(prev, score);
    if (score >= 90) this.markUnitComplete(moduleId, unitId);
    this.save();
  }

  getUnitBestScore(moduleId, unitId) {
    return this.data.quizScores?.[moduleId]?.[unitId] ?? null;
  }

  getOverallProgress(curriculum) {
    if (!curriculum?.modules) return { completed: 0, total: 0, percentage: 0, avgScore: 0, readChapters: 0 };
    let total = 0;
    let completed = 0;
    const scores = [];
    curriculum.modules.forEach((mod) => {
      total += (mod.units || []).length;
      completed += (this.data.completedUnits[mod.id] || []).length;
      Object.values(this.data.quizScores[mod.id] || {}).forEach((s) => scores.push(s));
    });
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgScore,
      readChapters: this.data.readChapters.length
    };
  }

  updateStreak() {
    const today = new Date().toDateString();
    if (this.data.streaks.lastStudyDate !== today) {
      if (this.data.streaks.lastStudyDate) {
        const diffDays = Math.round(Math.abs(Date.now() - new Date(this.data.streaks.lastStudyDate).getTime()) / 86400000);
        this.data.streaks.current = diffDays === 1 ? this.data.streaks.current + 1 : 1;
      } else {
        this.data.streaks.current = 1;
      }
      this.data.streaks.lastStudyDate = today;
    }
  }

  checkBadges() {
    const award = (id) => { if (!this.data.badges.includes(id)) this.data.badges.push(id); };
    const modId = 'module-med-basics-01';
    const done = (this.data.completedUnits[modId] || []).length;
    if (done >= 1) award('bayesian-thinker');
    if (done >= 5) award('cardinal-master');
    if (done >= 10) award('harrison-fellow');
    if (this.data.readChapters.length >= 10) award('deep-reader');
  }

  async generateVerificationHash(learnerName, role, overallStats) {
    const payload = `VIKKYPAEDIA|HARRISON22E-MEDBASICS-V92|${learnerName}|${role}|U:${overallStats.completed}/${overallStats.total}|CH:${overallStats.readChapters}/30|AVG:${overallStats.avgScore}|${new Date().toISOString().slice(0, 10)}`;
    if (window.crypto?.subtle) {
      const buf = new TextEncoder().encode(payload);
      const hashBuf = await crypto.subtle.digest('SHA-256', buf);
      const hex = [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
      return `VP-H22-${hex.slice(0, 16).toUpperCase()}`;
    }
    let h = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      h ^= payload.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `VP-H22-${(h >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  }
}
