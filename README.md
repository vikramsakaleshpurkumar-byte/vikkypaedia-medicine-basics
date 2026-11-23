# Vikkypaedia Medicine Basics Module (v9.3)

Mobile-first, offline-capable Internal Medicine foundations MOOC grounded in **Harrison's Principles of Internal Medicine, 22nd Edition (Parts 1–3 · 30 Core Chapters)**.

## Key Features
- **30 Complete Readable Chapters (`📖 Full Chapter`):** Full structured chapter prose (~203,500 words) with inline visual strip, Section Jump TOC, live in-chapter search & highlight, `A−`/`A+` reader font controls, read tracking, and a 1-click **⚡ 60-Second Quick Revision** sheet.
- **177 Original Harrison's 22e Tables, Flowcharts, Algorithms & Figures (`📊 Tables & Figures` + Visual Atlas):** Crisp precision-cropped WebP images (`assets/visuals/`) of every table, diagnostic flowchart, ECG, rash photo, and nomogram across all 30 chapters with **Tap-to-Zoom Lightbox** (`60%–240%`) + **10 Interactive Branching Bedside Algorithms** (1 per unit).
- **30 Interactive Chapter Mind Maps (`🧠 Mind Map`):** Pure-SVG zoomable visual mind maps with clickable branch highlights + mobile **🌿 Concept Tree** view.
- **120 Per-Chapter SM-2 Flashcards (`🃏 Flashcards`):** Dedicated 4-card deck per chapter, full-unit deck, or all-120 master deck with spaced-repetition rating & Browse All mode.
- **113 Chapter-Tagged Socratic MCQs (`📝 Chapter Quiz`):** 3–6 MCQs for every individual chapter, L1 (Nurse/Core) · L2 (UG/MBBS) · L3 (PG/Resident) filtering, Khan Academy 3-tier progressive hints, and verified `[Ref X]` rationales.
- **Interactive Clinical Labs (`🧪 Lab & Cases`):**
  - 4 **Andrew Ng Bedside Sandboxes** (Bayesian LR, A–a O₂ Gradient, Albumin-Corrected AG / Winter's / ODS Guardrail, Pharmacokinetics & Cockcroft–Gault CrCl)
  - 5 **Runestone Mobile Tap-to-Sequence Puzzles** (Petechial Sepsis, 10-Min Chest Pain, Coma, Cirrhotic UGIB, Severe Hyperkalemia)
  - **PrairieLearn Dynamic Parameterized Drill Lab** (randomized labs & vitals on every attempt)
  - **3-Case Unfolding Virtual ER Simulator** & **10 Branching Clinical Algorithms**
  - **Tamper-Resistant SHA-256 CME Certificate** & **OLED Night Shift Dark Mode**

## Repository Structure
```text
├── index.html                                  # Modular PWA entry point (GitHub Pages default)
├── styles.css                                  # Mobile-first + OLED Night Shift CSS
├── app.js                                      # Study Cockpit controller (ES modules)
├── manifest.json & sw.js                       # Offline-first PWA manifest + Service Worker
├── Vikkypaedia_Medicine_Basics_Standalone.html # Single-file 100% offline bundle (works via file://)
├── components/                                 # Modular JS engines (Reader, MindMap, Quiz, Sim, Sandboxes...)
├── data/                                       # curriculum.json, chapters.json, references.js, sim-cases.js...
└── source_markdown/                            # 30 Harrison's 22e chapters converted via MarkItDown
```

## Hosting & Local Preview
- **GitHub Pages:** Push this folder to your repository and enable **Settings → Pages → Deploy from branch (`main` / root)**. `.nojekyll` is preconfigured so `index.html`, ES modules, JSON data, and the offline Service Worker (`sw.js`) work automatically on subpath URLs.
- **Single-File Offline Mode:** Open `Vikkypaedia_Medicine_Basics_Standalone.html` directly in any desktop or mobile browser with no server required.
- **Local HTTP Preview:**
  ```bash
  python -m http.server 8080
  ```
  Then visit `http://localhost:8080`.
