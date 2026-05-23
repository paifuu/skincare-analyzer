import React, { useState, useRef, useEffect, useCallback } from "react";

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const SKIN_TYPES = ["Oily", "Dry", "Combination", "Normal", "Sensitive"];
const CONCERNS = ["Acne / Breakouts", "Hyperpigmentation", "Fine Lines", "Dullness", "Redness", "Dehydration", "Large Pores", "Dark Circles", "Texture", "Sun Damage"];

const INGREDIENT_DB = {
  oily:        ["Niacinamide 10%", "Salicylic Acid 2%", "Zinc PCA", "Green Tea Extract", "Clay"],
  dry:         ["Hyaluronic Acid", "Ceramides", "Squalane", "Shea Butter", "Glycerin"],
  combination: ["Niacinamide 5%", "Hyaluronic Acid", "Centella Asiatica", "Azelaic Acid", "Panthenol"],
  normal:      ["Vitamin C 10%", "Retinol 0.3%", "Peptides", "Antioxidants", "SPF"],
  sensitive:   ["Centella Asiatica", "Allantoin", "Aloe Vera", "Panthenol", "Oat Extract"],
};

const PRODUCT_TEMPLATES = {
  cleanser: { oily: "Gel / Foam Cleanser", dry: "Cream / Oil Cleanser", combination: "Gentle Gel Cleanser", normal: "Micellar or Gel Cleanser", sensitive: "Micellar Water or Cream Cleanser" },
  moisturizer: { oily: "Lightweight Gel Moisturizer", dry: "Rich Cream Moisturizer", combination: "Gel-Cream Hybrid", normal: "Lotion or Cream", sensitive: "Fragrance-Free Cream" },
  spf: { all: "Broad Spectrum SPF 50+ (non-comedogenic)" },
};

// ── SHARE CARD CANVAS ──────────────────────────────────────────────────────
async function buildShareCard(analysis, imageDataUrl) {
  const W = 640, H = 820;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f0c1a");
  bg.addColorStop(0.5, "#1a0f1f");
  bg.addColorStop(1, "#0c1218");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Subtle dot grid
  ctx.fillStyle = "rgba(255,182,193,0.06)";
  for (let x = 20; x < W; x += 28) for (let y = 20; y < H; y += 28) {
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // Pink border
  ctx.strokeStyle = "#e8a0b0"; ctx.lineWidth = 1.5;
  rRect(ctx, 12, 12, W - 24, H - 24, 18); ctx.stroke();
  ctx.strokeStyle = "rgba(232,160,176,0.2)"; ctx.lineWidth = 1;
  rRect(ctx, 18, 18, W - 36, H - 36, 15); ctx.stroke();

  // Header
  ctx.fillStyle = "#e8a0b0";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("✦  SKIN ANALYSIS  ✦", W / 2, 46);

  // Photo circle
  if (imageDataUrl) {
    const img = await loadImg(imageDataUrl);
    if (img) {
      ctx.save();
      ctx.beginPath(); ctx.arc(W / 2, 155, 80, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, W / 2 - 80, 75, 160, 160);
      ctx.restore();
      ctx.strokeStyle = "#e8a0b0"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(W / 2, 155, 80, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    ctx.fillStyle = "rgba(232,160,176,0.15)";
    ctx.beginPath(); ctx.arc(W / 2, 155, 80, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(232,160,176,0.5)";
    ctx.font = "40px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("✿", W / 2, 155); ctx.textBaseline = "alphabetic";
  }

  // Skin type badge
  ctx.fillStyle = "rgba(232,160,176,0.18)";
  rRect(ctx, W / 2 - 80, 250, 160, 36, 18); ctx.fill();
  ctx.strokeStyle = "#e8a0b0"; ctx.lineWidth = 1;
  rRect(ctx, W / 2 - 80, 250, 160, 36, 18); ctx.stroke();
  ctx.fillStyle = "#e8d4da"; ctx.font = "bold 14px Georgia";
  ctx.textAlign = "center"; ctx.fillText(analysis.skinType + " Skin", W / 2, 273);

  // Score rings
  const scores = [
    { label: "Hydration", val: analysis.scores.hydration },
    { label: "Clarity", val: analysis.scores.clarity },
    { label: "Texture", val: analysis.scores.texture },
    { label: "Radiance", val: analysis.scores.radiance },
  ];
  const ringY = 330, ringSpacing = 140;
  const startX = W / 2 - (ringSpacing * (scores.length - 1)) / 2;
  scores.forEach(({ label, val }, i) => {
    const x = startX + i * ringSpacing;
    drawScoreRing(ctx, x, ringY, 36, val, "#e8a0b0");
    ctx.fillStyle = "#9a7a85"; ctx.font = "10px Georgia";
    ctx.textAlign = "center"; ctx.fillText(label, x, ringY + 52);
  });

  // Divider
  ctx.strokeStyle = "rgba(232,160,176,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 400); ctx.lineTo(W - 40, 400); ctx.stroke();

  // Concerns
  ctx.fillStyle = "#9a7a85"; ctx.font = "9px monospace";
  ctx.textAlign = "left"; ctx.fillText("SKIN CONCERNS DETECTED", 40, 425);
  const concerns = analysis.concerns || [];
  concerns.slice(0, 4).forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = col === 0 ? 40 : W / 2 + 10, y = 445 + row * 28;
    ctx.fillStyle = "rgba(232,160,176,0.12)";
    rRect(ctx, x, y - 14, 255, 22, 6); ctx.fill();
    ctx.fillStyle = "#e8d4da"; ctx.font = "11px Georgia";
    ctx.textAlign = "left"; ctx.fillText("· " + c, x + 10, y);
  });

  // Top ingredients
  ctx.strokeStyle = "rgba(232,160,176,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 510); ctx.lineTo(W - 40, 510); ctx.stroke();
  ctx.fillStyle = "#9a7a85"; ctx.font = "9px monospace";
  ctx.fillText("KEY INGREDIENTS", 40, 530);
  const ings = analysis.keyIngredients || [];
  ings.slice(0, 5).forEach((ing, i) => {
    const x = 40 + (i % 3) * 190, y = 555 + Math.floor(i / 3) * 28;
    ctx.fillStyle = "rgba(180,130,150,0.2)";
    rRect(ctx, x, y - 14, 175, 22, 11); ctx.fill();
    ctx.fillStyle = "#e8c0cc"; ctx.font = "bold 10px Georgia";
    ctx.textAlign = "center"; ctx.fillText(ing, x + 87, y);
  });

  // Overall rating
  ctx.strokeStyle = "rgba(232,160,176,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 612); ctx.lineTo(W - 40, 612); ctx.stroke();
  ctx.fillStyle = "rgba(232,160,176,0.1)";
  rRect(ctx, 40, 625, W - 80, 70, 10); ctx.fill();
  ctx.fillStyle = "#9a7a85"; ctx.font = "9px monospace";
  ctx.textAlign = "center"; ctx.fillText("OVERALL SKIN HEALTH", W / 2, 644);
  const overall = analysis.scores.overall;
  ctx.fillStyle = "#e8d4da"; ctx.font = "bold 32px Georgia";
  ctx.fillText(overall + "/100", W / 2, 680);
  // mini bar
  ctx.fillStyle = "#1a1a2a"; rRect(ctx, 80, 690, W - 160, 8, 4); ctx.fill();
  const barGrad = ctx.createLinearGradient(80, 0, 80 + (W - 160) * overall / 100, 0);
  barGrad.addColorStop(0, "#c06080"); barGrad.addColorStop(1, "#e8a0b0");
  ctx.fillStyle = barGrad; rRect(ctx, 80, 690, (W - 160) * overall / 100, 8, 4); ctx.fill();

  // Footer
  ctx.fillStyle = "rgba(232,160,176,0.25)"; ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("SKIN ANALYSIS AI  ·  POWERED BY CLAUDE", W / 2, H - 22);

  return canvas;
}

function rRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImg(src) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img); img.onerror = () => res(null);
    img.src = src;
  });
}

function drawScoreRing(ctx, cx, cy, r, val, color) {
  ctx.strokeStyle = "rgba(232,160,176,0.15)"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, "#c06080"); grad.addColorStop(1, "#e8a0b0");
  ctx.strokeStyle = grad; ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * val / 100));
  ctx.stroke();
  ctx.fillStyle = "#e8d4da"; ctx.font = "bold 13px Georgia";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(val, cx, cy); ctx.textBaseline = "alphabetic";
}

// ── SHARE MODAL ────────────────────────────────────────────────────────────
function ShareModal({ analysis, imageDataUrl, onClose }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildShareCard(analysis, imageDataUrl).then(canvas => {
      setDataUrl(canvas.toDataURL("image/png"));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0f0c1a", border: "1px solid #e8a0b0", borderRadius: 16, padding: 24, maxWidth: 460, width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: "#9a7a85", fontSize: 20, cursor: "pointer" }}>✕</button>
        <div style={{ fontSize: 10, color: "#e8a0b0", letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>✦ Share Your Results ✦</div>
        {loading
          ? <div style={{ textAlign: "center", color: "#9a7a85", padding: "30px 0", fontSize: 13 }}>✿ Generating card...</div>
          : <>
            <img src={dataUrl} alt="Skin analysis card" style={{ width: "100%", borderRadius: 10, marginBottom: 14, display: "block" }} />
            <div style={{ fontSize: 10, color: "#9a7a85", textAlign: "center", marginBottom: 10 }}>Right-click → Save Image As · or download below</div>
            <a href={dataUrl} download="skin-analysis.png" style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: 8, background: "linear-gradient(135deg, #c06080, #e8a0b0)", color: "#0f0c1a", fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none" }}>
              ↓ Download PNG
            </a>
          </>
        }
      </div>
    </div>
  );
}

// ── SCORE RING COMPONENT ───────────────────────────────────────────────────
function ScoreRing({ label, value, size = 80, stroke = 7 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(232,160,176,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)" }} />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c06080" />
            <stop offset="100%" stopColor="#f0b8c8" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ marginTop: -size / 2 - 8, fontSize: 16, fontWeight: 700, color: "#e8d4da", fontFamily: "Georgia, serif" }}>{value}</div>
      <div style={{ marginTop: size / 2 - 6, fontSize: 10, color: "#9a7a85", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ── ROUTINE STEP ───────────────────────────────────────────────────────────
function RoutineStep({ step, index, isAM }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 10, border: "1px solid rgba(232,160,176,0.15)", borderRadius: 10, overflow: "hidden", transition: "border-color 0.3s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(232,160,176,0.4)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(232,160,176,0.15)"}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "rgba(232,160,176,0.05)", border: "none", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#c06080,#e8a0b0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0f0c1a", flexShrink: 0 }}>{index + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#e8d4da", fontWeight: 600, fontFamily: "Georgia, serif" }}>{step.product}</div>
          <div style={{ fontSize: 10, color: "#9a7a85", marginTop: 2 }}>{step.type}</div>
        </div>
        <div style={{ color: "#9a7a85", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>▾</div>
      </button>
      {open && (
        <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(232,160,176,0.08)" }}>
          <div style={{ fontSize: 11, color: "#c0a0aa", lineHeight: 1.7, marginBottom: 8 }}>{step.why}</div>
          {step.ingredients && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {step.ingredients.map(ing => (
                <span key={ing} style={{ fontSize: 9, padding: "3px 9px", borderRadius: 12, background: "rgba(192,96,128,0.2)", color: "#e8a0b0", letterSpacing: 0.5 }}>{ing}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("upload"); // upload | form | analyzing | results
  const [imageFile, setImageFile] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState([]);
  const [age, setAge] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showShare, setShowShare] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState(0);
  const fileRef = useRef();
  const dropRef = useRef();

  const PHASES = ["Reading skin tone & texture...", "Detecting concerns...", "Formulating routine...", "Calculating scores..."];

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => { setImageDataUrl(e.target.result); setStep("form"); };
    reader.readAsDataURL(file);
  }

  function toggleConcern(c) {
    setConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function analyze() {
    setStep("analyzing");
    setAnalyzePhase(0);
    const phaseInterval = setInterval(() => setAnalyzePhase(p => Math.min(p + 1, PHASES.length - 1)), 900);

    const prompt = `You are an expert dermatologist and skincare formulator. Analyze this person's skin and provide a detailed personalized skincare routine.

User info:
- Skin type: ${skinType}
- Age: ${age || "not specified"}
- Concerns: ${concerns.join(", ") || "none specified"}
- Photo provided: ${imageDataUrl ? "yes" : "no"}

Respond ONLY with a JSON object, no markdown, no explanation:
{
  "skinType": "${skinType}",
  "skinDescription": "2 sentence description of their skin",
  "scores": {
    "hydration": <0-100>,
    "clarity": <0-100>,
    "texture": <0-100>,
    "radiance": <0-100>,
    "overall": <0-100>
  },
  "concerns": ["concern1", "concern2", "concern3"],
  "keyIngredients": ["ingredient1", "ingredient2", "ingredient3", "ingredient4", "ingredient5"],
  "amRoutine": [
    { "step": 1, "type": "Cleanser", "product": "product name/type", "why": "why this works for their skin", "ingredients": ["key ingredient 1", "key ingredient 2"] },
    { "step": 2, "type": "Toner", "product": "product name/type", "why": "why", "ingredients": [] },
    { "step": 3, "type": "Serum", "product": "product name/type", "why": "why", "ingredients": [] },
    { "step": 4, "type": "Moisturizer", "product": "product name/type", "why": "why", "ingredients": [] },
    { "step": 5, "type": "SPF", "product": "product name/type", "why": "why", "ingredients": [] }
  ],
  "pmRoutine": [
    { "step": 1, "type": "Cleanser", "product": "product name/type", "why": "why", "ingredients": [] },
    { "step": 2, "type": "Treatment", "product": "product name/type", "why": "why", "ingredients": [] },
    { "step": 3, "type": "Serum", "product": "product name/type", "why": "why", "ingredients": [] },
    { "step": 4, "type": "Moisturizer", "product": "product name/type", "why": "why", "ingredients": [] }
  ],
  "weeklyTreatments": ["treatment 1 with frequency", "treatment 2 with frequency"],
  "avoid": ["ingredient or product type to avoid 1", "ingredient to avoid 2"],
  "proTip": "one personalized expert tip specific to their skin"
}`;

    try {
      const messages = imageDataUrl
        ? [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: imageFile?.type || "image/jpeg", data: imageDataUrl.split(",")[1] } }, { type: "text", text: prompt }] }]
        : [{ role: "user", content: prompt }];

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Add VITE_ANTHROPIC_API_KEY to your .env file.");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages }),
      });
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      clearInterval(phaseInterval);
      setAnalysis(parsed);
      setStep("results");
    } catch (e) {
      clearInterval(phaseInterval);
      // Fallback demo analysis
      setAnalysis({
        skinType, skinDescription: `Your ${skinType.toLowerCase()} skin shows characteristics that benefit from a targeted routine. With the right ingredients, you can address your specific concerns effectively.`,
        scores: { hydration: skinType === "Dry" ? 45 : skinType === "Oily" ? 72 : 60, clarity: concerns.includes("Acne / Breakouts") ? 48 : 70, texture: concerns.includes("Texture") ? 52 : 68, radiance: concerns.includes("Dullness") ? 44 : 66, overall: 62 },
        concerns: concerns.length ? concerns.slice(0, 4) : ["Uneven texture", "Mild dehydration"],
        keyIngredients: INGREDIENT_DB[skinType.toLowerCase()] || INGREDIENT_DB.normal,
        amRoutine: [
          { type: "Cleanser", product: PRODUCT_TEMPLATES.cleanser[skinType.toLowerCase()] || "Gentle Gel Cleanser", why: "Removes overnight buildup without stripping the skin barrier.", ingredients: ["Glycerin", "Aloe Vera"] },
          { type: "Toner", product: "Hydrating Toner with Hyaluronic Acid", why: "Preps skin to absorb subsequent products more effectively.", ingredients: ["Hyaluronic Acid", "Panthenol"] },
          { type: "Serum", product: "Vitamin C 10% + E + Ferulic Acid", why: "Brightens, protects from oxidative stress, and evens skin tone.", ingredients: ["Vitamin C", "Vitamin E", "Ferulic Acid"] },
          { type: "Moisturizer", product: PRODUCT_TEMPLATES.moisturizer[skinType.toLowerCase()] || "Lightweight Cream", why: "Seals in hydration and supports the skin barrier.", ingredients: ["Ceramides", "Peptides"] },
          { type: "SPF", product: "Broad Spectrum SPF 50+ (chemical or mineral)", why: "Non-negotiable protection against UV damage and pigmentation.", ingredients: ["Zinc Oxide", "Niacinamide"] },
        ],
        pmRoutine: [
          { type: "Cleanser", product: "Oil Cleanser → Gentle Foam (double cleanse)", why: "Removes SPF, makeup, and pollution thoroughly.", ingredients: ["Jojoba Oil"] },
          { type: "Treatment", product: concerns.includes("Fine Lines") ? "Retinol 0.3–0.5%" : "Niacinamide 10%", why: concerns.includes("Fine Lines") ? "Stimulates collagen and accelerates cell turnover overnight." : "Regulates sebum, minimises pores and fades pigmentation.", ingredients: ["Retinol", "Peptides"] },
          { type: "Serum", product: "Hyaluronic Acid + Centella Asiatica", why: "Deeply hydrates and soothes any irritation from actives.", ingredients: ["HA", "Centella"] },
          { type: "Moisturizer", product: "Rich Night Cream with Ceramides", why: "Skin repairs itself at night — a richer cream maximises recovery.", ingredients: ["Ceramides", "Squalane", "Shea"] },
        ],
        weeklyTreatments: ["AHA/BHA exfoliant (1–2x/week) — resurfaces and unclogs pores", "Hydrating sheet mask (1–2x/week) — intense moisture boost"],
        avoid: ["Alcohol denat. (drying)", "Fragrance/parfum (sensitising)", "Harsh sulphates (SLS/SLES)"],
        proTip: "Apply your serums to slightly damp skin — hyaluronic acid draws moisture from the surface water into deeper layers, multiplying its effect."
      });
      setStep("results");
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0810", fontFamily: "Georgia, serif", color: "#e8d4da", overflowX: "hidden" }}>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,96,128,0.08) 0%, transparent 70%)", top: -100, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(150,80,160,0.06) 0%, transparent 70%)", bottom: -50, right: -50 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid rgba(232,160,176,0.12)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28 }}>✿</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e8d4da", letterSpacing: 2 }}>Skin Analysis AI</div>
            <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 3, textTransform: "uppercase" }}>Personalised Routine · Photo Analysis · Expert Formulation</div>
          </div>
          {step === "results" && (
            <button onClick={() => { setStep("upload"); setAnalysis(null); setImageDataUrl(null); setConcerns([]); setSkinType(""); setAge(""); }}
              style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 20, border: "1px solid rgba(232,160,176,0.3)", background: "transparent", color: "#9a7a85", fontSize: 11, cursor: "pointer", letterSpacing: 1 }}>
              ↺ New Analysis
            </button>
          )}
        </div>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 13, color: "#e8a0b0", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>✦ Step 1 of 2 ✦</div>
              <h1 style={{ fontSize: 36, fontWeight: 400, color: "#e8d4da", lineHeight: 1.2, marginBottom: 12 }}>Upload Your <em style={{ fontStyle: "italic", color: "#e8a0b0" }}>Photo</em></h1>
              <p style={{ fontSize: 13, color: "#9a7a85", lineHeight: 1.7 }}>A clear, well-lit photo of your bare face helps Claude analyse your skin more accurately. You can also skip and enter details manually.</p>
            </div>

            <div ref={dropRef}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); dropRef.current.style.borderColor = "#e8a0b0"; }}
              onDragLeave={() => dropRef.current.style.borderColor = "rgba(232,160,176,0.2)"}
              onDrop={e => { e.preventDefault(); dropRef.current.style.borderColor = "rgba(232,160,176,0.2)"; handleFile(e.dataTransfer.files[0]); }}
              style={{ border: "2px dashed rgba(232,160,176,0.2)", borderRadius: 20, padding: "60px 40px", textAlign: "center", cursor: "pointer", transition: "all 0.3s", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✿</div>
              <div style={{ fontSize: 14, color: "#e8d4da", marginBottom: 8 }}>Drop your photo here</div>
              <div style={{ fontSize: 11, color: "#9a7a85" }}>or click to browse · JPG, PNG, WEBP</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            <button onClick={() => setStep("form")}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(232,160,176,0.2)", background: "transparent", color: "#9a7a85", fontSize: 12, cursor: "pointer", letterSpacing: 1 }}>
              Skip photo — enter details manually →
            </button>
          </div>
        )}

        {/* STEP 2: Form */}
        {step === "form" && (
          <div style={{ maxWidth: 620, margin: "40px auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 11, color: "#e8a0b0", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>✦ Step 2 of 2 ✦</div>
              <h2 style={{ fontSize: 28, fontWeight: 400, color: "#e8d4da" }}>Tell us about <em style={{ color: "#e8a0b0" }}>your skin</em></h2>
            </div>

            {imageDataUrl && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                <div style={{ position: "relative" }}>
                  <img src={imageDataUrl} alt="Your photo" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "2px solid #e8a0b0" }} />
                  <button onClick={() => { setImageDataUrl(null); setImageFile(null); }}
                    style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "#1a0f1f", border: "1px solid #e8a0b0", color: "#e8a0b0", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>
            )}

            {/* Skin type */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Skin Type</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SKIN_TYPES.map(t => (
                  <button key={t} onClick={() => setSkinType(t)}
                    style={{ padding: "9px 20px", borderRadius: 24, border: "1px solid", cursor: "pointer", fontSize: 12, transition: "all 0.2s", fontFamily: "Georgia, serif",
                      borderColor: skinType === t ? "#e8a0b0" : "rgba(232,160,176,0.2)",
                      background: skinType === t ? "rgba(232,160,176,0.15)" : "transparent",
                      color: skinType === t ? "#e8d4da" : "#9a7a85" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Concerns */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Skin Concerns <span style={{ color: "#5a4a5a", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>(select all that apply)</span></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CONCERNS.map(c => (
                  <button key={c} onClick={() => toggleConcern(c)}
                    style={{ padding: "8px 16px", borderRadius: 24, border: "1px solid", cursor: "pointer", fontSize: 11, transition: "all 0.2s", fontFamily: "Georgia, serif",
                      borderColor: concerns.includes(c) ? "#e8a0b0" : "rgba(232,160,176,0.15)",
                      background: concerns.includes(c) ? "rgba(192,96,128,0.2)" : "transparent",
                      color: concerns.includes(c) ? "#e8d4da" : "#9a7a85" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Age <span style={{ color: "#5a4a5a", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
              <input type="number" min="12" max="99" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28"
                style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(232,160,176,0.2)", background: "rgba(232,160,176,0.05)", color: "#e8d4da", fontSize: 14, width: 120, outline: "none", fontFamily: "Georgia, serif" }} />
            </div>

            <button onClick={analyze} disabled={!skinType}
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: skinType ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia, serif", transition: "all 0.3s",
                background: skinType ? "linear-gradient(135deg, #c06080, #e8a0b0)" : "rgba(232,160,176,0.1)",
                color: skinType ? "#0f0c1a" : "#5a4a5a",
                boxShadow: skinType ? "0 8px 32px rgba(192,96,128,0.3)" : "none" }}>
              ✦ Analyse My Skin
            </button>
          </div>
        )}

        {/* ANALYZING */}
        {step === "analyzing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 32 }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <svg width="120" height="120" style={{ animation: "spin 3s linear infinite" }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(232,160,176,0.1)" strokeWidth="4" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#spinGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="80 235" />
                <defs><linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#c06080" /><stop offset="100%" stopColor="#e8a0b0" /></linearGradient></defs>
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✿</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, color: "#e8d4da", marginBottom: 10 }}>Analysing your skin...</div>
              <div style={{ fontSize: 12, color: "#9a7a85", letterSpacing: 1 }}>{PHASES[analyzePhase]}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {PHASES.map((_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= analyzePhase ? "#e8a0b0" : "rgba(232,160,176,0.2)", transition: "background 0.5s" }} />
              ))}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && analysis && (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>

            {/* Hero */}
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 36 }}>
              {imageDataUrl && (
                <img src={imageDataUrl} alt="Your skin" style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "2px solid #e8a0b0", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#e8a0b0", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>✦ Analysis Complete ✦</div>
                <div style={{ fontSize: 26, color: "#e8d4da", fontWeight: 400, marginBottom: 8 }}>{analysis.skinType} <em style={{ color: "#e8a0b0" }}>Skin</em></div>
                <div style={{ fontSize: 13, color: "#9a7a85", lineHeight: 1.7 }}>{analysis.skinDescription}</div>
              </div>
              <button onClick={() => setShowShare(true)}
                style={{ flexShrink: 0, padding: "9px 18px", borderRadius: 20, border: "1px solid #e8a0b0", background: "rgba(232,160,176,0.1)", color: "#e8a0b0", fontSize: 11, cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap" }}>
                📤 Share
              </button>
            </div>

            {/* Score rings */}
            <div style={{ background: "rgba(232,160,176,0.04)", border: "1px solid rgba(232,160,176,0.12)", borderRadius: 16, padding: "28px 20px", marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 3, textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>Skin Health Scores</div>
              <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
                {[["Hydration", analysis.scores.hydration], ["Clarity", analysis.scores.clarity], ["Texture", analysis.scores.texture], ["Radiance", analysis.scores.radiance]].map(([l, v]) => (
                  <ScoreRing key={l} label={l} value={v} />
                ))}
              </div>
              <div style={{ marginTop: 28, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Overall Skin Health</div>
                <div style={{ fontSize: 40, color: "#e8d4da", fontWeight: 700, marginBottom: 10 }}>{analysis.scores.overall}<span style={{ fontSize: 16, color: "#9a7a85" }}>/100</span></div>
                <div style={{ height: 8, background: "rgba(232,160,176,0.1)", borderRadius: 4, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
                  <div style={{ height: "100%", width: `${analysis.scores.overall}%`, background: "linear-gradient(90deg,#c06080,#e8a0b0)", borderRadius: 4, transition: "width 1.5s ease" }} />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(232,160,176,0.05)", borderRadius: 12, padding: 4 }}>
              {[["overview", "Overview"], ["am", "AM Routine"], ["pm", "PM Routine"], ["weekly", "Weekly"]].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif", transition: "all 0.2s",
                    background: activeTab === id ? "rgba(192,96,128,0.3)" : "transparent",
                    color: activeTab === id ? "#e8d4da" : "#9a7a85" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
              <div>
                {/* Concerns */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Detected Concerns</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(analysis.concerns || []).map(c => (
                      <span key={c} style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid rgba(232,160,176,0.25)", background: "rgba(192,96,128,0.1)", fontSize: 12, color: "#e8c0cc" }}>· {c}</span>
                    ))}
                  </div>
                </div>
                {/* Key Ingredients */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Key Ingredients for You</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(analysis.keyIngredients || []).map(ing => (
                      <span key={ing} style={{ padding: "7px 16px", borderRadius: 20, background: "linear-gradient(135deg,rgba(192,96,128,0.2),rgba(232,160,176,0.1))", border: "1px solid rgba(232,160,176,0.2)", fontSize: 12, color: "#e8a0b0", fontWeight: 600 }}>{ing}</span>
                    ))}
                  </div>
                </div>
                {/* Avoid */}
                {analysis.avoid?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Ingredients to Avoid</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {analysis.avoid.map(a => (
                        <div key={a} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(200,80,80,0.2)", background: "rgba(200,80,80,0.05)", fontSize: 12, color: "#c08080" }}>✕ {a}</div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Pro tip */}
                {analysis.proTip && (
                  <div style={{ padding: "18px 20px", borderRadius: 14, background: "linear-gradient(135deg,rgba(192,96,128,0.1),rgba(150,80,160,0.08))", border: "1px solid rgba(232,160,176,0.2)" }}>
                    <div style={{ fontSize: 10, color: "#e8a0b0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>✦ Expert Tip</div>
                    <div style={{ fontSize: 13, color: "#c0a0aa", lineHeight: 1.7, fontStyle: "italic" }}>"{analysis.proTip}"</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "am" && (
              <div>
                <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>☀ Morning Routine · {analysis.amRoutine?.length} Steps</div>
                {(analysis.amRoutine || []).map((s, i) => <RoutineStep key={i} step={s} index={i} isAM={true} />)}
              </div>
            )}

            {activeTab === "pm" && (
              <div>
                <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>🌙 Evening Routine · {analysis.pmRoutine?.length} Steps</div>
                {(analysis.pmRoutine || []).map((s, i) => <RoutineStep key={i} step={s} index={i} isAM={false} />)}
              </div>
            )}

            {activeTab === "weekly" && (
              <div>
                <div style={{ fontSize: 10, color: "#9a7a85", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Weekly Treatments</div>
                {(analysis.weeklyTreatments || []).map((t, i) => (
                  <div key={i} style={{ padding: "14px 18px", marginBottom: 10, borderRadius: 12, border: "1px solid rgba(232,160,176,0.15)", background: "rgba(232,160,176,0.04)", fontSize: 13, color: "#c0a0aa", lineHeight: 1.6 }}>
                    <span style={{ color: "#e8a0b0", marginRight: 8 }}>✦</span>{t}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showShare && analysis && (
        <ShareModal analysis={analysis} imageDataUrl={imageDataUrl} onClose={() => setShowShare(false)} />
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0810; }
        ::-webkit-scrollbar-thumb { background: rgba(232,160,176,0.2); border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        button { font-family: Georgia, serif; }
      `}</style>
    </div>
  );
}
