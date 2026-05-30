import { useState, useEffect } from "react";

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── Soil texture backgrounds ──────────────────────────────────────────────────
const SOIL_TEXTURES = {
  sand: `repeating-linear-gradient(45deg,#e8d5a3 0px,#e8d5a3 2px,#d4b896 2px,#d4b896 4px,#c9a87c 4px,#c9a87c 6px,#e0c898 6px,#e0c898 8px)`,
  clay: `repeating-linear-gradient(120deg,#8b5e3c 0px,#8b5e3c 3px,#7a4f30 3px,#7a4f30 6px,#9c6b45 6px,#9c6b45 9px,#6e4428 9px,#6e4428 12px)`,
  silt: `repeating-linear-gradient(90deg,#9e8668 0px,#9e8668 2px,#b09478 2px,#b09478 5px,#8a7258 5px,#8a7258 7px,#a08870 7px,#a08870 10px)`,
};

// ── Zone data ─────────────────────────────────────────────────────────────────
const ZONES = [
  {
    id: 1, name: "Zone 1", soil: "sand", soilLabel: "Sandy Soil",
    color: "#e74c3c", lightColor: "#fdf2f2", borderColor: "#e74c3c",
    crop: "Root vegetables (carrots, potatoes)", riskLevel: "High",
    data: { soil_moisture: 0.20, soil_temperature: 22.0, nitrogen_level: 0.20, crop_moisture: 0.25, drainage_rate: 0.90 },
    description: "Fast-draining sandy soil with low nutrient retention. Requires frequent irrigation and fertilization.",
  },
  {
    id: 2, name: "Zone 2", soil: "silt", soilLabel: "Silty Soil",
    color: "#f39c12", lightColor: "#fefaf2", borderColor: "#f39c12",
    crop: "Wheat, corn, general grain crops", riskLevel: "Medium",
    data: { soil_moisture: 0.50, soil_temperature: 18.0, nitrogen_level: 0.65, crop_moisture: 0.55, drainage_rate: 0.50 },
    description: "Balanced silty soil with good fertility and moderate drainage. Suitable for a wide range of crops.",
  },
  {
    id: 3, name: "Zone 3", soil: "clay", soilLabel: "Clay Soil",
    color: "#27ae60", lightColor: "#f2fdf5", borderColor: "#27ae60",
    crop: "Rice, brassicas, some root crops", riskLevel: "Low",
    data: { soil_moisture: 0.70, soil_temperature: 15.0, nitrogen_level: 0.80, crop_moisture: 0.65, drainage_rate: 0.15 },
    description: "Nutrient-rich clay soil with excellent water retention. Monitor for waterlogging in heavy rain.",
  },
];

// ── Weather parameters ────────────────────────────────────────────────────────
const WEATHER_PARAMS = [
  { key: "latitude", label: "Latitude", type: "number", default: 51.44, unit: "°", description: "Location latitude for weather data fetch", step: 0.01 },
  { key: "longitude", label: "Longitude", type: "number", default: 5.47, unit: "°", description: "Location longitude for weather data fetch", step: 0.01 },
  { key: "force_rainy", label: "Force Rain", type: "toggle", default: false, description: "Override weather API and force rainy conditions" },
  { key: "update_period_s", label: "Update Interval", type: "number", default: 60, unit: "s", description: "How often to fetch new weather data", min: 10, max: 3600 },
  { key: "rain_mm_threshold", label: "Rain Threshold", type: "slider", default: 0, unit: "mm/h", description: "Minimum rain (mm/h) to consider as rainy", min: 0, max: 20, step: 0.5 },
  { key: "visibility_m_threshold", label: "Visibility Threshold", type: "slider", default: 500, unit: "m", description: "Minimum visibility (m) before triggering caution", min: 100, max: 5000, step: 100 },
  { key: "wind_ms_threshold", label: "Wind Threshold", type: "slider", default: 12, unit: "m/s", description: "Wind speed above which conditions are flagged", min: 0, max: 30, step: 0.5 },
  { key: "speed_scale_rain", label: "Speed Scale (Rain)", type: "slider", default: 0.6, unit: "×", description: "Robot speed multiplier when raining", min: 0.1, max: 1.0, step: 0.05 },
  { key: "stop_add_rain", label: "Stop Distance (Rain)", type: "slider", default: 0.15, unit: "m", description: "Extra obstacle stop distance added when raining", min: 0, max: 1.0, step: 0.05 },
  { key: "http_timeout_s", label: "HTTP Timeout", type: "number", default: 3, unit: "s", description: "Timeout for Open-Meteo API requests", min: 1, max: 30 },
  { key: "max_stale_s", label: "Max Stale Duration", type: "number", default: 300, unit: "s", description: "How long to use cached weather before fallback", min: 60, max: 3600 },
];

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const styles = {
    High:   { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
    Medium: { bg: "#fffbeb", color: "#d97706", border: "#fcd34d" },
    Low:    { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
  };
  const s = styles[level] || styles.Low;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {level.toUpperCase()} RISK
    </span>
  );
}

// ── Data row ──────────────────────────────────────────────────────────────────
function DataRow({ label, value, unit = "", bar = false, barColor = "#3b82f6" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, letterSpacing: "0.03em" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          {typeof value === "number" ? value.toFixed(2) : value}{unit}
        </span>
      </div>
      {bar && (
        <div style={{ height: 5, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(value * 100, 100)}%`, background: barColor, borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>
      )}
    </div>
  );
}

// ── Back button ───────────────────────────────────────────────────────────────
function BackButton({ onClick, label = "Home" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed", top: 16, left: 16, zIndex: 200,
        display: "flex", alignItems: "center", gap: 8,
        background: hovered ? "#111827" : "#fff",
        color: hovered ? "#fff" : "#374151",
        border: "1.5px solid #e5e7eb", borderRadius: 12,
        padding: "8px 14px", fontSize: 13, fontWeight: 600,
        cursor: "pointer", transition: "all 0.15s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      ← {label}
    </button>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
function PageHeader({ icon, title, subtitle }) {
  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #e5e7eb",
      padding: "16px 24px", textAlign: "center",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#111827" }}>{title}</span>
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", letterSpacing: "0.03em" }}>{subtitle}</p>
    </div>
  );
}

// ── Home page ─────────────────────────────────────────────────────────────────
function HomePage({ onNavigate }) {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(null);

  const cards = [
    {
      id: "weather", icon: "🌤", title: "Weather Simulation",
      subtitle: "Configure & simulate weather conditions",
      desc: "Adjust rain, wind, visibility thresholds and robot safety parameters.",
      accent: "#3b82f6", light: "#eff6ff",
    },
    {
      id: "zones", icon: "🌱", title: "Field Zones",
      subtitle: "Monitor soil & crop conditions",
      desc: "Inspect sandy, silty and clay zones with live soil and crop data.",
      accent: "#16a34a", light: "#f0fdf4",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: isMobile ? "0 20px" : "0 48px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <span style={{ fontSize: 20 }}>🌾</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            FarmSight
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#6b7280",
            background: "#f3f4f6", padding: "2px 8px", borderRadius: 20,
            letterSpacing: "0.08em", textTransform: "uppercase"
          }}>Intelligence</span>
        </div>
      </header>

      {/* Hero */}
      <div style={{ padding: isMobile ? "40px 20px 24px" : "56px 48px 28px", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
          Digital Twin · Precision Agriculture
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 30 : 42, fontWeight: 700, color: "#111827",
          lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 14px"
        }}>
          Field Intelligence<br />Dashboard
        </h1>
        <p style={{ fontSize: isMobile ? 13 : 15, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
          Real-time soil monitoring and weather simulation for autonomous field management.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: "grid",
        gap: 20, maxWidth: 860,
        margin: "0 auto", padding: isMobile ? "0 20px 80px" : "0 48px 80px"
      }} className="home-grid">
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => onNavigate(card.id)}
            onMouseEnter={() => setHovered(card.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: "#fff",
              border: `2px solid ${hovered === card.id ? card.accent : "#e5e7eb"}`,
              borderRadius: 20, padding: isMobile ? "24px 20px" : "32px",
              cursor: "pointer", transition: "all 0.2s ease",
              transform: hovered === card.id ? "translateY(-4px)" : "translateY(0)",
              boxShadow: hovered === card.id ? `0 12px 40px ${card.accent}22` : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: card.light, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 24, marginBottom: 16,
              border: `1px solid ${card.accent}22`,
            }}>{card.icon}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 20 : 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
              {card.title}
            </h2>
            <p style={{ fontSize: 12, color: card.accent, fontWeight: 600, margin: "0 0 12px", letterSpacing: "0.02em" }}>{card.subtitle}</p>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>{card.desc}</p>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, color: card.accent, fontSize: 13, fontWeight: 600 }}>
              Open <span style={{ fontSize: 16 }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #e5e7eb",
        padding: isMobile ? "10px 16px" : "10px 48px",
        display: "flex", gap: isMobile ? 12 : 24, alignItems: "center",
        overflowX: "auto",
      }}>
        <span style={{ fontSize: 10, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}>
          Status
        </span>
        {["ROS 2", "Open-Meteo", "3 Zones"].map(s => (
          <span key={s} style={{ fontSize: 11, color: "#16a34a", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", flexShrink: 0 }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Zones overview page ───────────────────────────────────────────────────────
function ZonesPage({ onBack, onSelectZone }) {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .zones-grid { grid-template-columns: repeat(3, 1fr) !important; }
        .home-grid  { grid-template-columns: 1fr 1fr !important; }
        @media (max-width: 768px) {
          .zones-grid { grid-template-columns: 1fr !important; }
          .home-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <BackButton onClick={onBack} />
      <PageHeader icon="🌱" title="Field Zones" subtitle="Select a zone to view detailed soil and crop data" />

      <div style={{ padding: isMobile ? "24px 16px 40px" : "40px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 28
        }} className="zones-grid">
          {ZONES.map(zone => (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              onMouseEnter={() => setHovered(zone.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "#fff",
                border: `2px solid ${hovered === zone.id ? zone.color : "#e5e7eb"}`,
                borderRadius: 20, overflow: "hidden", cursor: "pointer",
                transition: "all 0.2s ease",
                transform: hovered === zone.id ? "translateY(-5px)" : "translateY(0)",
                boxShadow: hovered === zone.id ? `0 16px 48px ${zone.color}28` : "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Soil texture header */}
              <div style={{
                height: isMobile ? 110 : 140,
                background: SOIL_TEXTURES[zone.soil],
                position: "relative", display: "flex",
                alignItems: "flex-end", padding: "16px",
              }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                    {zone.soilLabel}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>{zone.name}</div>
                </div>
                <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
                  <RiskBadge level={zone.riskLevel} />
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: isMobile ? "16px" : "20px 24px 24px" }}>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: "0 0 16px" }}>{zone.description}</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginBottom: 16 }}>
                  {[
                    { label: "Moisture", value: `${(zone.data.soil_moisture * 100).toFixed(0)}%` },
                    { label: "Temperature", value: `${zone.data.soil_temperature}°C` },
                    { label: "Nitrogen", value: `${(zone.data.nitrogen_level * 100).toFixed(0)}%` },
                    { label: "Drainage", value: `${(zone.data.drainage_rate * 100).toFixed(0)}%` },
                  ].map(item => (
                    <div key={item.label} style={{ background: zone.lightColor, border: `1px solid ${zone.color}22`, borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginTop: 2 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "8px 10px", background: "#f9fafb", borderRadius: 8, fontSize: 11, color: "#6b7280" }}>
                  🌾 <strong style={{ color: "#374151" }}>Crop:</strong> {zone.crop}
                </div>

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, color: zone.color, fontSize: 12, fontWeight: 700 }}>
                  View Details →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Zone detail page ──────────────────────────────────────────────────────────
function ZoneDetailPage({ zone, onBack }) {
  const isMobile = useIsMobile();
  const [weatherEffect, setWeatherEffect] = useState({ rain: 0, wind: 0, temp: 20 });
  const [simulated, setSimulated] = useState(null);

  function simulate() {
    const base = zone.data;
    const { rain, wind, temp } = weatherEffect;
    const sensMap = { sand: 0.02, silt: 0.05, clay: 0.08 };
    const gain = sensMap[zone.soil];

    let moisture = Math.max(0, Math.min(1, base.soil_moisture + rain * gain - wind * 0.003));
    let cropMoisture = Math.min(1, base.crop_moisture + rain * gain * 0.7);
    if (zone.soil === "clay" && moisture > 0.88) cropMoisture *= 0.6;

    const tempSens = zone.soil === "sand" ? 0.6 : zone.soil === "silt" ? 0.3 : 0.1;
    const soilTemp = base.soil_temperature + (temp - 20) * tempSens - rain * 0.1;

    let nitrogen = Math.max(0, Math.min(1,
      base.nitrogen_level - rain * (zone.soil === "sand" ? 0.04 : zone.soil === "silt" ? 0.01 : 0.005)
    ));

    const thresholds = {
      sand: { low: 0.15, high: 0.70, tempHigh: 35, nLow: 0.15 },
      silt: { low: 0.30, high: 0.85, tempHigh: 30, nLow: 0.25 },
      clay: { low: 0.40, high: 0.92, tempHigh: 28, nLow: 0.30 },
    }[zone.soil];

    const factors = [];
    if (moisture < thresholds.low) factors.push("Drought stress");
    if (moisture > thresholds.high) factors.push("Waterlogging risk");
    if (soilTemp > thresholds.tempHigh) factors.push("Heat stress");
    if (nitrogen < thresholds.nLow) factors.push("Nitrogen deficiency");

    setSimulated({
      moisture, cropMoisture, soilTemp, nitrogen,
      drainage: base.drainage_rate,
      risk: factors.length >= 2 ? "High" : factors.length === 1 ? "Medium" : "Low",
      factors,
    });
  }

  const displayRisk = simulated ? simulated.risk : zone.riskLevel;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <BackButton onClick={onBack} label="Zones" />
      <PageHeader icon="🔬" title={zone.name} subtitle={`${zone.soilLabel} · ${zone.crop}`} />

      <div style={{ padding: isMobile ? "20px 16px 40px" : "36px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 16 : 24
        }}>

          {/* Soil data card */}
          <div style={{
            background: "#fff", borderRadius: 20,
            border: `1.5px solid ${zone.color}33`, overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <div style={{ height: 90, background: SOIL_TEXTURES[zone.soil], position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
              <div style={{ position: "absolute", bottom: 14, left: 18, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>Soil Analysis</div>
                <RiskBadge level={displayRisk} />
              </div>
            </div>

            <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
              <DataRow label="Soil Moisture" value={simulated ? simulated.moisture : zone.data.soil_moisture} bar barColor={zone.color} />
              <DataRow label="Soil Temperature" value={simulated ? simulated.soilTemp : zone.data.soil_temperature} unit="°C" />
              <DataRow label="Nitrogen Level" value={simulated ? simulated.nitrogen : zone.data.nitrogen_level} bar barColor="#8b5cf6" />
              <DataRow label="Crop Moisture" value={simulated ? simulated.cropMoisture : zone.data.crop_moisture} bar barColor="#06b6d4" />
              <DataRow label="Drainage Rate" value={simulated ? simulated.drainage : zone.data.drainage_rate} bar barColor="#f59e0b" />

              {simulated && simulated.factors.length > 0 && (
                <div style={{ marginTop: 14, padding: "12px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fca5a5" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 6, letterSpacing: "0.05em" }}>⚠ RISK FACTORS</div>
                  {simulated.factors.map(f => (
                    <div key={f} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 3 }}>• {f}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Crop info */}
            <div style={{ background: "#fff", borderRadius: 20, padding: isMobile ? "16px" : "22px 24px", border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>Crop Information</h3>
              <div style={{ padding: "12px 14px", background: zone.lightColor, borderRadius: 12, border: `1px solid ${zone.color}22`, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 3 }}>Recommended Crops</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{zone.crop}</div>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>{zone.description}</p>
            </div>

            {/* Weather simulation */}
            <div style={{ background: "#fff", borderRadius: 20, padding: isMobile ? "16px" : "22px 24px", border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Weather Impact Simulation</h3>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 16px" }}>Adjust parameters to see how weather affects this zone</p>

              {[
                { key: "rain", label: "Rain", unit: "mm/h", icon: "🌧", max: 20 },
                { key: "wind", label: "Wind Speed", unit: "m/s", icon: "💨", max: 30 },
                { key: "temp", label: "Temperature", unit: "°C", icon: "🌡", max: 40, min: -10 },
              ].map(param => (
                <div key={param.key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{param.icon} {param.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{weatherEffect[param.key]} {param.unit}</span>
                  </div>
                  <input
                    type="range" min={param.min || 0} max={param.max} step={0.5}
                    value={weatherEffect[param.key]}
                    onChange={e => setWeatherEffect(prev => ({ ...prev, [param.key]: parseFloat(e.target.value) }))}
                    style={{ width: "100%", accentColor: zone.color }}
                  />
                </div>
              ))}

              <button
                onClick={simulate}
                style={{
                  width: "100%", padding: "12px", background: zone.color, color: "#fff",
                  border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.03em",
                }}
              >
                ⚡ Simulate Weather Effect
              </button>

              {simulated && (
                <button
                  onClick={() => setSimulated(null)}
                  style={{
                    width: "100%", padding: "10px", marginTop: 8,
                    background: "transparent", color: "#9ca3af",
                    border: "1px solid #e5e7eb", borderRadius: 12,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Reset to baseline
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weather simulation page ───────────────────────────────────────────────────
function WeatherPage({ onBack }) {
  const isMobile = useIsMobile();
  const [values, setValues] = useState(Object.fromEntries(WEATHER_PARAMS.map(p => [p.key, p.default])));
  const [saved, setSaved] = useState(false);

  function handleChange(key, value) { setValues(prev => ({ ...prev, [key]: value })); setSaved(false); }
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const isRainy = values.force_rainy;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <BackButton onClick={onBack} />
      <PageHeader icon="🌤" title="Weather Simulation" subtitle="Configure all weather adapter parameters" />

      <div style={{ padding: isMobile ? "20px 16px 40px" : "36px 48px", maxWidth: 900, margin: "0 auto" }}>

        {/* Status banner */}
        <div style={{
          padding: isMobile ? "14px 16px" : "16px 24px", borderRadius: 16, marginBottom: 24,
          background: isRainy ? "#eff6ff" : "#f0fdf4",
          border: `1.5px solid ${isRainy ? "#93c5fd" : "#86efac"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: isMobile ? 22 : 28, flexShrink: 0 }}>{isRainy ? "🌧" : "☀️"}</span>
            <div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#111827" }}>
                {isRainy ? "Rainy Conditions Active" : "Clear Conditions"}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {isRainy ? "Robot speed reduced, stop distance increased" : "Normal robot operation"}
              </div>
            </div>
          </div>
          <div style={{
            padding: "4px 12px", borderRadius: 20,
            background: isRainy ? "#dbeafe" : "#dcfce7",
            color: isRainy ? "#1d4ed8" : "#15803d",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap"
          }}>
            {isRainy ? "RAINY" : "CLEAR"}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16
        }}>
          {WEATHER_PARAMS.map(param => (
            <div key={param.key} style={{
              background: "#fff", borderRadius: 16,
              padding: isMobile ? "16px" : "18px 22px",
              border: "1.5px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              gridColumn: param.type === "toggle" ? "1 / -1" : "auto",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{param.label}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{param.description}</div>
                </div>
                {param.type !== "toggle" && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", padding: "2px 10px", borderRadius: 8, whiteSpace: "nowrap" }}>
                    {values[param.key]} {param.unit || ""}
                  </span>
                )}
              </div>

              {param.type === "toggle" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 12 }}>
                  <span style={{ fontSize: 12, color: values[param.key] ? "#dc2626" : "#6b7280", fontWeight: 600 }}>
                    {values[param.key] ? "🌧 Rain forced ON" : "Uses live Open-Meteo data"}
                  </span>
                  <div
                    onClick={() => handleChange(param.key, !values[param.key])}
                    style={{
                      width: 52, height: 28, borderRadius: 14, flexShrink: 0,
                      background: values[param.key] ? "#3b82f6" : "#d1d5db",
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3,
                      left: values[param.key] ? 26 : 3,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#fff", transition: "left 0.2s",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                    }} />
                  </div>
                </div>
              )}

              {param.type === "slider" && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="range" min={param.min || 0} max={param.max} step={param.step || 1}
                    value={values[param.key]}
                    onChange={e => handleChange(param.key, parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#3b82f6" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    <span>{param.min || 0} {param.unit}</span>
                    <span>{param.max} {param.unit}</span>
                  </div>
                </div>
              )}

              {param.type === "number" && (
                <input
                  type="number" value={values[param.key]}
                  min={param.min} max={param.max} step={param.step || 1}
                  onChange={e => handleChange(param.key, parseFloat(e.target.value))}
                  style={{
                    marginTop: 8, width: "100%", padding: "8px 12px",
                    border: "1.5px solid #e5e7eb", borderRadius: 10,
                    fontSize: 14, fontWeight: 600, color: "#111827",
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={() => setValues(Object.fromEntries(WEATHER_PARAMS.map(p => [p.key, p.default])))}
            style={{
              padding: "12px 24px", borderRadius: 12,
              background: "transparent", color: "#6b7280",
              border: "1.5px solid #e5e7eb", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "12px 32px", borderRadius: 12,
              background: saved ? "#16a34a" : "#111827", color: "#fff",
              border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "background 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {saved ? "✓ Saved" : "Apply Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  if (page === "home") return <HomePage onNavigate={setPage} />;
  if (page === "weather") return <WeatherPage onBack={() => setPage("home")} />;
  if (page === "zones") return (
    <ZonesPage
      onBack={() => setPage("home")}
      onSelectZone={zone => { setSelectedZone(zone); setPage("zone-detail"); }}
    />
  );
  if (page === "zone-detail" && selectedZone) return (
    <ZoneDetailPage zone={selectedZone} onBack={() => setPage("zones")} />
  );
}
