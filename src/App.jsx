import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, Volume2, VolumeX, Sparkles } from 'lucide-react';

/* =============================================================================
   HELPERS VISUALES
   ============================================================================= */

// Parte un texto en líneas de hasta `max` caracteres (sin cortar palabras)
const wrapText = (text, max) => {
  const lines = [];
  let cur = '';
  String(text).split(' ').forEach((w) => {
    const next = (cur + ' ' + w).trim();
    if (next.length <= max || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  return lines;
};

// Rectángulo con radios distintos por esquina => silueta orgánica tipo hoja / cápsula
const blobPath = (w, h, [r1, r2, r3, r4]) =>
  `M ${r1} 0 H ${w - r2} Q ${w} 0 ${w} ${r2} V ${h - r3} Q ${w} ${h} ${w - r3} ${h} H ${r4} Q 0 ${h} 0 ${h - r4} V ${r1} Q 0 0 ${r1} 0 Z`;

/* Color de cada flecha = lo que viaja (siempre el mismo) */
const FLOW = {
  glucose: { c: '#22c55e', d: '#86efac', name: 'Glucosa' },          // verde
  amino:   { c: '#06b6d4', d: '#67e8f9', name: 'Aminoácidos / Alanina' }, // celeste
  fat:     { c: '#facc15', d: '#fef08a', name: 'Grasas (AG, VLDL, quilomicrones)' }, // dorado
  ketone:  { c: '#a855f7', d: '#d8b4fe', name: 'Cetonas' },          // violeta
  lactate: { c: '#f43f5e', d: '#fda4af', name: 'Lactato' }           // rojo
};

const ORGAN_THEME = {
  brain: {
    radii: [54, 30, 54, 30], stroke: '#a855f7', hi: '#c084fc', top: '#2a1750', bot: '#110a24', title: '#f3e8ff',
    p1: { fill: '#2e1065', stroke: '#a855f7', text: '#f3e8ff' }, p2: { fill: '#150d2b', stroke: '#6b21a8', text: '#e9d5ff' }
  },
  liver: {
    radii: [34, 58, 34, 52], stroke: '#ea7c3f', hi: '#fb9b62', top: '#4a2412', bot: '#1f0f08', title: '#ffe9dc',
    p1: { fill: '#5a2a12', stroke: '#ea7c3f', text: '#ffe9dc' }, p2: { fill: '#24120a', stroke: '#b4552a', text: '#fed7bf' }
  },
  adipose: {
    radii: [56, 56, 56, 56], stroke: '#facc15', hi: '#fde047', top: '#3a3208', bot: '#171403', title: '#fefce8',
    p1: { fill: '#3f3a06', stroke: '#facc15', text: '#fefce8' }, p2: { fill: '#1a1704', stroke: '#a38b0c', text: '#fef08a' }
  },
  intestine: {
    radii: [36, 52, 30, 56], stroke: '#10b981', hi: '#34d399', top: '#0a4030', bot: '#031a13', title: '#ecfdf5',
    p1: { fill: '#064e3b', stroke: '#10b981', text: '#ecfdf5' }, p2: { fill: '#04201a', stroke: '#059669', text: '#a7f3d0' }
  },
  muscle: {
    radii: [52, 30, 52, 30], stroke: '#f43f5e', hi: '#fb7185', top: '#40101f', bot: '#1a050d', title: '#ffe4e6',
    p1: { fill: '#4c0519', stroke: '#f43f5e', text: '#ffe4e6' }, p2: { fill: '#200610', stroke: '#be123c', text: '#fecdd3' }
  }
};

/* Recuadro de órgano: el alto se calcula según el texto, así nada se sale */
function OrganCard({ id, x, y, w = 240, minH = 0, icon, title, badges, selected, hovered, onSelect, onHover }) {
  const th = ORGAN_THEME[id];
  const maxChars = Math.floor((w - 52) / 6.3);
  let cy = 76;
  const pills = badges.map((txt, i) => {
    const lines = wrapText(txt, maxChars);
    const h = lines.length * 15 + 12;
    const p = { lines, y: cy, h, st: i === 0 ? th.p1 : th.p2 };
    cy += h + 8;
    return p;
  });
  const h = Math.max(cy + 10, minH);
  const active = selected || hovered;
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onSelect}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer"
      filter="url(#cardShadow)"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={th.top} />
          <stop offset="100%" stopColor={th.bot} />
        </linearGradient>
      </defs>
      {/* Brillo suave del color del órgano */}
      <path d={blobPath(w, h, th.radii)} fill={th.stroke} opacity={active ? 0.3 : 0.13} filter="url(#softGlow)" />
      {/* Anillo punteado de selección */}
      {active && (
        <g transform="translate(-7, -7)">
          <path d={blobPath(w + 14, h + 14, th.radii.map((r) => r + 5))} fill="none" stroke={th.hi} strokeWidth="1.5" strokeDasharray="6 5" opacity="0.8" />
        </g>
      )}
      <path d={blobPath(w, h, th.radii)} fill={`url(#grad-${id})`} stroke={active ? th.hi : th.stroke} strokeWidth={selected ? 3.2 : 2} />
      <text x={w / 2} y="32" textAnchor="middle" fontSize="24">{icon}</text>
      <text x={w / 2} y="58" textAnchor="middle" fill={th.title} fontSize="14.5" fontWeight="900" letterSpacing="0.04em">{title}</text>
      {pills.map((p, i) => (
        <g key={i}>
          <rect x="22" y={p.y} width={w - 44} height={p.h} rx={p.h / 2 > 14 ? 14 : p.h / 2} fill={p.st.fill} stroke={p.st.stroke} strokeWidth="1.3" />
          {p.lines.map((ln, j) => (
            <text key={j} x={w / 2} y={p.y + 6 + 15 * (j + 1) - 3.5} textAnchor="middle" fill={p.st.text} fontSize="11" fontWeight="700">{ln}</text>
          ))}
        </g>
      ))}
    </g>
  );
}

/* Flujo vascular entre órganos: línea + partículas + etiqueta que se ajusta al texto */
function Flow({ d, on, color, dot, w = 3, dur = 1.7, label, lx, ly, dim = '#1e293b', arrow }) {
  const lw = label ? label.length * 6.1 + 22 : 0;
  // Punta de flecha: ángulo calculado desde el último tramo del trazo
  let tip = null;
  if (arrow && on) {
    const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
    const n = nums.length;
    const [x2, y2, x1, y1] = [nums[n - 2], nums[n - 1], nums[n - 4], nums[n - 3]];
    tip = { x: x2, y: y2, a: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI };
  }
  return (
    <g>
      <path d={d} fill="none" stroke={on ? color : dim} strokeWidth={on ? w : 1.5} strokeDasharray="6 4" className={on ? 'active-stream' : ''} />
      {tip && (
        <path d="M -13 -7 L 0 0 L -13 7 Z" fill={color} transform={`translate(${tip.x}, ${tip.y}) rotate(${tip.a})`} filter="url(#neonGlow)" />
      )}
      {on && [0, dur / 2].map((b, i) => (
        <circle key={i} r="4.3" fill={dot || color} filter="url(#neonGlow)">
          <animateMotion dur={`${dur}s`} begin={`${b}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}
      {on && label && (
        <g transform={`translate(${lx - lw / 2}, ${ly - 12})`} filter="url(#cardShadow)">
          <rect width={lw} height="24" rx="12" fill="#0b1324" stroke={color} strokeWidth="1.5" />
          <text x={lw / 2} y="16" textAnchor="middle" fill={dot || color} fontSize="11" fontWeight="700">{label}</text>
        </g>
      )}
    </g>
  );
}

/* LA REPRESA (CTE): franja horizontal de ancho completo, complejos legibles */
function Dam({ phys }) {
  const speed = Math.max(0.35, Math.min(2.4, phys.pinwheelSpeed / 2.2)); // menor = más rápido
  const hypoxia = phys.hypoxia;
  const W = 940, H = 300;
  // Cámara de protones (izquierda/centro)
  const cx = 24, cy = 52, cw = 600, ch = 178;
  const waterH = (phys.damLevel / 100) * (ch - 56);
  const waveTop = cy + ch - 56 - waterH + 8;
  let wave = `M ${cx - 80} ${waveTop}`;
  for (let i = 0; i < 20; i++) wave += ` Q ${cx - 80 + i * 40 + 20} ${waveTop + (i % 2 ? 6 : -6)} ${cx - 80 + (i + 1) * 40} ${waveTop}`;
  wave += ` L ${cx + cw + 80} ${cy + ch} L ${cx - 80} ${cy + ch} Z`;
  const badgeW = phys.damBadge.length * 7 + 28;
  const tone = hypoxia ? '#f43f5e' : '#38bdf8';
  const protons = Array.from({ length: 14 }, (_, i) => 60 + i * 40);
  const complexes = [
    { n: 'I', s: 'NADH', c: '#fde047' },
    { n: 'II', s: 'FADH₂', c: '#7dd3fc' },
    { n: 'III', s: 'CoQ → Cit c', c: '#fde047' },
    { n: 'IV', s: 'O₂', c: '#7dd3fc' }
  ];
  const compW = 138, compGap = 12, compX0 = cx + 14;
  return (
    <g filter="url(#cardShadow)">
      <defs>
        <clipPath id="chamberClip"><rect x={cx} y={cy} width={cw} height={ch} rx="12" /></clipPath>
      </defs>
      <rect width={W} height={H} rx="20" fill="#0b1222" stroke="#1e3a5f" strokeWidth="1.8" />
      <text x="22" y="34" fill="#38bdf8" fontSize="19" fontWeight="900" letterSpacing="0.04em">⚡ LA REPRESA (CTE)</text>
      <rect x={W - 22 - badgeW} y="12" width={badgeW} height="32" rx="16" fill="#091526" stroke={hypoxia ? '#f43f5e' : '#0284c7'} strokeWidth="1.4" />
      <text x={W - 22 - badgeW / 2} y="33" textAnchor="middle" fill={hypoxia ? '#fda4af' : '#7dd3fc'} fontSize="13.5" fontWeight="700">{phys.damBadge}</text>

      {/* Cámara de protones */}
      <rect x={cx} y={cy} width={cw} height={ch} rx="12" fill="#091326" stroke="#0369a1" strokeWidth="1.6" />
      <g clipPath="url(#chamberClip)">
        <rect x={cx} y={waveTop} width={cw} height={cy + ch - waveTop + 10} fill="url(#protonWater)" />
        <path d={wave} fill="url(#protonWater)" opacity="0.9">
          <animateTransform attributeName="transform" type="translate" from="0 0" to="-80 0" dur={`${3 + speed * 2}s`} repeatCount="indefinite" />
        </path>
        {!hypoxia && protons.map((px, i) => (
          <circle key={i} cx={px} cy={cy + ch - 60} r="5" fill="#7dd3fc" filter="url(#neonGlow)">
            <animate attributeName="cy" values={`${cy + ch - 58};${waveTop + 6}`} dur={`${(1.2 + (i % 3) * 0.25) * speed}s`} begin={`${i * 0.13}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;1;0.2" dur={`${(1.2 + (i % 3) * 0.25) * speed}s`} begin={`${i * 0.13}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      <text x={cx + cw / 2} y={cy + 24} textAnchor="middle" fill="#e0f2fe" fontSize="14" fontWeight="800" stroke="#091326" strokeWidth="4" paintOrder="stroke">ESPACIO INTERMEMBRANA (↑H⁺)</text>

      {/* Complejos I-IV: grandes y legibles */}
      {complexes.map((k, i) => (
        <g key={k.n} transform={`translate(${compX0 + i * (compW + compGap)}, ${cy + ch - 52})`}>
          <rect width={compW} height="42" rx="11" fill="#0f172a" stroke={hypoxia && k.n === 'IV' ? '#f43f5e' : '#0ea5e9'} strokeWidth="1.6" />
          <text x="26" y="27" textAnchor="middle" fill="#fde047" fontSize="19" fontWeight="900">{k.n}</text>
          <line x1="48" y1="8" x2="48" y2="34" stroke="#1e3a5f" strokeWidth="1.4" />
          <text x={48 + (compW - 48) / 2} y="26.5" textAnchor="middle" fill={k.c} fontSize="14" fontWeight="800">{k.s}</text>
        </g>
      ))}
      <text x={cx + cw / 2} y={cy + ch + 20} textAnchor="middle" fill="#a8b5c9" fontSize="13" fontWeight="700" letterSpacing="0.06em">MATRIZ MITOCONDRIAL</text>

      {/* Entrada de electrones desde la Noria hacia los complejos I y II */}
      {!hypoxia && (
        <g>
          <path id="eIn1" d={`M 4 258 Q 30 258 62 ${cy + ch - 10}`} fill="none" stroke="#fde047" strokeWidth="3.6" strokeDasharray="7 4" className="active-stream" strokeLinecap="round" />
          <path id="eIn2" d={`M 4 270 Q 130 270 200 ${cy + ch - 10}`} fill="none" stroke="#38bdf8" strokeWidth="3.6" strokeDasharray="7 4" className="active-stream" strokeLinecap="round" />
          {['eIn1', 'eIn2'].map((pid, k) =>
            [0, 0.35, 0.7].map((d, i) => (
              <circle key={`${pid}-${i}`} r="4.2" fill={k === 0 ? '#fde047' : '#7dd3fc'} filter="url(#neonGlow)">
                <animateMotion dur={`${1.0 * speed}s`} begin={`${d * speed}s`} repeatCount="indefinite">
                  <mpath href={`#${pid}`} />
                </animateMotion>
              </circle>
            ))
          )}
        </g>
      )}

      {/* Caída de protones al molinete */}
      <path d={`M ${cx + cw} 130 L 690 130`} stroke={tone} strokeWidth="5" strokeDasharray="6 4" className={hypoxia ? '' : 'active-stream'} />
      {!hypoxia && [0, 0.5].map((b, i) => (
        <circle key={i} cx={cx + cw} cy="130" r="5" fill="#7dd3fc" filter="url(#neonGlow)">
          <animate attributeName="cx" values={`${cx + cw};690`} dur={`${0.7 * speed}s`} begin={`${b * speed}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Molinete: ATP sintasa */}
      <text x="780" y="62" textAnchor="middle" fill="#fde68a" fontSize="14" fontWeight="800">MOLINETE (ATP Sintasa)</text>
      <g transform="translate(780, 130)">
        <circle r="50" fill="#091526" stroke={hypoxia ? '#f43f5e' : '#f59e0b'} strokeWidth="2.6" strokeDasharray="8 5" />
        <g className="pinwheel-rotor" style={{ animationDuration: `${phys.pinwheelSpeed}s` }}>
          <line x1="-40" y1="0" x2="40" y2="0" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
          <line x1="0" y1="-40" x2="0" y2="40" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
          <line x1="-28" y1="-28" x2="28" y2="28" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="28" y1="-28" x2="-28" y2="28" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <circle r="10" fill="#f59e0b" />
        </g>
        <circle r="4" fill="#0f172a" />
      </g>

      {/* Salidas: ATP y calor */}
      {!hypoxia && (
        <>
          <circle r="4.4" fill="#34d399" filter="url(#neonGlow)">
            <animateMotion dur={`${1.2 * speed}s`} repeatCount="indefinite" path="M 760 180 L 728 214" />
          </circle>
          <circle r="4.4" fill="#fb923c" filter="url(#neonGlow)">
            <animateMotion dur={`${1.2 * speed}s`} begin="0.4s" repeatCount="indefinite" path="M 800 180 L 842 214" />
          </circle>
        </>
      )}
      <rect x="660" y="214" width="98" height="66" rx="12" fill="#064e3b" stroke="#10b981" strokeWidth="1.6" />
      <text x="709" y="240" textAnchor="middle" fill="#d1fae5" fontSize="16" fontWeight="800">⚡ ATP</text>
      <text x="709" y="264" textAnchor="middle" fill="#6ee7b7" fontSize="14" fontWeight="700">~40% ΔG</text>
      <rect x="800" y="214" width="112" height="66" rx="12" fill="#431407" stroke="#f97316" strokeWidth="1.6" />
      <text x="856" y="240" textAnchor="middle" fill="#fed7aa" fontSize="16" fontWeight="800">🔥 Calor</text>
      <text x="856" y="264" textAnchor="middle" fill="#fdba74" fontSize="14" fontWeight="700">~60% Basal</text>

      {/* Cartel de procedencia de los electrones */}
      {!hypoxia && (
        <g transform="translate(250, 290)">
          <rect x="-96" y="-12" width="192" height="22" rx="11" fill="#082f49" stroke="#38bdf8" strokeWidth="1.4" />
          <text x="0" y="3.5" textAnchor="middle" fill="#e0f2fe" fontSize="12" fontWeight="800">⚡ e⁻ desde la Noria</text>
        </g>
      )}
    </g>
  );
}

/* Cabina de la Noria de Krebs (se contra-gira para quedar siempre derecha) */
function Cabin({ x, y, speed, ring, dot, rect, label, rw, ry, ty, fs }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="noria-cabin-upright" style={{ animationDuration: `${speed}s` }}>
        <circle r="7.5" fill={ring.fill} stroke={ring.stroke} strokeWidth="2" />
        <circle r="3.5" fill={dot} />
        <rect x={-rw / 2} y={ry} width={rw} height="22" rx="7" fill={rect.fill} stroke={rect.stroke} strokeWidth="1.8" />
        <text x="0" y={ty} textAnchor="middle" fill={rect.text} fontSize={fs} fontWeight="900">{label}</text>
      </g>
    </g>
  );
}


/* =============================================================================
   MOTOR DE SONIDO "INTERIOR" — órgano de tubos tipo Interestelar + atmósfera
   corporal (latido, líquido, respiración) + arpegiador electrónico misterioso.
   Todo se genera con Web Audio, sin archivos externos.
   ============================================================================= */
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Escalas (semitonos desde la fundamental) y acordes por estado
const MOODS = {
  // postprandial
  mixed:     { root: 45, scale: [0, 2, 3, 7, 10], chord: [0, 7, 12, 15], bpm: 74,  bright: 1.0, name: 'La menor' },
  high_carb: { root: 48, scale: [0, 2, 4, 7, 9],  chord: [0, 7, 12, 16], bpm: 84,  bright: 1.3, name: 'Do mayor pentatónica' },
  keto:      { root: 43, scale: [0, 3, 5, 7, 10], chord: [0, 7, 12, 15], bpm: 62,  bright: 0.8, name: 'Sol menor pentatónica' },
  protein:   { root: 46, scale: [0, 2, 3, 5, 7, 10], chord: [0, 7, 10, 14], bpm: 70, bright: 1.0, name: 'Sib dórica' },
  // ayuno
  f4:        { root: 43, scale: [0, 2, 3, 7, 8],  chord: [0, 7, 12, 14], bpm: 58,  bright: 0.8, name: 'Sol eólica' },
  f12:       { root: 41, scale: [0, 1, 3, 7, 8],  chord: [0, 7, 12, 13], bpm: 52,  bright: 0.65, name: 'Fa frigia' },
  f24:       { root: 38, scale: [0, 3, 5, 6, 10], chord: [0, 7, 12, 15], bpm: 44,  bright: 0.5, name: 'Re bluesy grave' }
};

function createInteriorSynth() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume();

  // ---------- Cadena maestra: compresor suave -> volumen ----------
  const master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 24; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
  master.connect(comp); comp.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2.5); // entrada suave

  // ---------- Reverb sintética (ruido con decaimiento) ----------
  const makeImpulse = (secs, decay) => {
    const len = Math.floor(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  };
  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(5.5, 2.4);
  const reverbIn = ctx.createGain(); reverbIn.gain.value = 1;
  const reverbOut = ctx.createGain(); reverbOut.gain.value = 0.85;
  reverbIn.connect(reverb); reverb.connect(reverbOut); reverbOut.connect(master);

  // ---------- Eco (delay con realimentación filtrada) ----------
  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = 0.42;
  const fb = ctx.createGain(); fb.gain.value = 0.42;
  const fbFilter = ctx.createBiquadFilter(); fbFilter.type = 'lowpass'; fbFilter.frequency.value = 1800;
  const echoIn = ctx.createGain(); echoIn.gain.value = 1;
  const echoOut = ctx.createGain(); echoOut.gain.value = 0.55;
  echoIn.connect(delay); delay.connect(fbFilter); fbFilter.connect(fb); fb.connect(delay);
  delay.connect(echoOut); echoOut.connect(reverbIn); echoOut.connect(master);

  // ---------- CAPA 1: órgano de tubos (acorde largo con registros) ----------
  const organBus = ctx.createGain(); organBus.gain.value = 0.16;
  const organFilter = ctx.createBiquadFilter(); organFilter.type = 'lowpass'; organFilter.frequency.value = 900; organFilter.Q.value = 0.8;
  organBus.connect(organFilter); organFilter.connect(master); organFilter.connect(reverbIn);
  const organVoices = [];
  const organPartials = [1, 2, 3, 4]; // fundamental + armónicos tipo tubos
  const organPartialGain = [1, 0.5, 0.28, 0.14];
  const organSlots = 4; // voces del acorde
  for (let v = 0; v < organSlots; v++) {
    const voiceGain = ctx.createGain(); voiceGain.gain.value = 0.0;
    voiceGain.connect(organBus);
    const oscs = organPartials.map((p, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sawtooth' : 'sine';
      o.frequency.value = 110 * p;
      o.detune.value = (Math.random() - 0.5) * 8;
      const g = ctx.createGain(); g.gain.value = organPartialGain[i] * (i === 0 ? 0.35 : 1);
      o.connect(g); g.connect(voiceGain); o.start();
      return o;
    });
    organVoices.push({ oscs, voiceGain });
  }
  // respiración lenta del filtro del órgano
  const organLfo = ctx.createOscillator(); organLfo.frequency.value = 0.09;
  const organLfoGain = ctx.createGain(); organLfoGain.gain.value = 320;
  organLfo.connect(organLfoGain); organLfoGain.connect(organFilter.frequency); organLfo.start();

  // ---------- CAPA 2: sub-drone profundo ----------
  const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 55;
  const subGain = ctx.createGain(); subGain.gain.value = 0.2;
  sub.connect(subGain); subGain.connect(master); sub.start();

  // ---------- CAPA 3: atmósfera corporal (ruido filtrado = líquido / respiración) ----------
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  { const d = noiseBuf.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } } // ruido "marrón"
  const noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;
  const liquidFilter = ctx.createBiquadFilter(); liquidFilter.type = 'bandpass'; liquidFilter.frequency.value = 240; liquidFilter.Q.value = 1.4;
  const liquidGain = ctx.createGain(); liquidGain.gain.value = 0.55;
  noise.connect(liquidFilter); liquidFilter.connect(liquidGain); liquidGain.connect(master); liquidGain.connect(reverbIn); noise.start();
  // respiración: sube y baja el volumen del ruido, muy lenta
  const breathLfo = ctx.createOscillator(); breathLfo.frequency.value = 0.16;
  const breathDepth = ctx.createGain(); breathDepth.gain.value = 0.3;
  breathLfo.connect(breathDepth); breathDepth.connect(liquidGain.gain); breathLfo.start();
  // burbujeo del líquido: el filtro se mueve
  const wobble = ctx.createOscillator(); wobble.frequency.value = 0.37;
  const wobbleDepth = ctx.createGain(); wobbleDepth.gain.value = 110;
  wobble.connect(wobbleDepth); wobbleDepth.connect(liquidFilter.frequency); wobble.start();

  // ---------- Estado musical vivo ----------
  const S = {
    mood: MOODS.mixed, exercise: 'rest', organ: 'liver', hypoxia: false,
    heartBpm: 62, heartOn: true, arpOn: true, arpStep: 0, arpDir: 1,
    arpTimer: null, heartTimer: null, chordTimer: null, chordIdx: 0, stopped: false
  };

  // ---------- Latido (útero / interior del cuerpo) ----------
  const heartBeat = () => {
    if (S.stopped) return;
    const t = ctx.currentTime;
    const hit = (when, vol, f0) => {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f0, when);
      o.frequency.exponentialRampToValueAtTime(34, when + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
      o.connect(lp); lp.connect(g); g.connect(master); g.connect(reverbIn);
      o.start(when); o.stop(when + 0.25);
    };
    if (S.heartOn) {
      const heavy = S.exercise === 'strength' ? 1.5 : 1;
      hit(t, 0.32 * heavy, 86);          // "lub"
      hit(t + 0.2, 0.22 * heavy, 70);    // "dub"
    }
    const bpm = S.exercise === 'aerobic' ? 118 : S.exercise === 'strength' ? 138 : S.heartBpm;
    S.heartTimer = setTimeout(heartBeat, 60000 / bpm);
  };

  // ---------- Arpegiador misterioso ----------
  const arpNote = () => {
    if (S.stopped) return;
    const t = ctx.currentTime;
    if (S.arpOn) {
      const sc = S.mood.scale;
      const patterns = { rest: [0, 2, 1, 3, 2, 4], aerobic: [0, 1, 2, 3, 4, 3, 2, 1], strength: [0, 0, 2, 0, 3, 0, 4, 2] };
      const pat = patterns[S.exercise] || patterns.rest;
      const idx = pat[S.arpStep % pat.length] % sc.length;
      const octave = (S.arpStep % 11 === 7) ? 24 : 12;
      const note = S.mood.root + 12 + sc[idx] + octave * (S.exercise === 'strength' ? 0 : 1);
      const f = midi(note);
      const o = ctx.createOscillator(); o.type = S.exercise === 'strength' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.0; o2.detune.value = 6;
      const g = ctx.createGain();
      const peak = 0.07 * (0.7 + S.mood.bright * 0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      const f1 = ctx.createBiquadFilter(); f1.type = 'lowpass';
      f1.frequency.setValueAtTime(700 * S.mood.bright + 900, t);
      f1.frequency.exponentialRampToValueAtTime(360, t + 0.5);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.pan.value = Math.sin(S.arpStep * 0.9) * 0.6;
      o.connect(f1); o2.connect(f1); f1.connect(g);
      if (pan) { g.connect(pan); pan.connect(echoIn); pan.connect(master); } else { g.connect(echoIn); g.connect(master); }
      o.start(t); o2.start(t); o.stop(t + 0.6); o2.stop(t + 0.6);
      S.arpStep++;
    }
    // 4 notas por pulso del tempo; el ejercicio acelera
    const mult = S.exercise === 'aerobic' ? 1.5 : S.exercise === 'strength' ? 1.0 : 1.0;
    const bpm = S.mood.bpm * mult;
    S.arpTimer = setTimeout(arpNote, (60000 / bpm) / 2);
  };

  // ---------- Acordes del órgano (cambian lento, con cruce suave) ----------
  const setChord = (glide = 3.5) => {
    const t = ctx.currentTime;
    const m = S.mood;
    const prog = [0, 0, 5, 3]; // pequeña progresión de grados de la escala
    const shift = prog[S.chordIdx % prog.length];
    const baseNote = m.root + (m.scale[shift % m.scale.length] || 0);
    organVoices.forEach((v, i) => {
      const note = baseNote + m.chord[i % m.chord.length];
      const f = midi(note);
      v.oscs.forEach((o, k) => o.frequency.setTargetAtTime(f * organPartials[k], t, glide / 3));
      const level = [0.9, 0.7, 0.55, 0.4][i];
      v.voiceGain.gain.setTargetAtTime(level, t, 1.4);
    });
    sub.frequency.setTargetAtTime(midi(baseNote - 12), t, glide / 3);
    organFilter.frequency.setTargetAtTime(500 + 700 * m.bright, t, 1.5);
  };
  const chordLoop = () => {
    if (S.stopped) return;
    setChord();
    S.chordIdx++;
    S.chordTimer = setTimeout(chordLoop, (60000 / S.mood.bpm) * 8);
  };

  heartBeat(); arpNote(); chordLoop();

  // ---------- API pública ----------
  const api = {
    ctx,
    setMood(key) {
      const m = MOODS[key] || MOODS.mixed;
      S.mood = m; S.heartBpm = Math.round(m.bpm * 0.9);
      S.chordIdx = 0; setChord(5);
      // transición: pequeña "ola" de reverb y filtro
      const t = ctx.currentTime;
      reverbOut.gain.cancelScheduledValues(t);
      reverbOut.gain.setTargetAtTime(1.3, t, 0.4);
      reverbOut.gain.setTargetAtTime(0.85, t + 1.2, 1.2);
      // swoosh ascendente/descendente
      api.swoosh(m.bright >= 1);
    },
    setExercise(ex) {
      S.exercise = ex;
      const t = ctx.currentTime;
      const cfg = {
        rest:     { liquid: 0.55, fbk: 0.42, delay: 0.42, organ: 0.16 },
        aerobic:  { liquid: 0.38, fbk: 0.5,  delay: 0.3,  organ: 0.2 },
        strength: { liquid: 0.3,  fbk: 0.55, delay: 0.24, organ: 0.12 }
      }[ex];
      liquidGain.gain.setTargetAtTime(cfg.liquid, t, 0.6);
      fb.gain.setTargetAtTime(cfg.fbk, t, 0.4);
      delay.delayTime.setTargetAtTime(cfg.delay, t, 0.5);
      organBus.gain.setTargetAtTime(cfg.organ, t, 0.8);
      breathLfo.frequency.setTargetAtTime(ex === 'rest' ? 0.16 : ex === 'aerobic' ? 0.5 : 0.9, t, 0.5);
      if (ex === 'strength') api.impact();
    },
    setHypoxia(on) {
      if (S.hypoxia === on) return;
      S.hypoxia = on;
      const t = ctx.currentTime;
      organFilter.frequency.setTargetAtTime(on ? 260 : 500 + 700 * S.mood.bright, t, 0.8);
      S.arpOn = !on;
    },
    // campanita al cambiar de órgano (cada órgano con su nota)
    ping(organ) {
      const notes = { liver: 64, adipose: 62, brain: 76, muscle: 59, intestine: 67 };
      const base = notes[organ] || 64;
      const t = ctx.currentTime;
      [0, 12].forEach((add, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = midi(base + add);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(i === 0 ? 0.08 : 0.03, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(g); g.connect(reverbIn); g.connect(echoIn); g.connect(master);
        o.start(t); o.stop(t + 1.7);
      });
    },
    // barrido de ruido al cambiar de estado
    swoosh(up = true) {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
      bp.frequency.setValueAtTime(up ? 250 : 1600, t);
      bp.frequency.exponentialRampToValueAtTime(up ? 1600 : 250, t + 1.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      src.connect(bp); bp.connect(g); g.connect(reverbIn); g.connect(master);
      src.start(t); src.stop(t + 1.7);
    },
    // golpe grave al entrar en fuerza
    impact() {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(master); g.connect(reverbIn);
      o.start(t); o.stop(t + 0.8);
    },
    destroy() {
      S.stopped = true;
      clearTimeout(S.arpTimer); clearTimeout(S.heartTimer); clearTimeout(S.chordTimer);
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0.0001, t, 0.25);
      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 900);
    }
  };
  return api;
}

export default function App() {
  // 1. Estado Nutricional Principal: 'postprandial' | 'fasting'
  const [nutritionalState, setNutritionalState] = useState('postprandial');
  // 2A. Tipo de Ingesta (Postprandial): 'mixed' | 'high_carb' | 'keto' | 'protein'
  const [mealType, setMealType] = useState('mixed');
  // 2B. Fase de Ayuno: '4_12h' | '12_24h' | 'plus_24h'
  const [fastingPhase, setFastingPhase] = useState('4_12h');
  // 3. Demanda Física: 'rest' | 'aerobic' | 'strength'
  const [exerciseLoad, setExerciseLoad] = useState('rest');
  // 4. Órgano seleccionado
  const [selectedOrgan, setSelectedOrgan] = useState('liver');
  const [hoveredOrgan, setHoveredOrgan] = useState(null);
  const [mobileTab, setMobileTab] = useState('map');

  // Sintetizador interior (Interestelar + atmósfera corporal)
  const [audioEnabled, setAudioEnabled] = useState(false);
  const synthRef = useRef(null);

  // Motor fisiológico integral basado en bioquímica humana
  const getPhysiology = () => {
    const isMuscleStrength = exerciseLoad === 'strength' && selectedOrgan === 'muscle';

    let insulin = { bar: 82, label: 'Elevada (Anabólica)' };
    let glucagon = { bar: 18, label: 'Inhibido (Basal)' };
    let adrenaline = { bar: 12, label: 'Basal (Reposo)' };
    let cortisol = { bar: 25, label: 'Basal Circadiano' };
    let satiety = { bar: 85, label: 'Alta (GLP-1 / CCK / Leptina)' };
    let ghrelin = { bar: 15, label: 'Suprimida' };

    let phosphoState = 'Desfosforilación (Insulina → Fosfatasa PP1 activa)';
    let phosphoColor = 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10';
    let neuroState = 'Saciedad: Neuronas POMC / CART activas (α-MSH anorexigénica)';
    let neuroColor = 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';

    let krebsSpeed = 4.2; // segundos por vuelta (menor = más rápido)
    let krebsBadge = '⚡ Velocidad Media (ATP Basal)';
    let krebsBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    let krebsCenterTitle = 'ANFIBÓLICO';
    let krebsCenterSub = 'Oxida + Biosíntesis';
    let oaaEscape = false;
    let citrateEscape = false;
    let hypoxia = false;

    let damLevel = 72;
    let damBadge = 'Flujo Activo (O₂ → H₂O)';
    let damBadgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    let pinwheelSpeed = 2.2;

    if (nutritionalState === 'postprandial') {
      if (mealType === 'mixed') {
        insulin = { bar: 82, label: 'Elevada (Predominio I/G)' };
        glucagon = { bar: 18, label: 'Inhibido' };
        satiety = { bar: 85, label: 'Alta (GLP-1 / CCK / Leptina)' };
        ghrelin = { bar: 15, label: 'Frenada' };
        krebsSpeed = 3.8;
        damLevel = 74;
      } else if (mealType === 'high_carb') {
        insulin = { bar: 96, label: 'Pico Máximo Insulínico' };
        glucagon = { bar: 8, label: 'Fuertemente Inhibido' };
        satiety = { bar: 78, label: 'Elevada (Incretinas GLP-1)' };
        ghrelin = { bar: 12, label: 'Suprimida' };
        krebsSpeed = 3.2;
        krebsBadge = selectedOrgan === 'liver' ? '🧪 Fuga de Citrato → Lipogénesis' : '⚡ Oxidación Glucosa Activa';
        krebsCenterTitle = 'ANABÓLICO';
        krebsCenterSub = 'Citrato sale al citosol → ACC';
        citrateEscape = selectedOrgan === 'liver';
        damLevel = 80;
      } else if (mealType === 'keto') {
        insulin = { bar: 22, label: 'Baja / Basal (Sin pico glucémico)' };
        glucagon = { bar: 72, label: 'Elevado (Relación I/G Baja)' };
        satiety = { bar: 88, label: 'Muy Alta (CCK por Lípidos + β-OHB)' };
        ghrelin = { bar: 18, label: 'Frenada por Cetonemia' };
        phosphoState = 'Predominio PKA (Baja Insulina → Lipólisis y Cetogénesis)';
        phosphoColor = 'text-amber-300 border-amber-500/40 bg-amber-500/10';
        krebsSpeed = selectedOrgan === 'liver' ? 6.5 : 3.5;
        krebsBadge = selectedOrgan === 'liver' ? '🔄 OAA a Gluconeogénesis (Cetogénesis)' : '⚡ Oxidación de AG y Cetonas';
        krebsBadgeClass = selectedOrgan === 'liver' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
        krebsCenterTitle = selectedOrgan === 'liver' ? 'CETOGÉNICO' : 'OXIDATIVO';
        krebsCenterSub = selectedOrgan === 'liver' ? 'OAA → Glucosa | Acetil-CoA → Cetonas' : 'Oxida Cetonas / Ác. Grasos';
        oaaEscape = selectedOrgan === 'liver';
        damLevel = 78;
      } else if (mealType === 'protein') {
        insulin = { bar: 60, label: 'Moderada (Captación AA / Síntesis)' };
        glucagon = { bar: 65, label: 'Elevado (Activa Gluconeogénesis / Urea)' };
        satiety = { bar: 92, label: 'Máxima Saciedad (CCK / PYY / GLP-1)' };
        ghrelin = { bar: 10, label: 'Suprimida' };
        phosphoState = 'Secreción Dual (Insulina + Glucagón evitan hipoglucemia)';
        phosphoColor = 'text-purple-300 border-purple-500/40 bg-purple-500/10';
        krebsSpeed = 3.5;
        krebsBadge = selectedOrgan === 'liver' ? '🔄 Anaplerosis + Ciclo de la Urea' : '⚡ Anaplerosis de Aminoácidos';
        krebsCenterTitle = 'ANAPLERÓTICO';
        krebsCenterSub = 'Esqueletos Carbonados AA + Urea';
        damLevel = 76;
      }
    } else if (fastingPhase === '4_12h') {
      insulin = { bar: 28, label: 'En Descenso' };
      glucagon = { bar: 72, label: 'Elevado (Glucogenólisis Hepática)' };
      cortisol = { bar: 45, label: 'Moderado' };
      satiety = { bar: 30, label: 'En Descenso (Baja Leptina)' };
      ghrelin = { bar: 72, label: 'Elevada (Señal Orexigénica)' };
      phosphoState = 'Fosforilación Covalente (Glucagón → ↑AMPc → PKA activa)';
      phosphoColor = 'text-amber-300 border-amber-500/40 bg-amber-500/10';
      neuroState = 'Hambre: Grelina activa neuronas NPY / AgRP (Orexigénicas)';
      neuroColor = 'text-amber-300 border-amber-500/40 bg-amber-500/10';
      krebsSpeed = 4.4;
      krebsCenterTitle = 'CATABÓLICO';
      krebsCenterSub = 'Oxidación de Ácidos Grasos';
      damLevel = 68;
    } else if (fastingPhase === '12_24h') {
      insulin = { bar: 16, label: 'Baja' };
      glucagon = { bar: 86, label: 'Dominante (Gluconeogénesis + Lipólisis)' };
      cortisol = { bar: 74, label: 'Elevado (Induce PEPCK y Proteólisis)' };
      satiety = { bar: 16, label: 'Baja (Caída de Leptina e Insulina)' };
      ghrelin = { bar: 86, label: 'Alta (Estimula NPY / AgRP)' };
      phosphoState = 'Fosforilación Intensa (PKA + AMPK activas)';
      phosphoColor = 'text-orange-300 border-orange-500/40 bg-orange-500/10';
      neuroState = 'Apetito Activo: Predominio NPY / AgRP e inhibición POMC';
      neuroColor = 'text-orange-300 border-orange-500/40 bg-orange-500/10';
      krebsSpeed = selectedOrgan === 'liver' ? 5.6 : 4.2;
      krebsBadge = selectedOrgan === 'liver' ? '🔄 OAA desviado a Gluconeogénesis' : '⚡ β-Oxidación Activa';
      krebsBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      krebsCenterTitle = selectedOrgan === 'liver' ? 'GLUCONEOGÉNICO' : 'CATABÓLICO';
      krebsCenterSub = selectedOrgan === 'liver' ? 'OAA sale a Glucosa • Inicia Cetogénesis' : 'Ahorro de Glucosa para el Cerebro';
      oaaEscape = selectedOrgan === 'liver';
      damLevel = 72;
    } else {
      insulin = { bar: 10, label: 'Mínima Basal' };
      glucagon = { bar: 95, label: 'Máximo Estímulo Catabólico' };
      cortisol = { bar: 85, label: 'Elevado (Inducción génica PEPCK)' };
      satiety = { bar: 24, label: 'Leptina muy baja (Cetonas moderan apetito)' };
      ghrelin = { bar: 78, label: 'Elevada (Modulada por β-OHB)' };
      phosphoState = 'Fosforilación Máxima (PKA / AMPK + Regulación Génica Cortisol)';
      phosphoColor = 'text-purple-300 border-purple-500/40 bg-purple-500/10';
      neuroState = 'Ayuno >24h: NPY/AgRP activas + β-OHB modera el hambre extrema';
      neuroColor = 'text-purple-300 border-purple-500/40 bg-purple-500/10';
      krebsSpeed = selectedOrgan === 'liver' ? 7.5 : 4.0;
      krebsBadge = selectedOrgan === 'liver' ? '🔄 Fuga Masiva OAA (Cetogénesis)' : '⚡ Oxidación de Cetonas / AG';
      krebsBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      krebsCenterTitle = selectedOrgan === 'liver' ? 'CETOGÉNICO' : 'OXIDATIVO';
      krebsCenterSub = selectedOrgan === 'liver' ? 'OAA → Glucosa | Acetil-CoA → Cetonas' : 'Oxida β-OHB / Acetoacetato';
      oaaEscape = selectedOrgan === 'liver';
      damLevel = 78;
    }

    // Ajuste por Demanda Física
    if (exerciseLoad === 'aerobic') {
      insulin = { bar: Math.max(12, insulin.bar - 30), label: 'Suprimida por Catecolaminas (α2)' };
      glucagon = { bar: Math.min(96, glucagon.bar + 22), label: 'Elevado (Glucogenólisis / Gluconeogénesis)' };
      adrenaline = { bar: 78, label: 'Elevada (Activa LHS adiposa y Glucogenólisis)' };
      cortisol = { bar: Math.min(90, cortisol.bar + 20), label: 'Elevado por Esfuerzo Prolongado' };
      phosphoState = 'Contracción: ↑AMP/ADP activa AMPK + ↑Ca²⁺ + PKA (Adrenalina)';
      phosphoColor = 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
      krebsSpeed = selectedOrgan === 'muscle' ? 1.3 : 2.2;
      krebsBadge = selectedOrgan === 'muscle' ? '🔥 Velocidad Máxima (↑Ca²⁺ y ↑ADP)' : '⚡ Soporte Energético Aeróbico';
      krebsBadgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      krebsCenterTitle = 'TURBO OXIDATIVO';
      krebsCenterSub = 'Isocitrato y α-Cetoglut DH activadas';
      damLevel = 92;
      damBadge = 'Bombeo Máximo (↑VO₂)';
      damBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      pinwheelSpeed = 0.75;
    } else if (exerciseLoad === 'strength') {
      insulin = { bar: Math.max(15, insulin.bar - 20), label: 'Frenada por Adrenalina' };
      glucagon = { bar: Math.min(90, glucagon.bar + 15), label: 'Elevado (Recicla Lactato en Hígado)' };
      adrenaline = { bar: 95, label: 'Pico Catecolaminérgico (Glucogenólisis Rápida)' };
      cortisol = { bar: 75, label: 'Elevado (Estrés Mecánico / Metabólico)' };
      phosphoState = 'Músculo: Descarga Ca²⁺ + ↑AMP + Adrenalina (Glucólisis Anaerobia)';
      phosphoColor = 'text-rose-300 border-rose-500/40 bg-rose-500/10';

      if (isMuscleStrength) {
        hypoxia = true;
        krebsSpeed = 11.0;
        krebsBadge = '⚠️ Frenada en Músculo (Falta O₂ / ↑NADH)';
        krebsBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
        krebsCenterTitle = 'ANAERÓBICO';
        krebsCenterSub = '↑NADH frena Krebs • Piruvato → Lactato';
        damLevel = 30;
        damBadge = 'Frenada en Músculo (Sin O₂)';
        damBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
        pinwheelSpeed = 7.0;
      } else if (selectedOrgan === 'liver') {
        hypoxia = false;
        oaaEscape = true;
        krebsSpeed = 2.8;
        krebsBadge = '⚡ Activa (Aporta ATP para Ciclo de Cori)';
        krebsBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        krebsCenterTitle = 'CICLO DE CORI';
        krebsCenterSub = 'Oxida AG → ATP para Lactato → Glucosa';
        damLevel = 84;
        damBadge = 'Flujo Alto (Sostén Cori)';
        damBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        pinwheelSpeed = 1.4;
      } else {
        hypoxia = false;
        krebsSpeed = 3.8;
        krebsBadge = '⚡ Flujo Aeróbico Conservado';
        krebsBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
        damLevel = 74;
        damBadge = 'Flujo Aeróbico Normal';
        damBadgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
        pinwheelSpeed = 2.0;
      }
    }

    return {
      insulin, glucagon, adrenaline, cortisol, satiety, ghrelin,
      phosphoState, phosphoColor, neuroState, neuroColor,
      krebsSpeed, krebsBadge, krebsBadgeClass, krebsCenterTitle, krebsCenterSub,
      oaaEscape, citrateEscape, hypoxia,
      damLevel, damBadge, damBadgeClass, pinwheelSpeed
    };
  };

  const phys = getPhysiology();

  // Encender / apagar el sintetizador
  useEffect(() => {
    if (audioEnabled) {
      try {
        synthRef.current = createInteriorSynth();
      } catch (e) {
        console.warn('Web Audio API no soportada:', e);
      }
    } else if (synthRef.current) {
      synthRef.current.destroy();
      synthRef.current = null;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.destroy();
        synthRef.current = null;
      }
    };
  }, [audioEnabled]);

  // Clave musical según el estado nutricional / fase de ayuno
  const moodKey = nutritionalState === 'postprandial'
    ? mealType
    : fastingPhase === '4_12h' ? 'f4' : fastingPhase === '12_24h' ? 'f12' : 'f24';

  useEffect(() => {
    if (audioEnabled && synthRef.current) synthRef.current.setMood(moodKey);
  }, [moodKey, audioEnabled]);

  useEffect(() => {
    if (audioEnabled && synthRef.current) synthRef.current.setExercise(exerciseLoad);
  }, [exerciseLoad, audioEnabled]);

  useEffect(() => {
    if (audioEnabled && synthRef.current) synthRef.current.setHypoxia(phys.hypoxia);
  }, [phys.hypoxia, audioEnabled]);

  // Campanita al cambiar de órgano
  useEffect(() => {
    if (audioEnabled && synthRef.current) synthRef.current.ping(selectedOrgan);
  }, [selectedOrgan, audioEnabled]);

  // Explicación contextual de la Noria de Krebs
  const getKrebsExplanation = () => {
    if (exerciseLoad === 'strength' && selectedOrgan === 'muscle') {
      return 'En Fuerza Explosiva, la fibra muscular rápida demanda ATP al instante (PCr y Glucólisis Anaerobia) superando la entrega de O₂. Sin O₂ como aceptor final en el Complejo IV, se acumula NADH + H⁺ y FADH₂, frenando alostéricamente a la Isocitrato DH y α-Cetoglutarato DH. La LDH reduce el piruvato a Lactato para regenerar NAD⁺.';
    }
    if (exerciseLoad === 'strength' && selectedOrgan === 'liver') {
      return '¡Atención conceptual! Durante el ejercicio de Fuerza, el Hígado NO está en hipoxia: su mitocondria oxida activamente Ácidos Grasos para generar los 6 enlaces de alta energía (4 ATP + 2 GTP) que cuesta reconvertir 2 Lactatos musculares en 1 Glucosa mediante el Ciclo de Cori.';
    }
    if (exerciseLoad === 'aerobic') {
      return 'En Ejercicio Aeróbico, el aumento de ADP y Ca²⁺ intramitocondrial activa alostéricamente a la Piruvato DH, Isocitrato DH y α-Cetoglutarato DH: la Noria gira a máxima velocidad enviando NADH (Comp. I) y FADH₂ (Comp. II) a la Represa.';
    }
    if ((nutritionalState === 'fasting' && (fastingPhase === '12_24h' || fastingPhase === 'plus_24h') || mealType === 'keto') && selectedOrgan === 'liver') {
      return 'En Ayuno Prolongado (16h a +24h) o Dieta Cetogénica, el Oxalacetato (4C) hepático se desvía a la Gluconeogénesis (vía PEPCK). Al faltar Oxalacetato para condensarse con el Acetil-CoA de la β-oxidación, el Acetil-CoA se acumula y se deriva a la Cetogénesis (Acetoacetato y β-Hidroxibutirato).';
    }
    if (nutritionalState === 'postprandial' && mealType === 'high_carb' && selectedOrgan === 'liver') {
      return 'Tras una ingesta Alta en Glúcidos, el alto nivel de ATP y NADH frena a la Isocitrato DH. El Citrato (6C) se acumula y sale al citosol (lanzadera de citrato), donde la Citrato Liasa da Acetil-CoA y activa alostéricamente a la Acetil-CoA Carboxilasa (ACC) para formar Malonil-CoA (síntesis de AG y bloqueo de CPT-1).';
    }
    if (nutritionalState === 'postprandial' && mealType === 'protein') {
      return 'Dado que los aminoácidos excedentes no se almacenan, en el Hígado se transaminan y desaminan: el grupo amino entra al Ciclo de la Urea (excretado por orina) y los esqueletos carbonados rellenan la Noria (anaplerosis) hacia Piruvato, α-Cetoglutarato, Succinil-CoA u Oxalacetato.';
    }
    return `En ${organData[selectedOrgan]?.name || 'este tejido'}, la Citrato Sintasa condensa Acetil-CoA (2C) con Oxalacetato (4C) formando Citrato (6C). Las enzimas reguladoras (Isocitrato DH y α-Cetoglutarato DH) responden a la relación ATP/ADP y NADH/NAD⁺.`;
  };

  // Datos por órgano para el Mapa y las Aduanas Enzimáticas
  const isPostprandial = nutritionalState === 'postprandial';
  const isHighInsulin = isPostprandial && (mealType === 'mixed' || mealType === 'high_carb');

  const organData = {
    liver: {
      name: 'Hígado',
      icon: '🫀',
      accentText: 'text-orange-400',
      borderClass: 'border-orange-500/50',
      badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
      btnActiveClass: 'bg-orange-500 text-slate-950 border-orange-400 shadow-sm shadow-orange-500/20',
      mapBadge1: isPostprandial
        ? (mealType === 'keto' ? 'Gluconeogénesis + Cetogénesis' : mealType === 'protein' ? 'Ciclo de la Urea + Gluconeogén.' : 'Glucogenogénesis + Glucólisis')
        : (fastingPhase === '4_12h' ? 'Glucogenólisis (4-12h)' : 'Gluconeogénesis Activa'),
      mapBadge2: isPostprandial
        ? (mealType === 'keto' ? 'Exporta Cetonas (Sin SCOT)' : 'Síntesis AG y VLDL (Apo B-100)')
        : (fastingPhase === 'plus_24h' ? 'Cetogénesis Máxima (+24h)' : 'β-Oxidación Hepática'),
      enzymes: [
        {
          name: 'Glucoquinasa (Hexoquinasa IV)',
          status: isHighInsulin ? 'Activa e Inducida (Insulina)' : 'Inactiva (Secuestrada en Núcleo)',
          active: isHighInsulin,
          desc: 'Isoenzima hepática y pancreática con alta Km (~10 mM, baja afinidad) y alta Vmáx: solo atrapa glucosa cuando abunda en la vena porta postprandial y no se inhibe por Glucosa-6-P.'
        },
        {
          name: 'Glucógeno Sintasa vs. Glucógeno Fosforilasa',
          status: isHighInsulin ? 'Sintasa Activa (Desfosforilada por PP1)' : fastingPhase === '4_12h' && !isPostprandial ? 'Fosforilasa Activa (Fosforilada por PKA)' : 'Glucógeno Hepático Agotado (>16-24h)',
          active: isHighInsulin || (fastingPhase === '4_12h' && !isPostprandial),
          desc: isHighInsulin
            ? 'Modificación covalente: la insulina activa la Fosfatasa PP1, que desfosforila y activa a la Glucógeno Sintasa e inactiva a la Fosforilasa.'
            : 'En ayuno temprano (4-12h) el glucagón (vía AMPc → PKA) fosforila y activa a la Glucógeno Fosforilasa. Hacia las 16-24h la reserva hepática se agota.'
        },
        {
          name: 'PEPCK / Piruvato Carboxilasa / G6Pasa',
          status: !isPostprandial || mealType === 'keto' || mealType === 'protein' || exerciseLoad !== 'rest' ? 'Activas (Cortisol + Glucagón)' : 'Reprimidas por Insulina',
          active: !isPostprandial || mealType === 'keto' || mealType === 'protein' || exerciseLoad !== 'rest',
          desc: 'El Cortisol (receptor intracelular) induce la expresión génica de PEPCK y el Glucagón la activa. Convierte Lactato (Cori), Alanina y Glicerol en glucosa libre gracias a la Glucosa-6-Fosfatasa.'
        },
        {
          name: 'ACC / Malonil-CoA vs. CPT-1 y Cetogénesis',
          status: (!isPostprandial && fastingPhase === 'plus_24h') || mealType === 'keto' ? 'CPT-1 y Cetogénesis Activas' : !isHighInsulin ? 'CPT-1 Activa (β-Oxidación)' : 'ACC Activa → ↑Malonil-CoA frena CPT-1',
          active: true,
          desc: isHighInsulin
            ? 'El exceso de citrato sale al citosol y activa a la Acetil-CoA Carboxilasa (ACC, biotina), formando Malonil-CoA que inhibe a la CPT-1 (evitando quemar los ácidos grasos recién sintetizados).'
            : mealType === 'protein'
            ? 'En dieta hiperproteica o ejercicio, el exceso de amonio de la desaminación de aminoácidos activa el Ciclo de la Urea hepático para excretar urea por orina.'
            : 'Al caer el Malonil-CoA, la CPT-1 mete acil-CoA a la mitocondria (requiere Carnitina). Como el Oxalacetato se desvía a gluconeogénesis, el Acetil-CoA forma Acetoacetato y β-Hidroxibutirato (el hígado no los oxida porque carece de SCOT/Tioforasa).'
        }
      ]
    },
    adipose: {
      name: 'Tejido Adiposo',
      icon: '🟡',
      accentText: 'text-yellow-300',
      borderClass: 'border-yellow-500/50',
      badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
      btnActiveClass: 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-sm shadow-yellow-400/20',
      mapBadge1: isHighInsulin && exerciseLoad === 'rest' ? 'Hidroliza QM/VLDL (LPL-1)' : 'Lipólisis Activa (LHS)',
      mapBadge2: isHighInsulin && exerciseLoad === 'rest' ? 'Síntesis TAG (GLUT-4)' : 'Exporta AG + Glicerol',
      enzymes: [
        {
          name: 'LPL-1 (Lipoproteína Lipasa Endotelial)',
          status: isHighInsulin && exerciseLoad === 'rest' ? 'Activa e Inducida por Insulina' : 'Baja Actividad en Ayuno',
          active: isHighInsulin && exerciseLoad === 'rest',
          desc: 'Enzima extracelular anclada al endotelio capilar adiposo. Hidroliza los TAG transportados por Quilomicrones (Apo B-48) y VLDL (Apo B-100), activada por Apo C-II.'
        },
        {
          name: 'LHS (Lipasa Sensible a Hormonas) y Perilipina',
          status: !isHighInsulin || exerciseLoad !== 'rest' ? 'Activa (Fosforilada por PKA)' : 'Inhibida (Desfosforilada por Insulina)',
          active: !isHighInsulin || exerciseLoad !== 'rest',
          desc: 'En ayuno o ejercicio, el Glucagón y la Adrenalina (receptores β-adrenérgicos → AMPc → PKA) fosforilan y activan a la LHS, liberando Ácidos Grasos Libres (vía Albúmina) y Glicerol (hacia el hígado).'
        },
        {
          name: 'GLUT-4 (Dependiente de Insulina) y Glicerol-3-P',
          status: isHighInsulin && exerciseLoad === 'rest' ? 'Traslocado a Membrana' : 'Retenido en Vesículas',
          active: isHighInsulin && exerciseLoad === 'rest',
          desc: 'El tejido adiposo carece de Glicerol Quinasa: necesita ingresar glucosa por GLUT-4 (estimulado por insulina) para obtener Glicerol-3-Fosfato en la glucólisis y esterificar los TAG.'
        }
      ]
    },
    muscle: {
      name: 'Músculo Esquelético',
      icon: '💪',
      accentText: 'text-rose-400',
      borderClass: 'border-rose-500/50',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      btnActiveClass: 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/20',
      mapBadge1: exerciseLoad === 'strength' ? 'Glucólisis Anaerobia + PCr' : exerciseLoad === 'aerobic' ? 'GLUT4 (AMPK) + β-Oxidación' : isHighInsulin ? 'Glucogenogénesis (GLUT4)' : 'Oxida Ácidos Grasos en Reposo',
      mapBadge2: exerciseLoad === 'strength' ? 'Exporta Lactato (Ciclo Cori)' : exerciseLoad === 'aerobic' ? 'Libera Alanina (Ciclo Ala)' : !isPostprandial ? 'Proteólisis → Libera Alanina' : 'Glucólisis Frenada por ATP/Citrato',
      enzymes: [
        {
          name: 'Hexoquinasa II y Transporte GLUT-4',
          status: isHighInsulin ? 'GLUT-4 por Insulina (PI3K/Akt)' : exerciseLoad !== 'rest' ? 'GLUT-4 por Contracción (AMPK/Ca²⁺)' : 'GLUT-4 en Vesículas (Usa Ác. Grasos)',
          active: isHighInsulin || exerciseLoad !== 'rest',
          desc: 'La Hexoquinasa muscular tiene baja Km (~0.1 mM, alta afinidad) y es inhibida alostéricamente por su producto (Glucosa-6-P). En ejercicio, GLUT-4 se trasloca sin necesitar insulina gracias a AMPK.'
        },
        {
          name: 'Fosfofructoquinasa-1 (PFK-1) y Glucógeno Fosforilasa',
          status: exerciseLoad !== 'rest' ? 'Activadas por ↑AMP, Pi y Ca²⁺' : isHighInsulin ? 'Activas (Glucólisis Postprandial)' : 'Inhibida en Reposo por ↑ATP y ↑Citrato',
          active: exerciseLoad !== 'rest' || isHighInsulin,
          desc: 'En reposo, la β-oxidación de ácidos grasos genera alto ATP y Citrato que inhiben alostéricamente a la PFK-1 (ahorrando glucosa). En ejercicio, el aumento de AMP activa potentemente a la PFK-1.'
        },
        {
          name: 'LDH (Ciclo de Cori) y ALT (Ciclo Glucosa-Alanina)',
          status: exerciseLoad === 'strength' ? 'LDH Máxima (Piruvato → Lactato)' : exerciseLoad === 'aerobic' || !isPostprandial ? 'ALT Activa (Exporta Alanina al Hígado)' : 'PDH Oxidativa Activa',
          active: true,
          desc: exerciseLoad === 'strength'
            ? 'En los primeros 30 seg de esfuerzo intenso anaeróbico, la glucólisis anaerobia degrada glucosa a Lactato sin requerir O₂ (regenerando NAD⁺). El lactato viaja al hígado (Ciclo de Cori).'
            : 'Durante el ejercicio y el ayuno, el músculo transamina piruvato con glutamato formando Alanina (ALT, requiere Vit. B6), transportando nitrógeno de forma segura hacia el hígado para formar urea y glucosa.'
        }
      ]
    },
    brain: {
      name: 'Cerebro',
      icon: '🧠',
      accentText: 'text-purple-400',
      borderClass: 'border-purple-500/50',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      btnActiveClass: 'bg-purple-500 text-white border-purple-400 shadow-sm shadow-purple-500/20',
      mapBadge1: (!isPostprandial && fastingPhase === 'plus_24h') || mealType === 'keto' ? 'Glucosa + Cetonas (β-OHB)' : 'Glucosa Exclusiva (GLUT1/3)',
      mapBadge2: 'No oxida AG (Barrera HE)',
      enzymes: [
        {
          name: 'Hexoquinasa I (HK-I) y GLUT-1 / GLUT-3',
          status: 'Activa Constitutiva (Km ~0.05 mM)',
          active: true,
          desc: 'Transporte independiente de insulina. Su bajísima Km (altísima afinidad por la glucosa) garantiza que las neuronas capten y fosforilen glucosa incluso cuando la glucemia baja en el ayuno.'
        },
        {
          name: 'Tioforasa (SCOT) y β-Hidroxibutirato DH',
          status: (!isPostprandial && fastingPhase === 'plus_24h') || mealType === 'keto' ? 'Cetólisis Neuronal Activa' : 'Basal (Sin cetonemia elevada)',
          active: (!isPostprandial && fastingPhase === 'plus_24h') || mealType === 'keto',
          desc: 'Los ácidos grasos no atraviesan la barrera hematoencefálica. En ayuno prolongado (>24h), el aumento de cuerpos cetónicos circulantes permite al cerebro oxidarlos a Acetil-CoA, disminuyendo el requerimiento de glucosa y la proteólisis muscular.'
        }
      ]
    },
    intestine: {
      name: 'Intestino Delgado',
      icon: '🍽️',
      accentText: 'text-emerald-400',
      borderClass: 'border-emerald-500/50',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      btnActiveClass: 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/20',
      mapBadge1: isPostprandial ? 'Digestión y Absorción Activa' : 'Reposo Digestivo (Motilina)',
      mapBadge2: isPostprandial ? (mealType === 'keto' ? 'Quilomicrones (Apo B-48)' : 'Porta (Gluc/AA) + QM (Linfa)') : 'Oxida Glutamina',
      enzymes: [
        {
          name: 'Amilasa / Disacaridasas y SGLT-1 / GLUT-2',
          status: isPostprandial && mealType !== 'keto' ? 'Absorción Activa a Vena Porta' : 'Basal en Ayuno',
          active: isPostprandial && mealType !== 'keto',
          desc: 'La amilasa hidroliza enlaces α(1→4) del almidón disminuyendo la energía de activación. Los monosacáridos y aminoácidos absorbidos viajan por la Vena Porta directo al Hígado.'
        },
        {
          name: 'Reesterificación de TAG y Quilomicrones (Apo B-48)',
          status: isPostprandial && (mealType === 'mixed' || mealType === 'keto' || mealType === 'high_carb') ? 'Secreción Linfática + GLP-1/CCK' : 'Inactivo en Ayuno',
          active: isPostprandial && mealType !== 'protein',
          desc: 'Los lípidos de la dieta se empaquetan en el enterocito como Quilomicrones (Apo B-48) que pasan a la linfa (evitando el primer paso hepático) y liberan ácidos grasos en tejido adiposo y muscular vía LPL.'
        }
      ]
    }
  };

  const currentOrgan = organData[selectedOrgan];

  // Flujos activos en el mapa
  const flowIntestinePortal = isPostprandial && mealType !== 'keto';
  const flowChylomicrons = isPostprandial && (mealType === 'mixed' || mealType === 'keto');
  const flowVldl = isPostprandial && (mealType === 'mixed' || mealType === 'high_carb');
  const flowLipolysisToLiver = !isHighInsulin || exerciseLoad !== 'rest';
  // En Fuerza explosiva el músculo usa PCr y glucógeno (no AG); en reposo-ayuno y aeróbico sí oxida AG
  const flowLipolysisToMuscle = (!isHighInsulin && exerciseLoad !== 'strength') || exerciseLoad === 'aerobic';
  const flowKetones = (!isPostprandial && fastingPhase === 'plus_24h') || mealType === 'keto';
  const flowCoriOrAlanine = exerciseLoad !== 'rest' || !isPostprandial || mealType === 'protein';

  const organProps = (id) => ({
    id,
    selected: selectedOrgan === id,
    hovered: hoveredOrgan === id,
    onSelect: () => setSelectedOrgan(id),
    onHover: setHoveredOrgan,
    icon: organData[id].icon,
    badges: [organData[id].mapBadge1, organData[id].mapBadge2]
  });

  const noriaAccent = phys.hypoxia ? '#f43f5e' : phys.oaaEscape ? '#c084fc' : '#06b6d4';

  return (
    <div className="min-h-screen w-full bg-[#060913] text-slate-100 font-sans selection:bg-cyan-500/30 flex flex-col overflow-x-hidden">
      <style>{`
        @keyframes spinWheel { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes counterSpinCabins { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes dashFlow { to { stroke-dashoffset: -24; } }
        @keyframes engineRumble {
          0%, 100% { transform: translate(0px, 0px); }
          20% { transform: translate(-1.6px, 0.9px); }
          40% { transform: translate(1.6px, -0.9px); }
          60% { transform: translate(-1.2px, -1.2px); }
          80% { transform: translate(1.2px, 1.2px); }
        }
        @keyframes turboVib {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(0px, -1.2px) scale(1.015); }
        }
        @keyframes hubPulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.35)); }
          50% { filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.85)); }
        }
        .noria-ring { transform-origin: 140px 140px; animation-name: spinWheel; animation-timing-function: linear; animation-iteration-count: infinite; }
        .noria-cabin-upright { animation-name: counterSpinCabins; animation-timing-function: linear; animation-iteration-count: infinite; }
        .noria-stalled-shake { animation: engineRumble 0.22s ease-in-out infinite; }
        .noria-turbo-vib { animation: turboVib 0.35s ease-in-out infinite; }
        .noria-hub-glow { animation: hubPulse 1.8s ease-in-out infinite; }
        .pinwheel-rotor { transform-origin: 0px 0px; animation-name: spinWheel; animation-timing-function: linear; animation-iteration-count: infinite; }
        .active-stream { animation: dashFlow 0.9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .noria-ring, .noria-cabin-upright, .noria-stalled-shake, .noria-turbo-vib, .noria-hub-glow, .pinwheel-rotor, .active-stream { animation-duration: 0s !important; animation: none !important; }
        }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-30 bg-[#060913]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2">
        <div className="max-w-[1640px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-none flex items-center gap-2">
                <span>MetaLab</span>
                <span className="text-xs sm:text-sm font-semibold text-cyan-300/90">(Simulador integral interactivo)</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                INTEGRACIÓN METABÓLICA SISTÉMICA • REPRESA MITOCONDRIAL Y NORIA DE KREBS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                audioEnabled
                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-indigo-300 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span>{audioEnabled ? 'Synth ON' : 'Synth OFF'}</span>
            </button>
          </div>
        </div>

        {/* Pestañas móviles */}
        <div className="lg:hidden mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'map', label: 'Represa & Mapa' },
            { id: 'krebs', label: 'Noria' },
            { id: 'enzymes', label: 'Hormonas & Aduanas' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMobileTab(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                mobileTab === t.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* LAYOUT DE 3 COLUMNAS */}
      <main className="flex-1 max-w-[1640px] w-full mx-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">

        {/* ================= COLUMNA IZQUIERDA: CONTROLES + NORIA ================= */}
        <section className="lg:col-span-3 flex flex-col gap-3 order-1">

          <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-3.5 shadow-xl space-y-3">
            {/* 1. ESTADO METABÓLICO */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">1. ESTADO METABÓLICO</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNutritionalState('postprandial')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    nutritionalState === 'postprandial'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🍽️</span> Postprandial
                </button>
                <button
                  type="button"
                  onClick={() => setNutritionalState('fasting')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    nutritionalState === 'fasting'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>⏳</span> Ayuno
                </button>
              </div>
            </div>

            {/* 2. MACRONUTRIENTES o FASE DE AYUNO */}
            {nutritionalState === 'postprandial' ? (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">2. MACRONUTRIENTES (INGESTA)</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'mixed', label: 'Mixta' },
                    { id: 'high_carb', label: 'Alta HC' },
                    { id: 'keto', label: 'Keto' },
                    { id: 'protein', label: 'Proteica' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMealType(m.id)}
                      className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold border text-center transition-colors cursor-pointer ${
                        mealType === m.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">2. FASE DE AYUNO</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: '4_12h', label: '4–12h', sub: 'Temprano' },
                    { id: '12_24h', label: '12–24h', sub: 'Prolongado (16h)' },
                    { id: 'plus_24h', label: '>24h', sub: 'Cetogénico' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFastingPhase(f.id)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-colors cursor-pointer ${
                        fastingPhase === f.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{f.label}</div>
                      <div className="text-[9px] opacity-80">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. DEMANDA FÍSICA */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">3. DEMANDA FÍSICA</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'rest', label: 'Reposo', icon: '🧘' },
                  { id: 'aerobic', label: 'Aeróbico', icon: '🏃' },
                  { id: 'strength', label: 'Fuerza', icon: '🏋️' }
                ].map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setExerciseLoad(ex.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      exerciseLoad === ex.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{ex.icon}</span> {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LA NORIA DE KREBS (en celular: segunda pantalla, grande) */}
          <div className={`bg-[#0b101e] border border-slate-800/90 rounded-2xl p-3.5 shadow-xl flex-1 flex-col justify-between ${mobileTab === 'krebs' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">LA NORIA DE KREBS:</span>
                <h2 className={`text-sm font-black uppercase tracking-wide flex items-center gap-1.5 ${currentOrgan.accentText}`}>
                  <span>{currentOrgan.icon}</span>
                  <span>{currentOrgan.name}</span>
                </h2>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${phys.krebsBadgeClass}`}>{phys.krebsBadge}</span>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center my-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl py-1.5 px-1 shadow-inner overflow-hidden">
              

              <div className={`mb-1 z-10 px-3.5 py-1 rounded-full bg-amber-950/95 border border-amber-500/70 text-amber-300 text-[11px] font-extrabold flex items-center gap-1.5 shadow-lg transition-transform ${exerciseLoad === 'aerobic' ? 'scale-105' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                +2C Acetil-CoA
              </div>

              <svg
                viewBox="-24 -6 350 322"
                className={`w-full max-w-[520px] lg:max-w-none overflow-visible select-none ${
                  phys.hypoxia ? 'noria-stalled-shake' : exerciseLoad === 'aerobic' ? 'noria-turbo-vib' : ''
                }`}
              >
                <defs>
                  <radialGradient id="noriaHub" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="80%" stopColor="#090d16" />
                    <stop offset="100%" stopColor="#020617" />
                  </radialGradient>
                  <filter id="noriaNeon" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <path id="acetylEntryPath" d="M 140 2 L 140 50" />
                  <path id="co2ExitPath1" d="M 198 92 Q 225 78 252 66" />
                  <path id="co2ExitPath2" d="M 198 188 Q 225 198 252 212" />
                  <path id="nadhDischargePath" d="M 140 192 Q 205 256 298 272" />
                  <path id="oaaEscapePath" d="M 62 128 Q 38 92 22 64" />
                </defs>

                {/* Entrada de Acetil-CoA */}
                <use href="#acetylEntryPath" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.7" />
                {[0, 0.55].map((delay, i) => (
                  <circle key={`ac-${i}`} r="4" fill="#fbbf24" filter="url(#noriaNeon)">
                    <animateMotion dur={`${Math.max(0.7, phys.krebsSpeed * 0.35)}s`} begin={`${delay}s`} repeatCount="indefinite">
                      <mpath href="#acetylEntryPath" />
                    </animateMotion>
                    <animate attributeName="opacity" values="0.2;1;0.1" dur={`${Math.max(0.7, phys.krebsSpeed * 0.35)}s`} begin={`${delay}s`} repeatCount="indefinite" />
                  </circle>
                ))}

                {/* Soportes */}
                <line x1="140" y1="140" x2="78" y2="252" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
                <line x1="140" y1="140" x2="202" y2="252" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
                <line x1="96" y1="215" x2="184" y2="215" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="4 3" />
                <rect x="52" y="248" width="176" height="8" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

                <circle cx="140" cy="140" r="94" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 6" />
                <circle cx="140" cy="140" r="88" fill="none" stroke="#0f172a" strokeWidth="6" />
                <circle cx="140" cy="140" r="84" fill="none" stroke={noriaAccent} strokeWidth="8" opacity="0.14" />

                {/* Rueda giratoria */}
                <g className="noria-ring" style={{ animationDuration: `${phys.krebsSpeed}s` }}>
                  <circle cx="140" cy="140" r="84" fill="none" stroke={noriaAccent} strokeWidth="5" strokeDasharray="20 9" filter="url(#noriaNeon)" />
                  <circle cx="140" cy="140" r="62" fill="none" stroke={phys.hypoxia ? '#881337' : '#164e63'} strokeWidth="1.8" strokeDasharray="6 6" />
                  <line x1="140" y1="56" x2="140" y2="224" stroke="#334155" strokeWidth="2.5" />
                  <line x1="56" y1="140" x2="224" y2="140" stroke="#334155" strokeWidth="2.5" />
                  <line x1="81" y1="81" x2="199" y2="199" stroke="#1e293b" strokeWidth="1.8" strokeDasharray="4 4" />
                  <line x1="199" y1="81" x2="81" y2="199" stroke="#1e293b" strokeWidth="1.8" strokeDasharray="4 4" />

                  {!phys.hypoxia && [45, 135, 225, 315].map((angle, idx) => {
                    const rad = (angle * Math.PI) / 180;
                    return (
                      <g key={`orb-${idx}`} transform={`translate(${140 + 84 * Math.cos(rad)}, ${140 + 84 * Math.sin(rad)})`}>
                        <circle r="4.2" fill="#fde047" filter="url(#noriaNeon)">
                          <animate attributeName="r" values="2.8;5.2;2.8" dur="0.9s" repeatCount="indefinite" />
                        </circle>
                      </g>
                    );
                  })}

                  <Cabin x={140} y={56} speed={phys.krebsSpeed} ring={{ fill: '#064e3b', stroke: '#10b981' }} dot="#34d399" rect={{ fill: '#052e16', stroke: '#10b981', text: '#bbf7d0' }} label="Citrato (6C)" rw={100} ry={-31} ty={-16.5} fs={10.5} />
                  <Cabin x={224} y={140} speed={phys.krebsSpeed} ring={{ fill: '#0c4a6e', stroke: '#38bdf8' }} dot="#7dd3fc" rect={{ fill: '#082f49', stroke: '#38bdf8', text: '#e0f2fe' }} label="α-Cetoglut (5C)" rw={104} ry={-11} ty={3.8} fs={10.5} />
                  <Cabin x={140} y={224} speed={phys.krebsSpeed} ring={{ fill: '#1e1b4b', stroke: '#818cf8' }} dot="#a5b4fc" rect={{ fill: '#1e1b4b', stroke: '#818cf8', text: '#e0e7ff' }} label="Succinato (4C)" rw={100} ry={9} ty={23.5} fs={10.5} />
                  <Cabin
                    x={56} y={140} speed={phys.krebsSpeed}
                    ring={{ fill: '#4c0519', stroke: phys.oaaEscape ? '#c084fc' : '#fb7185' }}
                    dot={phys.oaaEscape ? '#e879f9' : '#fda4af'}
                    rect={{ fill: phys.oaaEscape ? '#3b0764' : '#4c0519', stroke: phys.oaaEscape ? '#c084fc' : '#fb7185', text: '#ffe4e6' }}
                    label="Oxalacetato (4C)" rw={104} ry={-11} ty={3.8} fs={10.5}
                  />
                </g>

                {/* CO2 */}
                {!phys.hypoxia && (
                  <>
                    <circle r="3.2" fill="#94a3b8">
                      <animateMotion dur="1.4s" repeatCount="indefinite"><mpath href="#co2ExitPath1" /></animateMotion>
                      <animate attributeName="opacity" values="0.9;0" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                    <circle r="3.2" fill="#94a3b8">
                      <animateMotion dur="1.4s" begin="0.7s" repeatCount="indefinite"><mpath href="#co2ExitPath2" /></animateMotion>
                      <animate attributeName="opacity" values="0.9;0" dur="1.4s" begin="0.7s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                {[78, 202].map((cy) => (
                  <g key={cy} transform={`translate(234, ${cy})`}>
                    <rect x="-28" y="-10" width="56" height="19" rx="6" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                    <text x="0" y="3" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">💨 -1 CO₂</text>
                  </g>
                ))}

                {/* ENERGÍA HACIA LA REPRESA: chorro grueso, partículas, flecha y cartel que pulsa con la velocidad */}
                {!phys.hypoxia && (
                  <g>
                    <path d="M 140 192 Q 205 256 298 272" fill="none" stroke="#0ea5e9" strokeWidth="11" opacity="0.18" strokeLinecap="round" />
                    <use href="#nadhDischargePath" fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeDasharray="9 5" className="active-stream" strokeLinecap="round" />
                    {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((d, i) => (
                      <circle key={`nadh-${i}`} r={i % 2 ? 4.2 : 5.4} fill={i % 2 ? '#7dd3fc' : '#fde047'} filter="url(#noriaNeon)">
                        <animateMotion
                          dur={`${Math.max(0.6, Math.min(1.8, phys.krebsSpeed * 0.28))}s`}
                          begin={`${d}s`} repeatCount="indefinite"
                        >
                          <mpath href="#nadhDischargePath" />
                        </animateMotion>
                      </circle>
                    ))}
                    {/* Flecha */}
                    <path d="M 280 258 L 304 272 L 278 282 Z" fill="#38bdf8" filter="url(#noriaNeon)">
                      <animate attributeName="opacity" values="1;0.4;1" dur="0.9s" repeatCount="indefinite" />
                    </path>
                    {/* Cartel grande */}
                    <g transform="translate(228, 302)">
                      <rect x="-78" y="-12" width="156" height="24" rx="12" fill="#082f49" stroke="#38bdf8" strokeWidth="1.8" filter="url(#noriaNeon)">
                        <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.1s" repeatCount="indefinite" />
                      </rect>
                      <text x="0" y="4.5" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="900">⚡ Energía (e⁻) → Represa</text>
                    </g>
                  </g>
                )}

                {/* Fuga de Oxalacetato */}
                {phys.oaaEscape && (
                  <g>
                    <use href="#oaaEscapePath" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="4 3" />
                    <circle r="4" fill="#e879f9" filter="url(#noriaNeon)">
                      <animateMotion dur="1.1s" repeatCount="indefinite"><mpath href="#oaaEscapePath" /></animateMotion>
                    </circle>
                    <g transform="translate(44, 62)">
                      <rect x="-40" y="-10" width="82" height="19" rx="6" fill="#3b0764" stroke="#c084fc" strokeWidth="1.4" />
                      <text x="1" y="2.5" textAnchor="middle" fill="#f3e8ff" fontSize="8.8" fontWeight="bold">↖ Sale a Glucosa</text>
                    </g>
                  </g>
                )}

                {/* Núcleo / Turbina central (el título se achica solo si es largo) */}
                <g className="noria-hub-glow">
                  <circle cx="140" cy="140" r="52" fill="url(#noriaHub)" stroke={noriaAccent} strokeWidth="3" />
                  <circle cx="140" cy="140" r="46" fill="none" stroke={phys.hypoxia ? '#fb7185' : '#38bdf8'} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                  <text x="140" y="116" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" letterSpacing="0.06em">TURBINA KREBS</text>
                  <text
                    x="140" y="136" textAnchor="middle"
                    fill={phys.hypoxia ? '#fda4af' : '#38bdf8'} fontWeight="900"
                    fontSize={Math.max(7, Math.min(12, 86 / (Math.max(6, phys.krebsCenterTitle.length) * 0.74)))}
                  >
                    {phys.krebsCenterTitle}
                  </text>
                  <text x="140" y="153" textAnchor="middle" fill="#fde047" fontSize="9.5" fontWeight="bold">3 NADH • 1 FADH₂</text>
                  <text x="140" y="166" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">+ 1 GTP (ATP)</text>
                </g>
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-2 my-2">
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2">
                <div className="text-[10px] font-extrabold text-amber-400 mb-0.5 flex items-center gap-1"><span>⚙️</span> Carga 4 Carbonos</div>
                <p className="text-[10px] text-slate-400 leading-tight">Oxalacetato (4C) recibe +2C (Acetil-CoA) → Citrato (6C). Pierde 2 CO₂.</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2">
                <div className="text-[10px] font-extrabold text-cyan-400 mb-0.5 flex items-center gap-1"><span>⚡</span> Descarga Energética</div>
                <p className="text-[10px] text-slate-400 leading-tight">Transfiere e⁻ (3 NADH + 1 FADH₂) directo hacia LA REPRESA (CTE).</p>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 leading-snug">
              {getKrebsExplanation()}
            </div>
          </div>
        </section>

        {/* ================= COLUMNA CENTRAL: LA REPRESA + MAPA DE ÓRGANOS ================= */}
        <section className={`lg:col-span-6 flex flex-col order-2 ${mobileTab !== 'map' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-[#080c17] border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden">

            <div className="relative w-full flex-1 flex items-start justify-center">
              <svg viewBox="0 0 940 990" className="w-full h-auto select-none">
                <defs>
                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="softGlow" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                  <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                  <linearGradient id="protonWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
                  </linearGradient>
                </defs>

                {/* ---- LA REPRESA: franja de ancho completo arriba ---- */}
                <Dam phys={phys} />

                {/* ---- Mapa de órganos. Hígado al centro (x=470, y≈645) ---- */}
                {/* Hígado -> Cerebro: sale del borde superior-izquierdo del hígado */}
                <Flow d="M 400 560 Q 330 520 270 498" on color={flowKetones ? FLOW.ketone.c : FLOW.glucose.c} dot={flowKetones ? FLOW.ketone.d : FLOW.glucose.d} dur={1.6} label={flowKetones ? 'Glucosa + Cetonas' : 'Glucosa'} lx={345} ly={518} />
                {/* Hígado -> Tejido adiposo (VLDL): borde superior-derecho */}
                <Flow d="M 540 560 Q 610 520 690 498" on={flowVldl} color={FLOW.fat.c} dot={FLOW.fat.d} w={2.8} dur={1.7} label="VLDL (Apo B-100)" lx={612} ly={516} />
                {/* Tejido adiposo -> Hígado (lipólisis): borde derecho del hígado */}
                <Flow d="M 800 498 Q 740 600 592 640" on={flowLipolysisToLiver} color={FLOW.fat.c} dot={FLOW.fat.d} dur={1.7} label="AG Libres + Glicerol" lx={712} ly={598} />
                {/* Tejido adiposo -> Músculo (ácidos grasos): baja por la derecha */}
                <Flow d="M 850 498 Q 905 640 850 780" on={flowLipolysisToMuscle} color={FLOW.fat.c} dot={FLOW.fat.d} w={2.8} dur={1.6} label="Ácidos Grasos" lx={890} ly={640} />
                {/* Intestino -> Hígado (vena porta): borde inferior-izquierdo */}
                <Flow d="M 220 790 Q 300 730 350 700" on={flowIntestinePortal} color={FLOW.glucose.c} dot={FLOW.glucose.d} dur={1.5} label="Glucosa / AA (Porta)" lx={262} ly={742} />
                {/* Intestino -> Tejido adiposo (quilomicrones por linfa): arco por debajo del hígado */}
                <Flow d="M 290 880 Q 620 960 780 498" on={flowChylomicrons} color={FLOW.fat.c} dot={FLOW.fat.d} w={2.5} dur={2.2} label="Quilomicrones (Linfa)" lx={470} ly={942} />
                {/* Hígado -> Músculo */}
                <Flow d="M 575 716 Q 635 750 705 778" on color={flowKetones ? FLOW.ketone.c : FLOW.glucose.c} dot={flowKetones ? FLOW.ketone.d : FLOW.glucose.d} w={2.5} dur={1.7} label={flowKetones ? 'Cetonas / Gluc' : 'Glucosa'} lx={640} ly={736} arrow />
                {/* Músculo -> Hígado (Cori / alanina): arco inferior */}
                <Flow d="M 650 868 Q 520 860 470 748" on={flowCoriOrAlanine} color={exerciseLoad === 'strength' ? FLOW.lactate.c : FLOW.amino.c} dot={exerciseLoad === 'strength' ? FLOW.lactate.d : FLOW.amino.d} w={2.8} dur={1.5} label={exerciseLoad === 'strength' ? 'Lactato (Ciclo de Cori)' : 'Alanina (Ciclo Glu-Ala)'} lx={540} ly={858} arrow />

                {/* ---- ÓRGANOS ---- */}
                <OrganCard {...organProps('brain')} x={110} y={340} w={250} title="CEREBRO" />
                <OrganCard {...organProps('adipose')} x={600} y={340} w={260} title="TEJIDO ADIPOSO" />
                <OrganCard {...organProps('liver')} x={350} y={560} w={240} minH={186} title="HÍGADO" />
                <OrganCard {...organProps('intestine')} x={40} y={780} w={250} title="INTESTINO" />
                <OrganCard {...organProps('muscle')} x={650} y={780} w={260} title="MÚSCULO" />
              </svg>
            </div>

            {/* Leyenda: el color de cada flecha indica qué viaja */}
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-300">
              {Object.values(FLOW).map((f) => (
                <span key={f.name} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-[3px] w-5 rounded-full" style={{ background: f.c }} />
                  {f.name}
                </span>
              ))}
            </div>

            {/* Selector rápido inferior de órganos */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-semibold">Órgano enfocado en Noria y Aduanas:</span>
                {Object.keys(organData).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSelectedOrgan(k)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedOrgan === k
                        ? organData[k].btnActiveClass
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {organData[k].icon} {organData[k].name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= COLUMNA DERECHA: BALANZA HORMONAL + ADUANAS ================= */}
        <section className={`lg:col-span-3 flex flex-col gap-3 order-3 ${mobileTab !== 'enzymes' ? 'hidden lg:flex' : 'flex'}`}>

          <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <span>⚖️</span> BALANZA HORMONAL EN SANGRE
              </h2>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">Nivel Fisiológico</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Insulina (β-Páncreas)', data: phys.insulin, color: 'bg-blue-500', text: 'text-blue-400' },
                { name: 'Glucagón (α-Páncreas)', data: phys.glucagon, color: 'bg-amber-500', text: 'text-amber-400' },
                { name: 'Adrenalina (Suprarrenal)', data: phys.adrenaline, color: 'bg-rose-500', text: 'text-rose-400' },
                { name: 'Cortisol (Suprarrenal)', data: phys.cortisol, color: 'bg-purple-500', text: 'text-purple-400' },
                { name: 'Leptina / GLP-1 / CCK (Saciedad)', data: phys.satiety, color: 'bg-emerald-500', text: 'text-emerald-400' },
                { name: 'Grelina (Estómago - Hambre)', data: phys.ghrelin, color: 'bg-yellow-500', text: 'text-yellow-400' }
              ].map((h, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2 text-[11px] mb-1">
                    <span className="font-bold text-slate-300 leading-snug break-words min-w-0">{h.name}</span>
                    <span className={`text-[10px] font-extrabold leading-snug text-right break-words max-w-[58%] ${h.text}`}>{h.data.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div className={`h-full ${h.color} transition-all duration-500`} style={{ width: `${h.data.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
              <div className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-bold flex items-center gap-1.5 ${phys.phosphoColor}`}>
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-tight">{phys.phosphoState}</span>
              </div>
              <div className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-bold flex items-center gap-1.5 ${phys.neuroColor}`}>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-tight">{phys.neuroState}</span>
              </div>
            </div>
          </div>

          {/* 5. ADUANAS ENZIMÁTICAS POR ÓRGANO */}
          <div className={`bg-[#0b101e] border ${currentOrgan.borderClass} rounded-2xl p-3.5 shadow-xl flex-1 flex flex-col justify-between transition-colors`}>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">5. ADUANAS ENZIMÁTICAS POR ÓRGANO</div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentOrgan.icon}</span>
                  <h3 className={`text-base font-extrabold ${currentOrgan.accentText}`}>{currentOrgan.name}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentOrgan.badgeClass}`}>Inspeccionando</span>
              </div>

              <div className="space-y-2.5">
                {currentOrgan.enzymes.map((enz, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5">
                    <div className="mb-1.5 flex flex-col items-start gap-1.5">
                      <span className="text-xs font-extrabold text-slate-100 leading-snug break-words">{enz.name}</span>
                      <span className={`max-w-full text-[10px] font-bold leading-snug px-2 py-0.5 rounded-md border break-words ${
                        enz.active
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      }`}>
                        {enz.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{enz.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
