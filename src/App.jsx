import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Flame, Zap, Droplets, Brain, Heart, 
  Utensils, Dumbbell, Volume2, VolumeX, Info, 
  ArrowRight, RefreshCw, Sparkles, Sliders, 
  Layers, Gauge, ChevronRight, Eye
} from 'lucide-react';

export default function App() {
  // Estados fisiológicos principales
  const [metabolicState, setMetabolicState] = useState('postprandial'); // 'postprandial' | 'fasting' | 'prolonged_fasting'
  const [exerciseLoad, setExerciseLoad] = useState('rest'); // 'rest' | 'aerobic' | 'strength'
  const [uncoupled, setUncoupled] = useState(false); // Desacople mitocondrial (UCP / Termogénesis)
  const [selectedOrgan, setSelectedOrgan] = useState('liver'); // 'brain' | 'liver' | 'muscle' | 'adipose' | 'intestine'
  
  // Navegación móvil (Smart Responsive)
  const [mobileTab, setMobileTab] = useState('all'); // 'all' | 'krebs' | 'map' | 'enzymes'

  // Sintetizador Bioenergético (Web Audio API)
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);

  // Cálculos dinámicos del perfil hormonal y energético
  const getPhysiology = () => {
    let insulin = 85;
    let glucagon = 20;
    let adrenaline = 15;
    let atpRate = 55;
    let nadhLoad = 50;
    let krebsSpeed = 4; // segundos por vuelta (menor = más rápido)
    let oxaloacetateDepleted = false;
    let hypoxia = false;

    if (metabolicState === 'postprandial') {
      insulin = 90;
      glucagon = 15;
      nadhLoad = 65;
    } else if (metabolicState === 'fasting') {
      insulin = 30;
      glucagon = 70;
      nadhLoad = 55;
    } else if (metabolicState === 'prolonged_fasting') {
      insulin = 10;
      glucagon = 95;
      nadhLoad = 75;
      oxaloacetateDepleted = true; // Desvío de OAA a gluconeogénesis -> Cetogénesis
    }

    if (exerciseLoad === 'aerobic') {
      insulin = Math.max(10, insulin - 25);
      glucagon = Math.min(100, glucagon + 20);
      adrenaline = 65;
      atpRate = 92;
      nadhLoad = 90;
      krebsSpeed = 1.6;
    } else if (exerciseLoad === 'strength') {
      insulin = Math.max(15, insulin - 15);
      adrenaline = 90;
      atpRate = 30; // Cae fosforilación oxidativa por déficit de O2
      nadhLoad = 95; // Acumulación de NADH frena Krebs
      krebsSpeed = 9; // Rueda frenada por falta de NAD+
      hypoxia = true;
    } else {
      atpRate = metabolicState === 'postprandial' ? 60 : 45;
      krebsSpeed = metabolicState === 'postprandial' ? 3.5 : 4.5;
    }

    if (uncoupled) {
      atpRate = Math.max(15, Math.round(atpRate * 0.45));
      krebsSpeed = Math.max(1.2, krebsSpeed * 0.7); // Se acelera oxidación para compensar pérdida de gradiente
    }

    return {
      insulin,
      glucagon,
      adrenaline,
      atpRate,
      nadhLoad,
      krebsSpeed,
      oxaloacetateDepleted,
      hypoxia
    };
  };

  const phys = getPhysiology();

  // Control de audio ambiental generativo (Web Audio API)
  useEffect(() => {
    if (audioEnabled) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.value = 320;
        gain.gain.value = 0.04;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
      } catch (e) {
        console.warn('Audio no soportado:', e);
      }
    } else {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {}
        oscRef.current = null;
      }
    }
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch (e) {}
      }
    };
  }, [audioEnabled]);

  useEffect(() => {
    if (oscRef.current && audioCtxRef.current) {
      const baseFreq = exerciseLoad === 'aerobic' ? 146.83 : exerciseLoad === 'strength' ? 98.0 : 110.0;
      const offset = metabolicState === 'prolonged_fasting' ? -12 : metabolicState === 'postprandial' ? 14 : 0;
      oscRef.current.frequency.setTargetAtTime(baseFreq + offset, audioCtxRef.current.currentTime, 0.3);
    }
  }, [metabolicState, exerciseLoad, uncoupled]);

  // Datos detallados por órgano
  const organDetails = {
    brain: {
      name: 'Cerebro',
      subtitle: 'Demanda energética continua (~120g glucosa/día)',
      color: 'text-purple-400',
      border: 'border-purple-500/40',
      bg: 'bg-purple-500/10',
      substrates: metabolicState === 'prolonged_fasting' 
        ? ['Glucosa (40%)', 'Cuerpos Cetónicos: β-Hidroxibutirato (60%)']
        : ['Glucosa (100% vía GLUT1 / GLUT3 independiente de insulina)'],
      enzymes: [
        { name: 'Hexoquinasa I', status: 'Activa', role: 'Alta afinidad (Km bajo) asegura fosforilación de glucosa incluso en hipoglucemia leve.' },
        { name: 'β-Hidroxibutirato deshidrogenasa', status: metabolicState === 'prolonged_fasting' ? 'Inducida' : 'Basal', role: 'Convierte cuerpos cetónicos en Acetil-CoA en ayuno prolongado.' }
      ],
      note: 'No almacena glucógeno significativo ni oxida ácidos grasos directamente (barrera hematoencefálica).'
    },
    liver: {
      name: 'Hígado',
      subtitle: 'Centro regulador y distribuidor sistémico',
      color: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      substrates: metabolicState === 'postprandial'
        ? ['Glucosa (Glucólisis / Glucogenogénesis)', 'Síntesis de TAG -> Exportación VLDL (Apo B-100)']
        : metabolicState === 'fasting'
        ? ['Glucogenólisis -> Exportación de Glucosa', 'β-Oxidación de Ácidos Grasos']
        : ['Gluconeogénesis (Lactato, Glicerol, Alanina)', 'Cetogénesis activa (Acetoacetato / β-OHB)'],
      enzymes: [
        { 
          name: 'Glucoquinasa (Hexoquinasa IV)', 
          status: metabolicState === 'postprandial' ? 'Activa (Insulina)' : 'Inactiva (Secuestrada en núcleo)', 
          role: 'Sensor de glucosa portal (Km alto); capta exceso postprandial.' 
        },
        { 
          name: 'PEPCK / Glucosa-6-Fosfatasa', 
          status: metabolicState !== 'postprandial' ? 'Activa (Glucagón)' : 'Inhibida', 
          role: 'Permite liberar glucosa libre hacia la sangre para sostener la glucemia.' 
        },
        { 
          name: 'CPT-1 (Carnitina Palmitoiltransferasa I)', 
          status: metabolicState !== 'postprandial' ? 'Activa' : 'Inhibida por Malonil-CoA', 
          role: 'Compuerta de entrada de ácidos grasos a la mitocondria.' 
        }
      ],
      note: 'En ayuno prolongado, el Oxalacetato se desvía hacia la gluconeogénesis, frenando el Ciclo de Krebs y redirigiendo el Acetil-CoA hacia la síntesis de cuerpos cetónicos.'
    },
    muscle: {
      name: 'Músculo Esquelético',
      subtitle: 'Principal consumidor variable de ATP',
      color: 'text-rose-400',
      border: 'border-rose-500/40',
      bg: 'bg-rose-500/10',
      substrates: exerciseLoad === 'strength'
        ? ['Fosfágenos (PCr)', 'Glucógeno intramuscular -> Glucólisis anaeróbica (Lactato)']
        : exerciseLoad === 'aerobic'
        ? ['Ácidos Grasos Libres (β-oxidación)', 'Glucosa plasmática (GLUT4 por contracción/AMPK)']
        : metabolicState === 'postprandial'
        ? ['Glucosa (GLUT4 traslocado por Insulina) -> Glucogenogénesis']
        : ['Ácidos Grasos (reposo en ayuno; ahorra glucosa para el cerebro)'],
      enzymes: [
        { 
          name: 'Glucógeno Fosforilasa', 
          status: exerciseLoad !== 'rest' ? 'Activa (Ca²⁺ + Adrenalina + AMP)' : 'Inactiva', 
          role: 'Degrada glucógeno local para consumo exclusivo del propio miocito.' 
        },
        { 
          name: 'PDH (Piruvato Deshidrogenasa)', 
          status: exerciseLoad === 'aerobic' ? 'Muy Activa' : exerciseLoad === 'strength' ? 'Frenada (↑NADH)' : 'Moderada', 
          role: 'Conecta glucólisis con Ciclo de Krebs.' 
        },
        { 
          name: 'LDH (Lactato Deshidrogenasa)', 
          status: exerciseLoad === 'strength' ? 'Máxima Actividad' : 'Basal', 
          role: 'Regenera NAD⁺ en hipoxia produciendo Lactato (Ciclo de Cori hacia el hígado).' 
        }
      ],
      note: 'Carece de Glucosa-6-Fosfatasa: la glucosa almacenada como glucógeno muscular nunca sale directamente como glucosa libre a la sangre.'
    },
    adipose: {
      name: 'Tejido Adiposo',
      subtitle: 'Reserva energética de triacilgliceroles (TAG)',
      color: 'text-yellow-400',
      border: 'border-yellow-500/40',
      bg: 'bg-yellow-500/10',
      substrates: metabolicState === 'postprandial'
        ? ['Ácidos grasos de Quilomicrones (Apo B-48) y VLDL vía LPL', 'Glucosa (GLUT4) -> Glicerol-3-P']
        : ['Lipólisis activa -> Exporta Ácidos Grasos Libres (Albúmina) + Glicerol'],
      enzymes: [
        { 
          name: 'LPL (Lipoproteína Lipasa endotelial)', 
          status: metabolicState === 'postprandial' ? 'Activa (Insulina)' : 'Baja', 
          role: 'Hidroliza TAG de quilomicrones y VLDL para almacenar ácidos grasos.' 
        },
        { 
          name: 'LHS (Lipasa Sensible a Hormonas)', 
          status: metabolicState !== 'postprandial' || exerciseLoad !== 'rest' ? 'Activa (Glucagón/Adrenalina)' : 'Inhibida por Insulina', 
          role: 'Moviliza reservas de TAG liberando ácidos grasos y glicerol a la circulación.' 
        }
      ],
      note: 'No posee glicerol quinasa: depende de la glucólisis (glicerol-3-fosfato) para esterificar ácidos grasos.'
    },
    intestine: {
      name: 'Intestino Delgado',
      subtitle: 'Absorción y ensamblaje de lipoproteínas exógenas',
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      substrates: metabolicState === 'postprandial'
        ? ['Glucosa y Aminoácidos -> Vena Porta hacia Hígado', 'Lípidos dietarios -> Quilomicrones (Apo B-48) vía Linfa']
        : ['Glutamina (combustible principal del enterocito en ayuno)'],
      enzymes: [
        { 
          name: 'MTP (Proteína Microsomal de Transferencia)', 
          status: metabolicState === 'postprandial' ? 'Activa' : 'Basal', 
          role: 'Ensambla triglicéridos dietarios con Apo B-48 para formar Quilomicrones nacientes.' 
        }
      ],
      note: 'Los lípidos de cadena larga evitan el primer paso hepático viajando por vía linfática como quilomicrones.'
    }
  };

  const currentOrgan = organDetails[selectedOrgan];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* HEADER PRINCIPAL (Escritorio + Móvil) */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent leading-none">
                MetaLab
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Simulador integral metabólico y bioenergético
              </p>
            </div>
          </div>

          {/* Controles rápidos y Sintetizador */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Estado:</span>
              <span className="font-semibold text-cyan-400">
                {metabolicState === 'postprandial' ? 'Postprandial' : metabolicState === 'fasting' ? 'Ayuno (12-18h)' : 'Ayuno Prolongado (+36h)'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Demanda:</span>
              <span className="font-semibold text-amber-400">
                {exerciseLoad === 'rest' ? 'Reposo' : exerciseLoad === 'aerobic' ? 'Aeróbico' : 'Fuerza / Anaeróbico'}
              </span>
            </div>

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                audioEnabled
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Sonificación bioenergética en tiempo real"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{audioEnabled ? 'Audio Bioactivo' : 'Sonido'}</span>
            </button>
          </div>
        </div>

        {/* BARRA DE NAVEGACIÓN MÓVIL / TABLET (< 1024px) */}
        <div className="lg:hidden mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: '📱 Todo' },
            { id: 'krebs', label: '🎡 Controles & Krebs' },
            { id: 'map', label: '🗺️ Mapa & Represa' },
            { id: 'enzymes', label: '🔬 Hormonas & Enzimas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                mobileTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL DE 3 COLUMNAS EN ESCRITORIO */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMNA IZQUIERDA: CONTROLES FISIOLÓGICOS + RUEDA DE KREBS (3 cols) */}
        <section className={`lg:col-span-3 flex flex-col gap-4 ${mobileTab !== 'all' && mobileTab !== 'krebs' ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Panel de Variables Fisiológicas */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Condición Metabólica</h2>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {[
                { id: 'postprandial', title: 'Postprandial (Absortivo)', desc: '↑ Insulina • Glucólisis y Síntesis', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' },
                { id: 'fasting', title: 'Ayuno Nocturno (12-18h)', desc: '↑ Glucagón • Glucogenólisis y Lipólisis', color: 'border-amber-500/50 bg-amber-500/10 text-amber-300' },
                { id: 'prolonged_fasting', title: 'Ayuno Prolongado (+36h)', desc: 'Gluconeogénesis y Cetogénesis hepática', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setMetabolicState(st.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    metabolicState === st.id
                      ? st.color + ' shadow-md'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{st.title}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{st.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-2.5">
              <Dumbbell className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Demanda Física</h2>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {[
                { id: 'rest', label: 'Reposo' },
                { id: 'aerobic', label: 'Aeróbico' },
                { id: 'strength', label: 'Fuerza' }
              ].map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setExerciseLoad(ex.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                    exerciseLoad === ex.id
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Interruptor de Desacople Mitocondrial */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Desacople (UCP1 / Calor)
                </div>
                <div className="text-[10px] text-slate-400">Disipa gradiente H⁺ sin producir ATP</div>
              </div>
              <button
                onClick={() => setUncoupled(!uncoupled)}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                  uncoupled ? 'bg-orange-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    uncoupled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rueda de Noria: Ciclo de Krebs */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Ciclo de Krebs (Matriz)
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  phys.hypoxia 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                    : phys.oxaloacetateDepleted 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {phys.hypoxia ? 'Frenado (↑NADH)' : phys.oxaloacetateDepleted ? 'OAA Desviado' : 'Flujo Activo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                {phys.hypoxia 
                  ? 'Sin O₂ se acumula NADH e inhibe Isocitrato y α-Cetoglutarato DH.' 
                  : phys.oxaloacetateDepleted 
                  ? 'El Oxalacetato sale hacia gluconeogénesis; el Acetil-CoA forma cetonas.'
                  : 'Oxida Acetil-CoA generando NADH y FADH₂ hacia la cadena respiratoria.'}
              </p>
            </div>

            {/* SVG Animado de la Rueda de Krebs */}
            <div className="relative flex items-center justify-center my-2">
              <svg viewBox="0 0 240 220" className="w-full max-w-[230px] overflow-visible">
                <defs>
                  <linearGradient id="krebsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {/* Entrada Acetil-CoA */}
                <path d="M 120 8 L 120 42" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="4 3" />
                <polygon points="116,40 124,40 120,47" fill="#fbbf24" />
                <rect x="76" y="2" width="88" height="18" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                <text x="120" y="14" textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="bold">
                  Acetil-CoA (2C)
                </text>

                {/* Anillo giratorio */}
                <g style={{ transformOrigin: '120px 115px', animation: `spin ${phys.krebsSpeed}s linear infinite` }}>
                  <circle cx="120" cy="115" r="56" fill="none" stroke="url(#krebsGrad)" strokeWidth="6" strokeDasharray="24 10" opacity="0.85" />
                  <circle cx="120" cy="59" r="5" fill="#38bdf8" />
                  <circle cx="176" cy="115" r="5" fill="#34d399" />
                  <circle cx="120" cy="171" r="5" fill="#a78bfa" />
                  <circle cx="64" cy="115" r="5" fill="#fb7185" />
                </g>

                {/* Nodos fijos de referencia */}
                <g>
                  <rect x="85" y="46" width="70" height="18" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <text x="120" y="58" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontWeight="bold">Citrato (6C)</text>

                  <rect x="155" y="106" width="76" height="18" rx="5" fill="#0f172a" stroke="#34d399" strokeWidth="1" />
                  <text x="193" y="118" textAnchor="middle" fill="#d1fae5" fontSize="8.5" fontWeight="bold">α-Cetoglutarato</text>

                  <rect x="82" y="168" width="76" height="18" rx="5" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />
                  <text x="120" y="180" textAnchor="middle" fill="#ede9fe" fontSize="9" fontWeight="bold">Succinato (4C)</text>

                  <rect x="6" y="106" width="78" height="18" rx="5" fill="#0f172a" stroke={phys.oxaloacetateDepleted ? '#c084fc' : '#fb7185'} strokeWidth="1.2" />
                  <text x="45" y="118" textAnchor="middle" fill="#ffe4e6" fontSize="8.5" fontWeight="bold">Oxalacetato</text>
                </g>

                {/* Desvío de Oxalacetato en ayuno prolongado */}
                {phys.oxaloacetateDepleted && (
                  <g>
                    <path d="M 35 104 Q 25 75 52 62" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="3 2" />
                    <text x="42" y="56" textAnchor="middle" fill="#d8b4fe" fontSize="8" fontWeight="bold">
                      → Glucosa
                    </text>
                  </g>
                )}

                {/* Centro: Producción de equivalentes reductores */}
                <circle cx="120" cy="115" r="28" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                <text x="120" y="111" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold">3 NADH</text>
                <text x="120" y="122" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">1 FADH₂</text>
                <text x="120" y="132" textAnchor="middle" fill="#fbbf24" fontSize="8">1 GTP</text>
              </svg>
            </div>

            <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Carga reductora (NADH/FADH₂):</span>
              <span className="font-mono font-bold text-cyan-400">{phys.nadhLoad}%</span>
            </div>
          </div>
        </section>

        {/* COLUMNA CENTRAL: MAPA INTERORGÁNICO + CENTRAL HIDROELÉCTRICA CTE (6 cols) */}
        <section className={`lg:col-span-6 flex flex-col gap-4 ${mobileTab !== 'all' && mobileTab !== 'map' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex-1 flex flex-col justify-between relative overflow-hidden">
            
            {/* Encabezado del Mapa */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 z-10">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Integración Metabólica Interorgánica
                </h2>
                <p className="text-[11px] text-slate-400">Hacé clic en un órgano para inspeccionar sus enzimas clave</p>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Glucosa</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Lípidos/AG</span>
                <span className="flex items-center gap-1 text-purple-400"><span className="w-2 h-2 rounded-full bg-purple-400"></span>Cetonas</span>
              </div>
            </div>

            {/* MÓDULO DE LA REPRESA (CTE) EN MÓVIL (Arriba del mapa para no tapar órganos) */}
            <div className="lg:hidden mb-3 bg-slate-950/90 border border-cyan-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  La Represa (CTE y Fosforilación Oxidativa)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">ATP: {phys.atpRate}%</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                Electrones bombean H⁺ a la represa → mueven la turbina (ATP Sintasa) o escapan como calor por UCP.
              </p>
            </div>

            {/* LIENZO SVG INTERACTIVO: MAPA + REPRESA CTE */}
            <div className="relative w-full flex-1 flex items-center justify-center min-h-[430px] sm:min-h-[500px]">
              <svg viewBox="0 0 680 540" className="w-full h-full max-h-[560px] select-none">
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="damWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
                  </linearGradient>
                </defs>

                {/* =========================================================
                    MÓDULO SUPERIOR IZQUIERDO: CENTRAL HIDROELÉCTRICA (CTE)
                   ========================================================= */}
                <g transform="translate(10, 10)" className="hidden lg:block">
                  {/* Contenedor compacto con aire respecto a la ruta del cerebro */}
                  <rect x="0" y="0" width="252" height="178" rx="14" fill="#070d19" stroke="#1e3a5f" strokeWidth="1.5" />
                  
                  {/* Título y Analogía breve */}
                  <text x="12" y="20" fill="#38bdf8" fontSize="11.5" fontWeight="bold">
                    ⚡ La Represa Mitocondrial (CTE)
                  </text>
                  <text x="12" y="34" fill="#94a3b8" fontSize="8.8">
                    e⁻ bombean H⁺ → turbina genera ATP o desagüe UCP
                  </text>

                  {/* 1. Cable de electrones (Complejos I-III-IV) */}
                  <rect x="12" y="46" width="108" height="22" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                  <text x="66" y="60" textAnchor="middle" fill="#7dd3fc" fontSize="9.5" fontWeight="bold">
                    Bombas I • III • IV (e⁻)
                  </text>
                  {/* Partículas de electrones */}
                  {!phys.hypoxia && (
                    <circle cx="24" cy="57" r="3" fill="#38bdf8" filter="url(#glow)">
                      <animate attributeName="cx" values="20;112" dur={`${Math.max(0.7, phys.krebsSpeed * 0.4)}s`} repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Flecha bombeo H+ */}
                  <path d="M 66 70 L 66 84" stroke="#38bdf8" strokeWidth="2" />
                  <polygon points="62,82 70,82 66,88" fill="#38bdf8" />
                  <text x="95" y="81" fill="#38bdf8" fontSize="8.5" fontWeight="bold">Bombeo H⁺</text>

                  {/* 2. Represa de Protones (Espacio Intermembrana) */}
                  <rect x="12" y="90" width="112" height="66" rx="8" fill="#0f172a" stroke="#0369a1" strokeWidth="1.2" />
                  {/* Nivel dinámico de protones */}
                  <rect 
                    x="14" 
                    y={154 - (phys.nadhLoad * 0.52)} 
                    width="108" 
                    height={phys.nadhLoad * 0.52} 
                    rx="6" 
                    fill="url(#damWater)" 
                  />
                  <text x="68" y="114" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="bold">
                    Represa de H⁺
                  </text>
                  <text x="68" y="128" textAnchor="middle" fill="#bae6fd" fontSize="8.5">
                    Gradiente: {phys.nadhLoad}%
                  </text>
                  {phys.hypoxia && (
                    <text x="68" y="144" textAnchor="middle" fill="#f87171" fontSize="8.5" fontWeight="bold">
                      ⚠ Sin O₂ (Frenado)
                    </text>
                  )}

                  {/* 3. Compuerta de Desagüe Lateral (Desacople UCP -> Calor) */}
                  <path d="M 124 106 L 166 106" stroke={uncoupled ? '#f97316' : '#334155'} strokeWidth={uncoupled ? '3.5' : '1.5'} strokeDasharray={uncoupled ? 'none' : '3 3'} />
                  <rect x="166" y="92" width="76" height="28" rx="6" fill={uncoupled ? '#431407' : '#0f172a'} stroke={uncoupled ? '#f97316' : '#334155'} strokeWidth="1.2" />
                  <text x="204" y="104" textAnchor="middle" fill={uncoupled ? '#fdba74' : '#64748b'} fontSize="8.8" fontWeight="bold">
                    Desagüe UCP
                  </text>
                  <text x="204" y="115" textAnchor="middle" fill={uncoupled ? '#fb923c' : '#475569'} fontSize="8">
                    {uncoupled ? '🔥 CALOR ACTIVO' : 'Cerrado'}
                  </text>

                  {/* 4. Turbina ATP Sintasa (Debajo del desagüe naranja con buen aire) */}
                  <path d="M 124 140 L 166 140" stroke={!uncoupled && !phys.hypoxia ? '#10b981' : '#334155'} strokeWidth="2.5" />
                  <rect x="166" y="126" width="76" height="42" rx="7" fill="#064e3b" fillOpacity={phys.atpRate > 35 ? '0.55' : '0.2'} stroke="#10b981" strokeWidth="1.2" />
                  <text x="204" y="140" textAnchor="middle" fill="#a7f3d0" fontSize="8.5" fontWeight="bold">
                    Turbina Sintasa
                  </text>
                  {/* Sigla ATP bien separada por debajo del gráfico naranja */}
                  <text 
                    x="204" 
                    y="159" 
                    textAnchor="middle" 
                    fill="#34d399" 
                    fontSize="13" 
                    fontWeight="900"
                    className={phys.atpRate > 40 ? 'animate-pulse' : ''}
                  >
                    ATP {phys.atpRate}%
                  </text>
                </g>

                {/* =========================================================
                    RUTAS METABÓLICAS ENTRE ÓRGANOS (Despejadas de La Represa)
                   ========================================================= */}
                
                {/* Ruta Hígado -> Cerebro (Curvada hacia la derecha para no tocar La Represa) */}
                <path 
                  d="M 365 245 Q 395 160 445 95" 
                  fill="none" 
                  stroke={metabolicState === 'prolonged_fasting' ? '#c084fc' : '#10b981'} 
                  strokeWidth="3" 
                  strokeDasharray="6 4"
                />
                <polygon points="441,92 450,90 447,100" fill={metabolicState === 'prolonged_fasting' ? '#c084fc' : '#10b981'} />
                
                {/* Etiqueta Glucosa / Cetonas bien separada de La Represa */}
                <g transform="translate(348, 152)">
                  <rect 
                    x="0" 
                    y="0" 
                    width={metabolicState === 'prolonged_fasting' ? '118' : '74'} 
                    height="22" 
                    rx="7" 
                    fill="#0f172a" 
                    stroke={metabolicState === 'prolonged_fasting' ? '#a855f7' : '#10b981'} 
                    strokeWidth="1.3" 
                  />
                  <text 
                    x={metabolicState === 'prolonged_fasting' ? '59' : '37'} 
                    y="14.5" 
                    textAnchor="middle" 
                    fill={metabolicState === 'prolonged_fasting' ? '#e9d5ff' : '#6ee7b7'} 
                    fontSize="10" 
                    fontWeight="bold"
                  >
                    {metabolicState === 'prolonged_fasting' ? 'Glucosa + Cetonas' : 'Glucosa'}
                  </text>
                </g>

                {/* Ruta Intestino -> Hígado (Vena Porta en Postprandial) */}
                <path 
                  d="M 480 430 Q 430 355 375 305" 
                  fill="none" 
                  stroke={metabolicState === 'postprandial' ? '#10b981' : '#334155'} 
                  strokeWidth={metabolicState === 'postprandial' ? '3' : '1.5'} 
                  strokeDasharray="5 4"
                />
                {metabolicState === 'postprandial' && (
                  <g transform="translate(415, 355)">
                    <rect x="0" y="0" width="96" height="20" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                    <text x="48" y="13.5" textAnchor="middle" fill="#6ee7b7" fontSize="9.5" fontWeight="bold">Porta: Glucosa/AA</text>
                  </g>
                )}

                {/* Ruta Intestino -> Tejido Adiposo (Quilomicrones Apo B-48) */}
                <path 
                  d="M 455 465 L 225 465" 
                  fill="none" 
                  stroke={metabolicState === 'postprandial' ? '#f59e0b' : '#334155'} 
                  strokeWidth={metabolicState === 'postprandial' ? '3' : '1.5'} 
                  strokeDasharray="6 4"
                />
                {metabolicState === 'postprandial' && (
                  <g transform="translate(268, 454)">
                    <rect x="0" y="0" width="144" height="21" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                    <text x="72" y="14" textAnchor="middle" fill="#fde68a" fontSize="9.5" fontWeight="bold">Quilomicrones (Apo B-48)</text>
                  </g>
                )}

                {/* Ruta Tejido Adiposo -> Hígado y Músculo (Ácidos Grasos Libres en Ayuno/Ejercicio) */}
                <path 
                  d="M 155 420 Q 155 335 280 285" 
                  fill="none" 
                  stroke={metabolicState !== 'postprandial' || exerciseLoad !== 'rest' ? '#f59e0b' : '#334155'} 
                  strokeWidth={metabolicState !== 'postprandial' || exerciseLoad !== 'rest' ? '3' : '1.5'} 
                  strokeDasharray="5 4"
                />
                <path 
                  d="M 195 430 Q 340 385 495 295" 
                  fill="none" 
                  stroke={metabolicState !== 'postprandial' || exerciseLoad === 'aerobic' ? '#f59e0b' : '#334155'} 
                  strokeWidth={metabolicState !== 'postprandial' || exerciseLoad === 'aerobic' ? '2.5' : '1.2'} 
                  strokeDasharray="5 4"
                />
                {(metabolicState !== 'postprandial' || exerciseLoad !== 'rest') && (
                  <g transform="translate(132, 342)">
                    <rect x="0" y="0" width="114" height="20" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                    <text x="57" y="13.5" textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="bold">Ácidos Grasos + Glicerol</text>
                  </g>
                )}

                {/* Ruta Hígado <-> Músculo (Ciclo de Cori / Glucosa / VLDL) */}
                <path 
                  d="M 395 270 L 495 270" 
                  fill="none" 
                  stroke={exerciseLoad === 'strength' ? '#fb7185' : '#38bdf8'} 
                  strokeWidth="2.8" 
                />
                <g transform="translate(398, 244)">
                  <rect x="0" y="0" width="96" height="20" rx="6" fill="#0f172a" stroke={exerciseLoad === 'strength' ? '#fb7185' : '#38bdf8'} strokeWidth="1" />
                  <text x="48" y="13.5" textAnchor="middle" fill={exerciseLoad === 'strength' ? '#fecdd3' : '#bae6fd'} fontSize="9" fontWeight="bold">
                    {exerciseLoad === 'strength' ? 'Ciclo de Cori (Lactato)' : metabolicState === 'postprandial' ? 'VLDL (Apo B-100)' : 'Glucosa / Cetonas'}
                  </text>
                </g>

                {/* =========================================================
                    NODOS DE ÓRGANOS CLICKEABLES
                   ========================================================= */}

                {/* 1. CEREBRO (Desplazado a la derecha para dar aire a La Represa) */}
                <g 
                  transform="translate(495, 65)" 
                  onClick={() => setSelectedOrgan('brain')} 
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle r="42" fill="#1e1b4b" stroke={selectedOrgan === 'brain' ? '#c084fc' : '#6366f1'} strokeWidth={selectedOrgan === 'brain' ? '3.5' : '2'} />
                  <text y="-4" textAnchor="middle" fill="#e9d5ff" fontSize="13" fontWeight="bold">🧠 Cerebro</text>
                  <text y="12" textAnchor="middle" fill="#a5b4fc" fontSize="9">
                    {metabolicState === 'prolonged_fasting' ? 'Glucosa + Cetonas' : 'Glucosa (GLUT1/3)'}
                  </text>
                </g>

                {/* 2. HÍGADO (Centro) */}
                <g 
                  transform="translate(335, 275)" 
                  onClick={() => setSelectedOrgan('liver')} 
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle r="50" fill="#271a0c" stroke={selectedOrgan === 'liver' ? '#fbbf24' : '#d97706'} strokeWidth={selectedOrgan === 'liver' ? '3.5' : '2'} />
                  <text y="-6" textAnchor="middle" fill="#fef3c7" fontSize="14" fontWeight="bold">🫀 Hígado</text>
                  <text y="11" textAnchor="middle" fill="#fcd34d" fontSize="9.5">
                    {metabolicState === 'postprandial' ? 'Glucogenogénesis' : metabolicState === 'fasting' ? 'Glucogenólisis' : 'Cetogénesis'}
                  </text>
                </g>

                {/* 3. MÚSCULO ESQUELÉTICO (Derecha) */}
                <g 
                  transform="translate(555, 275)" 
                  onClick={() => setSelectedOrgan('muscle')} 
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle r="48" fill="#2c0b14" stroke={selectedOrgan === 'muscle' ? '#fb7185' : '#e11d48'} strokeWidth={selectedOrgan === 'muscle' ? '3.5' : '2'} />
                  <text y="-6" textAnchor="middle" fill="#ffe4e6" fontSize="13.5" fontWeight="bold">💪 Músculo</text>
                  <text y="11" textAnchor="middle" fill="#fda4af" fontSize="9.5">
                    {exerciseLoad === 'strength' ? 'Glucólisis Anaeróbica' : exerciseLoad === 'aerobic' ? 'β-Oxidación + GLUT4' : 'GLUT4 / Reposo'}
                  </text>
                </g>

                {/* 4. TEJIDO ADIPOSO (Abajo Izquierda) */}
                <g 
                  transform="translate(155, 465)" 
                  onClick={() => setSelectedOrgan('adipose')} 
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle r="45" fill="#261f07" stroke={selectedOrgan === 'adipose' ? '#facc15' : '#ca8a04'} strokeWidth={selectedOrgan === 'adipose' ? '3.5' : '2'} />
                  <text y="-5" textAnchor="middle" fill="#fef9c3" fontSize="13" fontWeight="bold">🟡 Adiposo</text>
                  <text y="11" textAnchor="middle" fill="#fde047" fontSize="9.5">
                    {metabolicState === 'postprandial' ? 'Lipogénesis (LPL)' : 'Lipólisis (LHS)'}
                  </text>
                </g>

                {/* 5. INTESTINO DELGADO (Abajo Derecha) */}
                <g 
                  transform="translate(515, 465)" 
                  onClick={() => setSelectedOrgan('intestine')} 
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle r="45" fill="#06281e" stroke={selectedOrgan === 'intestine' ? '#34d399' : '#059669'} strokeWidth={selectedOrgan === 'intestine' ? '3.5' : '2'} />
                  <text y="-5" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="bold">🧬 Intestino</text>
                  <text y="11" textAnchor="middle" fill="#6ee7b7" fontSize="9.5">
                    {metabolicState === 'postprandial' ? 'Absorción + Apo B-48' : 'Usa Glutamina'}
                  </text>
                </g>
              </svg>
            </div>

            {/* Acceso rápido móvil a enzimas del órgano seleccionado */}
            <div className="lg:hidden mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300">
                Seleccionado: <strong className={currentOrgan.color}>{currentOrgan.name}</strong>
              </span>
              <button
                onClick={() => setMobileTab('enzymes')}
                className="text-xs font-semibold text-cyan-400 flex items-center gap-1"
              >
                Ver enzimas <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: PERFIL HORMONAL + INSPECTOR DE ÓRGANO (3 cols) */}
        <section className={`lg:col-span-3 flex flex-col gap-4 ${mobileTab !== 'all' && mobileTab !== 'enzymes' ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Barras Hormonales en Vivo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Señalización Hormonal</h2>
            </div>

            <div className="space-y-3">
              {/* Insulina */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-300">Insulina (Anabólica)</span>
                  <span className="font-mono text-emerald-400">{phys.insulin}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${phys.insulin}%` }} />
                </div>
              </div>

              {/* Glucagón */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-300">Glucagón (Catabólico)</span>
                  <span className="font-mono text-amber-400">{phys.glucagon}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${phys.glucagon}%` }} />
                </div>
              </div>

              {/* Adrenalina */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-300">Adrenalina (Estrés / Ejercicio)</span>
                  <span className="font-mono text-rose-400">{phys.adrenaline}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${phys.adrenaline}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Inspector Detallado del Órgano Seleccionado */}
          <div className={`bg-slate-900/80 border ${currentOrgan.border} rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className={`text-base font-extrabold ${currentOrgan.color}`}>
                  {currentOrgan.name}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${currentOrgan.bg} ${currentOrgan.color}`}>
                  Órgano Activo
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{currentOrgan.subtitle}</p>

              {/* Selector rápido de órganos */}
              <div className="flex flex-wrap gap-1 mb-4">
                {Object.keys(organDetails).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedOrgan(key)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedOrgan === key
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {organDetails[key].name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Flujo de Sustratos */}
              <div className="mb-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Sustratos y Vías Dominantes
                </h4>
                <ul className="space-y-1.5">
                  {currentOrgan.substrates.map((sub, idx) => (
                    <li key={idx} className="text-xs text-slate-200 bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                      <ArrowRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${currentOrgan.color}`} />
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Regulación Enzimática */}
              <div className="mb-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Enzimas Reguladoras Clave
                </h4>
                <div className="space-y-2">
                  {currentOrgan.enzymes.map((enz, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-100">{enz.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                          {enz.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{enz.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nota Bioquímica */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{currentOrgan.note}</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}