# Skin Analysis AI — Product Requirements Document

**Version:** 1.0  
**Date:** May 2026  
**Status:** Live

---

## 1. Overview

### 1.1 Product Summary

Skin Analysis AI is a browser-based React application that uses Claude's vision and language capabilities to analyse a user's skin from a photo and generate a fully personalised skincare routine. The app combines visual skin assessment, user-reported concerns, and dermatology-informed prompt engineering to produce AM/PM routines, ingredient recommendations, skin health scores, and a shareable PNG card.

### 1.2 Problem Statement

Most skincare advice is generic — "for oily skin, use a gel cleanser" — and ignores the individual. Dermatology consultations are expensive and inaccessible. Existing AI skincare apps either require proprietary hardware (skin scanners) or produce low-quality cookie-cutter recommendations. This app uses frontier vision AI to bridge the gap: expert-level, visually-informed, personalised skincare guidance in under 30 seconds.

### 1.3 Goals

- Analyse a user's skin visually from a photo using Claude's vision API
- Generate a personalised AM/PM routine with ingredient-level detail
- Score skin health across 4 dimensions (Hydration, Clarity, Texture, Radiance)
- Produce a shareable PNG card suitable for social media
- Be fast, private (no data stored server-side), and free to self-host

---

## 2. Users

**Primary:** Skincare enthusiasts who want personalised, evidence-based routines  
**Secondary:** Beginners overwhelmed by skincare options who need a starting point  
**Tertiary:** Content creators sharing skincare journeys on social media

---

## 3. User Flow

```
Upload Photo (optional)
        ↓
Enter Skin Type + Concerns + Age
        ↓
Claude Vision API call (image + prompt)
        ↓
Animated analysis (4 phases)
        ↓
Results: Scores → Overview → AM Routine → PM Routine → Weekly
        ↓
Share Card (PNG download)
```

---

## 4. Features

### 4.1 Photo Upload

**Description:** User uploads a photo of their bare face for visual analysis.

**Requirements:**
- Drag & drop or click-to-browse file input
- Accepts JPG, PNG, WEBP
- Preview shown as circular avatar after upload
- User can remove and re-upload before analysis
- Skip option for manual-only analysis
- File converted to base64 for API transmission (no server upload)

**Privacy note:** The image is sent directly to Anthropic's API and never stored by this application.

---

### 4.2 Skin Profile Form

**Description:** User selects their skin type and concerns before analysis runs.

**Skin Types:** Oily, Dry, Combination, Normal, Sensitive

**Concerns (multi-select):**
- Acne / Breakouts
- Hyperpigmentation
- Fine Lines
- Dullness
- Redness
- Dehydration
- Large Pores
- Dark Circles
- Texture
- Sun Damage

**Age:** Optional number input. Used to adjust recommendations (e.g. retinol strength, anti-aging focus).

**Validation:** Skin type is required before analysis can run. All other fields optional.

---

### 4.3 Analysis Engine (Claude API)

**Model:** `claude-sonnet-4-20250514`  
**Max tokens:** 2000  
**Input:** Multimodal message — base64 image (if provided) + structured text prompt

**Prompt design:**
The prompt requests a structured JSON response with:
- Skin type confirmation
- 2-sentence skin description
- Scores: hydration, clarity, texture, radiance, overall (all 0–100)
- Top concerns detected (array)
- Key recommended ingredients (array)
- AM routine: 5 steps, each with type, product, why, ingredients
- PM routine: 4 steps
- Weekly treatments (array with frequencies)
- Ingredients to avoid (array)
- One personalised pro tip

**Response parsing:**
```js
const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
const clean = text.replace(/```json|```/g, "").trim();
const parsed = JSON.parse(clean);
```

**Fallback:** If the API call fails (no key, network error), a locally-generated analysis is produced using hardcoded ingredient databases and product templates keyed by skin type. The app never shows a blank error state.

---

### 4.4 Results Display

**Skin Health Scores**

Four animated SVG rings (Hydration, Clarity, Texture, Radiance) with spring-easing fill animation on mount. Overall score shown as a number/100 with an animated progress bar.

Ring implementation:
```jsx
// SVG circle with stroke-dasharray animated from 0 to (value/100 * circumference)
strokeDasharray={`${(value/100) * circumference} ${circumference}`}
```

**Tabbed Content**

| Tab | Content |
|---|---|
| Overview | Concerns, key ingredients, ingredients to avoid, expert tip |
| AM Routine | 5 expandable steps with why + ingredients |
| PM Routine | 4 expandable steps |
| Weekly | Treatments with frequencies |

**Routine Step component:** Accordion — collapsed by default, expands on click to show rationale and ingredient tags.

---

### 4.5 Shareable Image Card

**Description:** Generates a 640×820px PNG using the Canvas API, compositing the user's photo, scores, concerns, and key ingredients into a branded dark card.

**Canvas composition layers (top to bottom):**
1. Dark gradient background (`#0f0c1a → #1a0f1f → #0c1218`)
2. Dot grid texture overlay
3. Pink border (outer + inner inset)
4. Header text: "✦ SKIN ANALYSIS ✦"
5. User photo clipped to circle (80px radius) — fetched from the in-memory base64 dataUrl
6. Skin type badge (pill shape)
7. 4 score rings drawn with arc + strokeDasharray equivalent
8. Concerns section (2-column grid of rounded rect badges)
9. Key ingredients section (3-column pill grid)
10. Overall rating box with mini progress bar
11. Footer: "SKIN ANALYSIS AI · POWERED BY CLAUDE"

**Image loading:**
```js
function loadImg(src) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}
```

**Output:** `canvas.toDataURL("image/png")` rendered into an `<img>` tag. User right-clicks to save or uses the Download PNG `<a download>` link.

---

## 5. Design System

### Colour Palette

| Token | Value | Usage |
|---|---|---|
| Background | `#0a0810` | App background |
| Surface | `#0f0c1a` | Cards, modals |
| Accent primary | `#e8a0b0` | Borders, rings, highlights |
| Accent deep | `#c06080` | Gradient starts, filled states |
| Text primary | `#e8d4da` | Headings, body |
| Text muted | `#9a7a85` | Labels, secondary text |
| Danger | `#c08080` | Avoid ingredients |

### Typography

- **Primary font:** Georgia, serif — all UI text, headings, body
- **Monospace:** system monospace — labels, metadata, uppercase tags

### Motion

- Score rings: `transition: stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)` (spring overshoot)
- Progress bar: `transition: width 1.5s ease`
- Accordion: instant open, content fades in
- Analyzing spinner: `animation: spin 3s linear infinite`
- Phase dots: `transition: background 0.5s`

### Layout

- Max content width: 720px (results), 620px (form), 560px (upload)
- All padding: 24px horizontal on mobile, 32px on wider screens
- Fully inline styles — zero external CSS dependencies

---

## 6. API Integration

### Request format (with photo)

```js
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 2000,
  messages: [{
    role: "user",
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",  // or image/png, image/webp
          data: "<base64 string>"
        }
      },
      { type: "text", text: "<analysis prompt>" }
    ]
  }]
}
```

### Request format (no photo)

```js
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 2000,
  messages: [{ role: "user", content: "<analysis prompt>" }]
}
```

### Authentication

The API key is read from `import.meta.env.VITE_ANTHROPIC_API_KEY` and passed as `x-api-key` header. The `anthropic-dangerous-direct-browser-access: true` header is required for direct browser calls.

**Production recommendation:** Proxy API calls through a serverless function (Vercel/Netlify edge function, Cloudflare Worker) to avoid exposing the key in the browser.

---

## 7. Local Fallback Data

If the API call fails, the app generates a fallback analysis using:

```js
const INGREDIENT_DB = {
  oily:        ["Niacinamide 10%", "Salicylic Acid 2%", "Zinc PCA", ...],
  dry:         ["Hyaluronic Acid", "Ceramides", "Squalane", ...],
  combination: ["Niacinamide 5%", "Hyaluronic Acid", "Centella Asiatica", ...],
  normal:      ["Vitamin C 10%", "Retinol 0.3%", "Peptides", ...],
  sensitive:   ["Centella Asiatica", "Allantoin", "Aloe Vera", ...],
};

const PRODUCT_TEMPLATES = {
  cleanser: { oily: "Gel / Foam Cleanser", dry: "Cream / Oil Cleanser", ... },
  moisturizer: { oily: "Lightweight Gel Moisturizer", ... },
};
```

Scores are adjusted based on skin type and selected concerns (e.g. lower Clarity score if "Acne / Breakouts" is selected).

---

## 8. Known Limitations

- **API key exposure:** Direct browser calls expose the key in network requests. Acceptable for personal/demo use; requires backend proxy for production.
- **Photo quality dependency:** Low-light, blurry, or heavily filtered photos reduce analysis accuracy. The app doesn't validate photo quality before submission.
- **No persistent storage:** Session-only — all data cleared on page refresh.
- **Not a medical device:** Scores and recommendations are AI estimates, not clinical measurements.

---

## 9. Future Roadmap

| Priority | Feature |
|---|---|
| High | Ingredient conflict checker — flag when two products in the routine shouldn't be layered |
| High | Product search — match routine steps to real purchasable products via an API |
| Medium | Progress tracking — weekly photo uploads with before/after comparison |
| Medium | Routine export — PDF or printable format |
| Low | Multiple skin zones — separate analysis for T-zone vs cheeks vs under-eyes |
| Low | Partner/family mode — save multiple profiles |
| Low | Ingredient scanner — point camera at product label, auto-analyse ingredients |
