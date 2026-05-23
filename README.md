# ✿ Skin Analysis AI

An AI-powered skincare analysis and routine builder. Upload a photo of your face (or skip and enter details manually), and Claude's vision model analyses your skin and generates a fully personalised AM/PM routine with ingredient recommendations.

![React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat&logo=vite)
![Claude Vision](https://img.shields.io/badge/Powered%20by-Claude%20Vision-orange?style=flat)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Quick Start

```bash
git clone https://github.com/paifuu/skincare-analyzer.git
cd skincare-analyzer
npm install
```

Add your Anthropic API key:

```bash
cp .env.example .env
# Edit .env and add your key from https://console.anthropic.com
```

```bash
npm run dev
```

App runs at `http://localhost:5173`.

> **Note:** An Anthropic API key is required for all analysis features. The app calls the Claude API directly from the browser using `anthropic-dangerous-direct-browser-access`. For a production deployment, route API calls through a backend proxy to keep your key private.

---

## ✨ Features

### 📸 Photo Analysis
Upload a photo of your bare face. Claude's vision model visually reads your skin — tone, texture, oiliness, redness, visible pores, pigmentation — and factors this into every recommendation.

### 🧴 Personalised AM/PM Routine
5-step morning routine and 4-step evening routine, each step expandable with:
- Why it works for your specific skin
- Key active ingredients to look for

### 📊 Skin Health Scores
Four animated score rings — Hydration, Clarity, Texture, Radiance — plus an overall score out of 100.

### 🌿 Ingredient Intelligence
- Key ingredients recommended for your skin type and concerns
- Ingredients to actively avoid
- One personalised expert tip

### 📅 Weekly Treatments
Targeted treatments (exfoliants, masks, actives) with recommended frequency.

### 📤 Shareable Card
Generates a PNG card (640×820) with your photo, scores, concerns, and key ingredients — ready to save and share. Right-click the preview to save, or use the Download button.

---

## 🧠 How the Analysis Works

When you upload a photo, it's converted to base64 and sent directly to Claude's vision API:

```js
messages: [{
  role: "user",
  content: [
    {
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: base64ImageData }
    },
    { type: "text", text: analysisPrompt }
  ]
}]
```

Claude visually observes your skin alongside your self-reported skin type, concerns, and age — the same way a skincare consultant would assess your skin in a consultation. The scores and routine are generated holistically from both the visual analysis and your inputs.

If you skip the photo, Claude uses only your self-reported information to generate the routine.

---

## 🗂️ Project Structure

```
skincare-analyzer/
├── src/
│   ├── App.jsx       # Full app — analysis engine, all UI, share card
│   └── main.jsx      # React entry point
├── docs/
│   └── PRD.md        # Product Requirements Document
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

---

## 🏗️ Tech Stack

- **React 18** + **Vite 5**
- **Claude Vision API** (claude-sonnet) — photo analysis + routine generation
- **Canvas API** — shareable PNG card generation, no external libs needed
- **CSS-in-JS (inline styles)** — zero stylesheet dependencies

---

## 🎨 Design

Dark, moody aesthetic with rose/pink accents on a deep plum background. Georgia serif throughout. Ambient gradient blobs, dot grid background texture, animated score rings with spring easing.

---

## 📄 Docs

See [`docs/PRD.md`](docs/PRD.md) for full product requirements, API design, prompt engineering, and share card specification.

---

## ⚠️ Disclaimer

This app provides AI-generated skincare suggestions for informational purposes only. It is not a substitute for professional dermatological advice. Always patch-test new products and consult a dermatologist for persistent skin concerns.

---

## 📄 License

MIT
