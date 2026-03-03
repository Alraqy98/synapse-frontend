import { useState, useEffect, useRef } from "react";

// ─── EXACT DESIGN TOKENS FROM src/styles.css + tailwind.config.js ────────────
const T = {
  // Backgrounds
  void:       "#0D0F12",        // --bg-void
  panel:      "rgba(25,29,34,0.68)", // --bg-panel
  base:       "#111114",        // file viewer --bg-base
  surface:    "#17171b",        // file viewer --bg-surface
  raised:     "#1e1e24",        // file viewer --bg-raised
  // Text
  main:       "#F5F5F7",        // --text-main
  muted:      "rgba(245,245,247,0.6)",  // --text-muted
  dim:        "rgba(245,245,247,0.35)",
  faint:      "rgba(245,245,247,0.2)",
  // Borders
  border:     "rgba(255,255,255,0.06)", // --border-color
  borderMid:  "rgba(255,255,255,0.10)",
  // Brand
  teal:       "#00C8B4",        // --teal (REAL teal, not #2DD4BF!)
  tealNeon:   "#00F5CC",        // --teal-neon
  tealDim:    "rgba(0,200,180,0.10)",
  tealBorder: "rgba(0,200,180,0.20)",
  // Performance states (from PerformancePage)
  stable:     "#C4A84F",        // STATE_CONFIG.STABLE
  improving:  "#4E9E7A",
  declining:  "#E55A4E",
  // Action card accents (from DashboardQuickActions)
  blue:       "#3F7CFF",
  purple:     "#7A6CFF",
  amber:      "#F5A623",
  green:      "#5BFFA8",
  // Misc
  red:        "#EF4444",
  shadow:     "0 4px 20px rgba(0,0,0,0.40)",
  shadowGlow: "0 0 15px rgba(0,245,204,0.40)",
};

const TOTAL_MS = 90000;
const SPEED    = 0.68;

// ─── UTILS ───────────────────────────────────────────────────────────────────
const cl   = (v,lo=0,hi=1) => Math.max(lo,Math.min(hi,v));
const eo   = t => 1-Math.pow(1-t,3);
const lerp = (a,b,t) => a+(b-a)*t;
const fIn  = (el,s,d) => eo(cl((el-s)/d));
const fOut = (el,s,d) => 1-cl((el-s)/d);

// ─── FONTS (matching real app: Inter + Syne + Geist Mono) ────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
`;

// ─── LOGO (PNG asset — base64 encoded inline for portability) ────────────────
// Using the actual hexagonal S SVG that matches synapse-logo.png
function Logo({ size=28 }) {
  return (
    <svg width={size} height={size*1.15} viewBox="0 0 100 115" fill="none">
      <polygon points="50,3 97,28 97,88 50,113 3,88 3,28"
        stroke={T.teal} strokeWidth="6.5" fill="none" strokeLinejoin="round"/>
      <path d="M63,37 C63,37 37,37 37,51 C37,62 51,63 51,73 C51,83 37,83 37,83"
        stroke={T.teal} strokeWidth="7.5" strokeLinecap="round" fill="none"/>
      <path d="M37,73 C37,73 63,73 63,59 C63,48 49,47 49,37"
        stroke={T.teal} strokeWidth="7.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ─── SHARED: DOT GRID ────────────────────────────────────────────────────────
function Grid({ opacity=1 }) {
  return (
    <div style={{
      position:"absolute",inset:0,pointerEvents:"none",opacity,
      backgroundImage:`radial-gradient(circle,rgba(0,200,180,0.08) 1px,transparent 1px)`,
      backgroundSize:"36px 36px",
      maskImage:"radial-gradient(ellipse 85% 85% at 50% 50%,black 20%,transparent 100%)",
      WebkitMaskImage:"radial-gradient(ellipse 85% 85% at 50% 50%,black 20%,transparent 100%)",
    }}/>
  );
}

// ─── SHARED: BROWSER CHROME ──────────────────────────────────────────────────
function Chrome({ url, children }) {
  return (
    <div style={{
      width:"100%",height:"100%",borderRadius:10,overflow:"hidden",
      border:`1px solid rgba(255,255,255,0.07)`,
      boxShadow:"0 40px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.03)",
      display:"flex",flexDirection:"column",
    }}>
      <div style={{
        height:38,flexShrink:0,background:"#080a0d",
        borderBottom:`1px solid ${T.border}`,
        display:"flex",alignItems:"center",padding:"0 14px",gap:10,
      }}>
        <div style={{display:"flex",gap:6}}>
          {["#ff5f57","#febc2e","#28c840"].map((c,i)=>(
            <div key={i} style={{width:11,height:11,borderRadius:"50%",background:c}}/>
          ))}
        </div>
        <div style={{
          flex:1,maxWidth:360,height:22,margin:"0 auto",
          background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,
          borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:10.5,color:T.dim,fontFamily:"'JetBrains Mono',monospace",
        }}>{url}</div>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex"}}>{children}</div>
    </div>
  );
}

// ─── SHARED: SIDEBAR (exact from real app nav) ────────────────────────────────
const NAV_ITEMS = [
  { key:"home",   label:"Home",     icon:<path d="M3 12L12 3l9 9v8a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-8z"/> },
  { key:"library",label:"Library",  icon:<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/> },
  { key:"tutor",  label:"Tutor",    icon:<><ellipse cx="12" cy="12" rx="9" ry="7"/><path d="M8 9c1.5 2 5 2 8 0M8 15c1.5-2 5-2 8 0M12 5v14"/></> },
  { key:"mcq",    label:"MCQ",      icon:<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 12l3 3 5.5-5.5"/></> },
  { key:"summary",label:"Summary",  icon:<><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h14v14H6.5"/></> },
  { key:"flash",  label:"Cards",    icon:<path d="M13 2L4.5 13.5H11L10 22l9.5-11.5H13.5L13 2z"/> },
  { key:"planner",label:"Planner",  icon:<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></> },
  { key:"learning",label:"Learning",icon:<path d="M18 20V10M12 20V4M6 20v-6"/> },
  { key:"settings",label:"Settings",icon:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></> },
];

function NavIcon({ d }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}

function Sidebar({ active="home" }) {
  return (
    <div style={{
      width:56,flexShrink:0,
      background:"#09090c",
      borderRight:`1px solid ${T.border}`,
      display:"flex",flexDirection:"column",
      alignItems:"center",padding:"10px 0",
      gap:2,
    }}>
      <div style={{marginBottom:12,marginTop:2}}><Logo size={26}/></div>
      {NAV_ITEMS.map(({key,icon})=>{
        const on=key===active;
        return (
          <div key={key} style={{
            width:38,height:38,borderRadius:9,
            display:"flex",alignItems:"center",justifyContent:"center",
            background:on?"rgba(0,200,180,0.10)":"transparent",
            color:on?T.teal:"rgba(245,245,247,0.25)",
            marginBottom:key==="flash"?"auto":0,
          }}>
            <NavIcon d={icon}/>
          </div>
        );
      })}
      {/* Avatar */}
      <div style={{
        width:28,height:28,borderRadius:"50%",marginTop:8,
        background:`linear-gradient(135deg,${T.teal} 0%,#0e7490 100%)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:9.5,fontWeight:700,color:"#000",letterSpacing:"0.03em",
      }}>MA</div>
    </div>
  );
}

// ─── CAPTION OVERLAY ─────────────────────────────────────────────────────────
function Caption({ line1, teal, opacity }) {
  if (!opacity) return null;
  return (
    <div style={{
      position:"absolute",bottom:40,left:"50%",transform:"translateX(-50%)",
      opacity,pointerEvents:"none",textAlign:"center",zIndex:20,
      background:"rgba(9,9,12,0.75)",backdropFilter:"blur(10px)",
      padding:"11px 26px",borderRadius:10,border:`1px solid ${T.border}`,
      whiteSpace:"nowrap",
    }}>
      <p style={{
        fontFamily:"'Syne',sans-serif",fontSize:21,fontWeight:700,color:T.main,
      }}>
        {line1}<span style={{color:T.teal}}>{teal}</span>
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK
// ══════════════════════════════════════════════════════════════════
function SceneHook({el}) {
  const words=[
    {w:"Medical",   accent:false},{w:"students",accent:false},{w:"spend",  accent:false},
    {w:"40%",       accent:true },
    {w:"of study time",accent:false},
    {w:"fighting",  accent:true },{w:"their",  accent:true },{w:"tools.", accent:true },
  ];
  const D=360;
  const allDone=words.length*D+500;
  return (
    <div style={{
      position:"absolute",inset:0,background:"#000",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 80px",
    }}>
      {/* Subtle vignette */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 70% at 50% 50%,transparent 40%,rgba(0,0,0,0.5) 100%)",pointerEvents:"none"}}/>
      <div style={{
        position:"relative",
        fontFamily:"'Syne',sans-serif",
        fontSize:"clamp(36px,5.5vw,64px)",
        fontWeight:900,lineHeight:1.3,textAlign:"center",
        display:"flex",flexWrap:"wrap",gap:"0 16px",justifyContent:"center",
        maxWidth:820,
      }}>
        {words.map(({w,accent},i)=>{
          const p=eo(cl((el-i*D)/580));
          return (
            <span key={i} style={{
              display:"inline-block",
              color:accent?T.teal:T.main,
              opacity:p,
              transform:`translateY(${lerp(28,0,p)}px) scale(${lerp(0.92,1,p)})`,
              textShadow:accent&&p>0.6?`0 0 60px rgba(0,200,180,0.35)`:"none",
            }}>{w}</span>
          );
        })}
      </div>
      {/* Teal underline */}
      <div style={{
        marginTop:32,height:2,borderRadius:2,background:`linear-gradient(90deg,transparent,${T.teal},transparent)`,
        width:`${lerp(0,380,eo(cl((el-allDone)/700)))}px`,
        opacity:cl((el-allDone)/400),
      }}/>
      <p style={{
        marginTop:24,fontSize:20,color:"rgba(245,245,247,0.45)",fontFamily:"'Inter',sans-serif",fontWeight:300,
        opacity:eo(cl((el-allDone-500)/600)),letterSpacing:"0.04em",
      }}>There's a better way.</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 2 — INTRO (cinematic)
// ══════════════════════════════════════════════════════════════════
function SceneIntro({el}) {
  // Phase 1: flash + logo slam (0–1800ms)
  // Phase 2: wordmark + tagline (1800–5000ms)
  // Phase 3: feature pills fly in (3500–7000ms)

  const flashT  = cl(el/120);           // very fast white flash
  const flashOut= 1-cl((el-80)/320);    // quick fade
  const flash   = flashT * flashOut;

  const logoT   = eo(cl((el-100)/700));
  const ringT   = eo(cl((el-200)/900));
  const glowT   = eo(cl((el-400)/1200));

  // Wordmark letters stagger in
  const LETTERS = "SYNAPSE".split("");
  const wordStart= 900;
  const nT      = eo(cl((el-wordStart)/600));

  // Subtitle
  const sT      = eo(cl((el-1600)/600));
  const tT      = eo(cl((el-2100)/500));

  // Feature pills
  const PILLS = [
    { label:"OCR Indexing",        icon:"⬡", delay:2600 },
    { label:"Source-Linked MCQs",  icon:"✦", delay:2900 },
    { label:"Concept Decay Logic", icon:"⟳", delay:3200 },
    { label:"Astra AI Tutor",      icon:"◈", delay:3500 },
  ];

  // Orbiting ring segments
  const ringOpacity = ringT * 0.55;

  return (
    <div style={{position:"absolute",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>

      {/* White flash */}
      <div style={{position:"absolute",inset:0,background:"#fff",opacity:flash,pointerEvents:"none",zIndex:30}}/>

      {/* Dot grid — fades in */}
      <div style={{
        position:"absolute",inset:0,pointerEvents:"none",opacity:glowT*0.6,
        backgroundImage:`radial-gradient(circle,rgba(0,200,180,0.10) 1px,transparent 1px)`,
        backgroundSize:"32px 32px",
      }}/>

      {/* Big teal glow orb */}
      <div style={{
        position:"absolute",
        width:cl(glowT)*700,height:cl(glowT)*700,
        borderRadius:"50%",
        background:`radial-gradient(circle,rgba(0,200,180,${0.14*glowT}) 0%,transparent 65%)`,
        top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        pointerEvents:"none",filter:"blur(0px)",transition:"none",
      }}/>

      {/* Orbiting ring */}
      <svg style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:ringOpacity,pointerEvents:"none"}}
        width={340} height={340} viewBox="0 0 340 340">
        <circle cx={170} cy={170} r={155} fill="none" stroke={T.teal} strokeWidth="0.6" strokeDasharray="12 8" opacity="0.4"/>
        <circle cx={170} cy={170} r={140} fill="none" stroke={T.teal} strokeWidth="0.3" strokeDasharray="4 20" opacity="0.25"/>
        {/* 4 corner accent marks */}
        {[0,90,180,270].map(a=>{
          const rad=a*Math.PI/180;
          const x=170+155*Math.cos(rad), y=170+155*Math.sin(rad);
          return <circle key={a} cx={x} cy={y} r={3} fill={T.teal} opacity={0.7}/>;
        })}
      </svg>

      {/* CENTER CONTENT */}
      <div style={{position:"relative",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",zIndex:2}}>

        {/* Logo — slams in with scale */}
        <div style={{
          opacity:logoT,
          transform:`scale(${lerp(1.6,1,eo(cl((el-100)/500)))})`,
          marginBottom:26,
          filter:`drop-shadow(0 0 ${24*glowT}px rgba(0,200,180,0.6))`,
        }}>
          <Logo size={88}/>
        </div>

        {/* SYNAPSE wordmark — letters fall in */}
        <div style={{display:"flex",gap:0,marginBottom:0}}>
          {LETTERS.map((ch,i)=>{
            const p=eo(cl((el-wordStart-i*55)/420));
            return (
              <span key={i} style={{
                fontFamily:"'Syne',sans-serif",fontSize:72,fontWeight:900,
                letterSpacing:"0.25em",color:T.main,
                opacity:p,
                transform:`translateY(${lerp(-22,0,p)}px)`,
                display:"inline-block",
                textShadow:p>0.8?`0 0 40px rgba(0,200,180,0.15)`:"none",
              }}>{ch}</span>
            );
          })}
        </div>

        {/* Subtitle */}
        <div style={{
          display:"flex",alignItems:"center",gap:10,marginTop:14,
          opacity:sT,transform:`translateY(${lerp(8,0,sT)}px)`,
        }}>
          <div style={{width:28,height:1,background:T.teal,opacity:0.5}}/>
          <span style={{fontSize:16,color:T.muted,letterSpacing:"0.12em",fontFamily:"'Inter',sans-serif",textTransform:"uppercase",fontWeight:300}}>
            Curriculum Intelligence Infrastructure
          </span>
          <div style={{width:28,height:1,background:T.teal,opacity:0.5}}/>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize:14,color:T.dim,fontStyle:"italic",marginTop:8,
          fontFamily:"'Inter',sans-serif",opacity:tT,letterSpacing:"0.03em",
        }}>For medical students. Built by one.</p>

        {/* Feature pills */}
        <div style={{display:"flex",gap:10,marginTop:32,flexWrap:"wrap",justifyContent:"center"}}>
          {PILLS.map((p,i)=>{
            const pt=eo(cl((el-p.delay)/420));
            return (
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:7,
                padding:"7px 16px",
                background:"rgba(0,200,180,0.06)",
                border:`1px solid rgba(0,200,180,${0.15+pt*0.12})`,
                borderRadius:20,
                opacity:pt,
                transform:`translateY(${lerp(10,0,pt)}px)`,
              }}>
                <span style={{fontSize:12,color:T.teal}}>{p.icon}</span>
                <span style={{fontSize:12.5,color:T.muted,fontFamily:"'Inter',sans-serif",fontWeight:500}}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 3 — DASHBOARD (from DashboardPage + DashboardQuickActions + DashboardRecentActivity)
// ══════════════════════════════════════════════════════════════════
// Action cards with REAL accents from DashboardQuickActions.jsx
const ACTIONS = [
  { label:"Upload Files",        desc:"Add new study materials",        accent:T.teal,   glow:"rgba(0,200,180,0.12)", border:"rgba(0,200,180,0.18)" },
  { label:"Open Library",        desc:"Browse and organize your files", accent:T.blue,   glow:"rgba(63,124,255,0.12)",border:"rgba(63,124,255,0.18)" },
  { label:"Ask Astra",           desc:"Chat with your AI tutor",        accent:T.purple, glow:"rgba(122,108,255,0.12)",border:"rgba(122,108,255,0.18)" },
  { label:"Generate Summaries",  desc:"Create structured AI summaries", accent:T.teal,   glow:"rgba(0,200,180,0.12)", border:"rgba(0,200,180,0.18)" },
  { label:"Generate MCQs",       desc:"Build practice question decks",  accent:T.amber,  glow:"rgba(245,166,35,0.12)",border:"rgba(245,166,35,0.18)" },
  { label:"Generate Flashcards", desc:"Create spaced repetition decks", accent:T.green,  glow:"rgba(91,255,168,0.12)",border:"rgba(91,255,168,0.18)" },
];

const RECENT_FILES = [
  {n:"5 Newborn Physical Examination",       cat:"Lecture",  t:"21h ago"},
  {n:"5. ALS and Recognition of resp failure",cat:"Lecture", t:"21h ago"},
  {n:"Approach to anemia in children",        cat:"Lecture",  t:"3d ago"},
  {n:"Cardiovascular System Examination",     cat:"Lecture",  t:"3d ago"},
];
const RECENT_GENS = [
  {n:"Newborn",    type:"MCQ Deck",    t:"21h ago",  accent:T.amber, glow:"rgba(245,166,35,0.12)"},
  {n:"ALS in Peds",type:"MCQ Deck",   t:"3d ago",   accent:T.amber, glow:"rgba(245,166,35,0.12)"},
  {n:"testing new",type:"MCQ Deck",   t:"2/17/2026", accent:T.amber, glow:"rgba(245,166,35,0.12)"},
  {n:"ALS",        type:"Flashcards", t:"2/17/2026", accent:T.green, glow:"rgba(91,255,168,0.12)"},
];
const EVENTS = [
  {n:"Oral Exam",  type:"exam",  date:"Mar 24", days:"in 21d"},
  {n:"Oral Exam",  type:"exam",  date:"Mar 24", days:"in 21d"},
];

// SectionCard — matches DashboardRecentActivity SectionCard exactly
function SectionCard({label,title,children}) {
  return (
    <div style={{
      borderRadius:18,border:`1px solid ${T.border}`,
      background:"rgba(13,15,18,0.60)",
      padding:"22px 20px",backdropFilter:"blur(8px)",
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,247,0.3)",marginBottom:4}}>{label}</div>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:T.main}}>{title}</h3>
        </div>
        <span style={{fontSize:11,color:"rgba(0,200,180,0.6)",fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}}>View all →</span>
      </div>
      <div style={{height:1,background:"rgba(255,255,255,0.04)",marginBottom:12}}/>
      {children}
    </div>
  );
}

function ActivityRow({icon, iconBg, iconBorder, iconColor, primary, meta, badge, badgeBg, badgeColor}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,border:"1px solid transparent"}}>
      <div style={{width:36,height:36,borderRadius:8,background:iconBg,border:`1px solid ${iconBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:T.main,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{primary}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
          <span style={{fontSize:11,color:T.dim,fontFamily:"'JetBrains Mono',monospace"}}>{meta[0]}</span>
          <span style={{fontSize:10,color:"rgba(245,245,247,0.2)"}}>·</span>
          <span style={{fontSize:11,color:T.dim,fontFamily:"'JetBrains Mono',monospace"}}>{meta[1]}</span>
        </div>
      </div>
      {badge&&<div style={{padding:"3px 9px",borderRadius:100,background:badgeBg,border:`1px solid ${badgeColor}`,flexShrink:0}}>
        <span style={{fontSize:10,color:badgeColor,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:"0.05em"}}>{badge}</span>
      </div>}
    </div>
  );
}

const FILE_ICON   = <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>;
const CHECK_ICON  = <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 12l3 3 5.5-5.5"/></>;
const ZAP_ICON    = <path d="M13 2L4.5 13.5H11L10 22l9.5-11.5H13.5L13 2z"/>;
const CAL_ICON    = <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>;
const GRAD_ICON   = <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>;

function SceneDashboard({el}) {
  const bT=eo(cl(el/600));
  const glow=cl((el-4200)/800); // upload card glow
  return (
    <div style={{position:"absolute",inset:0,opacity:bT}}>
      <Chrome url="synapse-app.io/dashboard">
        <div style={{display:"flex",height:"100%",background:T.void,overflow:"hidden"}}>
          <Sidebar active="home"/>
          <div style={{flex:1,overflowY:"auto",padding:"24px 32px",position:"relative"}}>
            {/* Ambient glow — matches DashboardPage exactly */}
            <div style={{
              position:"absolute",top:-180,left:"50%",transform:"translateX(-50%)",
              width:900,height:500,borderRadius:"50%",
              background:"radial-gradient(ellipse,rgba(0,200,180,0.07) 0%,transparent 70%)",
              pointerEvents:"none",filter:"blur(40px)",
            }}/>

            {/* Welcome — DashboardWelcome */}
            <div style={{position:"relative",marginBottom:32}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:24,marginBottom:4}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(0,200,180,0.7)",marginBottom:10}}>
                    GOOD MORNING
                  </div>
                  <h1 style={{lineHeight:1.1,marginBottom:10}}>
                    <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"clamp(28px,3.5vw,42px)",color:T.main,letterSpacing:"-0.02em"}}>
                      Welcome back,{" "}
                    </span>
                    <span style={{
                      fontFamily:"'Syne',sans-serif",fontStyle:"italic",
                      fontSize:"clamp(32px,4vw,48px)",
                      background:`linear-gradient(135deg,${T.teal},${T.tealNeon})`,
                      WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                    }}>Mohammed.</span>
                  </h1>
                  <p style={{fontSize:15,color:"rgba(245,245,247,0.5)",marginTop:4}}>
                    Pick up where you left off or start something new.
                  </p>
                </div>
                {/* Tour CTA */}
                <button style={{
                  display:"flex",alignItems:"center",gap:8,
                  padding:"9px 16px",borderRadius:12,
                  background:"rgba(0,200,180,0.08)",border:"1px solid rgba(0,200,180,0.2)",
                  color:T.teal,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,
                  cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
                }}>
                  ✨ Take a 2-minute tour →
                </button>
              </div>
              <div style={{height:1,background:`linear-gradient(90deg,rgba(0,200,180,0.2),rgba(0,200,180,0.05) 60%,transparent)`,marginTop:24}}/>
            </div>

            {/* Quick Actions label */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,247,0.3)"}}>Quick Actions</span>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,0.05)"}}/>
            </div>

            {/* Action grid — 3 cols, exact card design from ActionCard component */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
              {ACTIONS.map((a,i)=>(
                <div key={i} style={{
                  position:"relative",display:"flex",alignItems:"flex-start",gap:16,
                  padding:"20px 22px",borderRadius:16,
                  background:i===0&&glow>0?`rgba(0,200,180,${0.04+glow*0.04})`:"rgba(13,15,18,0.70)",
                  border:`1px solid ${i===0&&glow>0?`rgba(0,200,180,${0.18+glow*0.22})`:T.border}`,
                  boxShadow:i===0&&glow>0?`0 8px 32px ${a.glow}`:"none",
                  overflow:"hidden",
                }}>
                  <div style={{
                    padding:10,borderRadius:10,flexShrink:0,
                    background:i===0&&glow>0?a.glow:"rgba(255,255,255,0.04)",
                    border:`1px solid ${i===0&&glow>0?a.border:T.border}`,
                  }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={i===0&&glow>0?a.accent:"rgba(245,245,247,0.5)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      {i===0?<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      :i===1?<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                      :i===2?<><ellipse cx="12" cy="12" rx="9" ry="7"/><path d="M8 9c1.5 2 5 2 8 0M8 15c1.5-2 5-2 8 0"/></>
                      :i===3?<><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h14v14H6.5"/></>
                      :i===4?<>{CHECK_ICON}</>
                      :<>{ZAP_ICON}</>}
                    </svg>
                  </div>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:14,color:T.main,marginBottom:4}}>{a.label}</div>
                    <div style={{fontSize:12,color:"rgba(245,245,247,0.4)",lineHeight:1.4}}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity label */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,247,0.3)"}}>Recent Activity</span>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,0.05)"}}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
              {/* Recent Uploads */}
              <SectionCard label="FILES" title="Recent Uploads">
                {RECENT_FILES.map((f,i)=>(
                  <ActivityRow key={i}
                    icon={FILE_ICON} iconBg="rgba(0,200,180,0.08)" iconBorder="rgba(0,200,180,0.15)" iconColor={T.teal}
                    primary={f.n} meta={[f.cat,f.t]}/>
                ))}
              </SectionCard>
              {/* Recent Generations */}
              <SectionCard label="OUTPUTS" title="Recent Generations">
                {RECENT_GENS.map((g,i)=>(
                  <ActivityRow key={i}
                    icon={g.type==="Flashcards"?ZAP_ICON:CHECK_ICON}
                    iconBg={g.glow} iconBorder={`${g.accent}22`} iconColor={g.accent}
                    primary={g.n} meta={[g.type,g.t]}
                    badge="Done" badgeBg={g.glow} badgeColor={g.accent}/>
                ))}
              </SectionCard>
              {/* Upcoming Events */}
              <SectionCard label="PLANNER" title="Upcoming Events">
                {EVENTS.map((e,i)=>(
                  <ActivityRow key={i}
                    icon={GRAD_ICON} iconBg="rgba(255,75,75,0.08)" iconBorder="rgba(255,75,75,0.2)" iconColor="#FF4B4B"
                    primary={e.n} meta={["Exam",e.date]}
                    badge={e.days} badgeBg="rgba(255,75,75,0.08)" badgeColor="#FF4B4B"/>
                ))}
              </SectionCard>
            </div>
          </div>
        </div>
      </Chrome>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 4 — FILE VIEWER (from FileViewerV3.jsx + FileViewerV3.css)
// ══════════════════════════════════════════════════════════════════
const THUMBS = [
  {n:13,label:null},
  {n:14,label:"Circulatory Failure"},
  {n:15,label:"Cutis Marmorata"},
  {n:16,label:"CYANOSIS"},
  {n:17,label:"Pallor / Plethora",active:true},
  {n:18,label:"Jaundice"},
];

function SceneFileViewer({el}) {
  const bT  = eo(cl(el/500));
  const tpT = cl((el-2800)/2000);
  const typed = "explain".slice(0,Math.floor(tpT*7));
  const aT  = eo(cl((el-5200)/1100));
  const capT= eo(cl((el-7500)/900))*fOut(el,9800,700);

  return (
    <div style={{position:"absolute",inset:0,opacity:bT}}>
      <Chrome url="synapse-app.io/library/file/.../page/17">
        <div style={{display:"flex",height:"100%",background:T.void}}>
          <Sidebar active="library"/>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.base}}>

            {/* Toolbar — file-viewer-toolbar from CSS */}
            <div style={{
              height:44,flexShrink:0,
              background:T.surface,borderBottom:`1px solid ${T.border}`,
              display:"flex",alignItems:"center",padding:"0 16px",gap:12,
            }}>
              {/* Page nav group */}
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 4px",background:T.raised,border:`1px solid ${T.borderMid}`,borderRadius:8}}>
                <button style={{width:28,height:28,background:"transparent",border:"none",color:"rgba(245,245,247,0.5)",cursor:"pointer",borderRadius:5,fontSize:16,lineHeight:1}}>‹</button>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"rgba(245,245,247,0.5)",minWidth:48,textAlign:"center"}}>
                  <span style={{color:T.main,fontWeight:500}}>17</span> / 77
                </span>
                <button style={{width:28,height:28,background:"transparent",border:"none",color:"rgba(245,245,247,0.5)",cursor:"pointer",borderRadius:5,fontSize:16,lineHeight:1}}>›</button>
              </div>
              {/* Filename */}
              <span style={{fontSize:12,color:"rgba(245,245,247,0.5)",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                5 Newborn Physical Examination.pdf
              </span>
              {/* Mode tabs */}
              <div style={{display:"flex",gap:4}}>
                {["Lecture","Slide Note","Record"].map((t,i)=>(
                  <div key={i} style={{
                    padding:"4px 11px",borderRadius:6,fontSize:11.5,fontWeight:i===0?600:400,
                    background:i===0?T.teal:"transparent",color:i===0?"#000":"rgba(245,245,247,0.4)",
                    border:i!==0?`1px solid ${T.border}`:"none",
                  }}>{t}</div>
                ))}
              </div>
            </div>

            <div style={{flex:1,display:"flex",overflow:"hidden"}}>
              {/* Thumbnail strip — thumb-strip from CSS: width 176px */}
              <div style={{
                width:176,flexShrink:0,
                background:T.base,borderRight:`1px solid ${T.border}`,
                display:"flex",flexDirection:"column",overflow:"hidden",
              }}>
                {/* File header */}
                <div style={{padding:"10px 10px 8px",borderBottom:`1px solid ${T.border}`}}>
                  <p style={{fontSize:11,fontWeight:600,color:T.main,lineHeight:1.4}}>5 Newborn Physical Examination.pdf</p>
                  {/* Progress bar */}
                  <div style={{marginTop:7,height:2,background:T.border,borderRadius:1}}>
                    <div style={{width:"22%",height:"100%",background:T.teal,borderRadius:1}}/>
                  </div>
                </div>
                {/* Thumbs */}
                <div style={{flex:1,overflowY:"auto",padding:"8px 7px",display:"flex",flexDirection:"column",gap:6}}>
                  {THUMBS.map(t=>(
                    <div key={t.n} style={{
                      borderRadius:6,overflow:"hidden",flexShrink:0,
                      border:t.active?`2px solid ${T.teal}`:`1px solid ${T.border}`,
                    }}>
                      <div style={{
                        background:t.active?"rgba(0,200,180,0.05)":"#0d0f12",
                        padding:"4px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",
                      }}>
                        <span style={{fontSize:9.5,color:t.active?T.teal:"rgba(245,245,247,0.3)",fontFamily:"'JetBrains Mono',monospace"}}>{t.n}</span>
                        {t.active&&<div style={{width:5,height:5,borderRadius:"50%",background:T.teal}}/>}
                      </div>
                      <div style={{height:48,background:t.active?"rgba(0,200,180,0.03)":"rgba(255,255,255,0.02)",display:"flex",alignItems:"center",justifyContent:"center",padding:"3px 6px"}}>
                        <p style={{fontSize:8.5,color:t.active?T.teal:"rgba(245,245,247,0.15)",textAlign:"center",lineHeight:1.4}}>{t.label||""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide content area */}
              <div style={{flex:1,background:"#f5f3ee",overflowY:"auto",padding:"28px 32px",position:"relative"}}>
                <div style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:14.5,lineHeight:2,color:"#1a1a1a"}}>
                  <div style={{display:"flex",gap:18,marginBottom:18,flexWrap:"wrap"}}>
                    {/* Color tiles representing clinical images in slide */}
                    <div style={{width:74,height:74,position:"relative",flexShrink:0}}>
                      {[["#f59e0b",0,0],["#3b82f6",18,0],["#ec4899",0,18],["#1d4ed8",18,18]].map(([c,l,t],i)=>(
                        <div key={i} style={{position:"absolute",top:t,left:l,width:38,height:38,background:c}}/>
                      ))}
                    </div>
                    <div style={{width:120,height:74,background:"#e5e7eb",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <p style={{fontSize:9,color:"#9ca3af"}}>clinical image</p>
                    </div>
                  </div>
                  <p><strong style={{color:"#dc2626"}}>Pallor</strong> is seen if there is asphyxia, anemia, shock, edema.</p>
                  <p style={{marginTop:10}}>Circulatory failure, decreased perfusion, anoxia with bradycardia, shock, sepsis, vasoconstriction in severe respiratory distress.</p>
                  <div style={{display:"flex",gap:14,margin:"14px 0"}}>
                    {[0,1].map(i=><div key={i} style={{width:110,height:82,background:"#d1d5db",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <p style={{fontSize:9,color:"#9ca3af"}}>clinical image</p>
                    </div>)}
                  </div>
                  <p><strong style={{color:"#dc2626"}}>Plethora</strong> observed if the hematocrit is high (60–65%) = polycythemia</p>
                </div>
                {/* Status bar */}
                <div style={{marginTop:16,display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/>
                  <span style={{fontSize:11,color:"#6b7280"}}>Ready</span>
                </div>
              </div>

              {/* Right panel — rp-full from CSS, width 320px */}
              <div style={{
                width:310,flexShrink:0,
                background:T.base,borderLeft:`1px solid ${T.border}`,
                display:"flex",flexDirection:"column",
              }}>
                {/* Tabs — rp-tabs */}
                <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                  {["Chat","MCQ","Cards","Summary","Stats","Rec"].map((t,i)=>(
                    <div key={i} style={{
                      flex:1,textAlign:"center",padding:"10px 0",fontSize:12,
                      color:i===0?T.teal:"rgba(245,245,247,0.35)",fontWeight:i===0?600:400,
                      borderBottom:i===0?`2px solid ${T.teal}`:"2px solid transparent",
                    }}>{t}</div>
                  ))}
                </div>

                {/* Page context — rp-page-ctx */}
                <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:20,height:20,borderRadius:5,background:"rgba(0,200,180,0.10)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>Page</span>
                    <span style={{fontSize:12,color:T.teal,fontWeight:600}}>17 of 77</span>
                  </div>
                </div>

                {/* Chat messages */}
                <div style={{flex:1,padding:"12px 14px",overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
                  {tpT<0.05 && (
                    <div style={{padding:16,color:"rgba(245,245,247,0.4)",fontSize:12,fontStyle:"italic",textAlign:"center",lineHeight:1.65}}>
                      No messages yet. Ask a question about this page.
                    </div>
                  )}
                  {tpT>=0.05 && (
                    <>
                      {/* User message */}
                      <div>
                        <p style={{fontSize:10.5,color:T.dim,marginBottom:4,letterSpacing:"0.05em",fontFamily:"'JetBrains Mono',monospace"}}>You</p>
                        <div style={{
                          background:"rgba(0,200,180,0.09)",border:"1px solid rgba(0,200,180,0.18)",
                          borderRadius:"10px 10px 2px 10px",
                          padding:"8px 12px",fontSize:13,color:T.main,display:"inline-block",
                        }}>
                          {typed}
                          {tpT<1&&<span style={{display:"inline-block",width:1.5,height:13,background:T.teal,marginLeft:2,verticalAlign:"middle",animation:"blink 0.9s infinite"}}/>}
                        </div>
                      </div>
                      {/* Synapse response */}
                      {aT>0&&(
                        <div style={{opacity:aT}}>
                          <p style={{fontSize:10.5,color:T.teal,marginBottom:4,letterSpacing:"0.05em",fontWeight:500,fontFamily:"'JetBrains Mono',monospace"}}>Synapse</p>
                          <div style={{
                            background:"rgba(25,29,34,0.68)",border:`1px solid ${T.border}`,
                            borderRadius:"10px 10px 10px 2px",
                            padding:"10px 12px",fontSize:12.5,color:T.muted,lineHeight:1.75,
                          }}>
                            In the context of newborn examination, <strong style={{color:T.main}}>pallor</strong> indicates reduced perfusion — reflecting anemia, shock, or circulatory failure. <strong style={{color:T.main}}>Plethora</strong> (ruddy flush) suggests polycythemia with Hct ≥ 60%. Both are critical signs requiring prompt clinical evaluation.
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6}}>
                            <div style={{width:5,height:5,borderRadius:"50%",background:T.teal}}/>
                            <span style={{fontSize:9.5,color:T.dim}}>Powered by prompt enhancement agent</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Scope pills + input */}
                <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
                  <div style={{display:"flex",gap:6,marginBottom:7}}>
                    {["Page 17","Whole file"].map((s,i)=>(
                      <div key={i} style={{
                        padding:"3px 10px",borderRadius:20,fontSize:11,
                        background:i===0?"rgba(0,200,180,0.10)":"transparent",
                        border:`1px solid ${i===0?"rgba(0,200,180,0.25)":T.border}`,
                        color:i===0?T.teal:T.dim,cursor:"pointer",
                      }}>{s}</div>
                    ))}
                  </div>
                  <div style={{
                    background:T.raised,border:`1px solid ${T.border}`,
                    borderRadius:9,padding:"9px 12px",
                    display:"flex",alignItems:"center",gap:8,
                  }}>
                    <span style={{flex:1,fontSize:12,color:T.dim}}>Ask about this page...</span>
                    <div style={{width:26,height:26,borderRadius:7,background:T.teal,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#000"}}>→</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Chrome>
      <Caption line1="Astra sees your slide. " teal="Answers like it's sitting next to you." opacity={capT}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 5 — MCQ (from MCQDeckView.jsx — exact classes/styles)
// ══════════════════════════════════════════════════════════════════
function MCQOption({letter,text,state="neutral",selected,showExp,expText,expDelay,el}) {
  const isW=state==="wrong", isC=state==="correct";
  const isAnswered=selected||isW||isC;

  // Exact class logic from MCQDeckView: neonGreen / neonRed
  const borderColor = isW?"rgba(248,113,113,0.7)":isC?"rgba(0,245,204,0.7)":isAnswered?"rgba(0,245,204,0.4)":T.border;
  const bgColor     = isW?"rgba(239,68,68,0.08)":isC?"rgba(0,200,180,0.08)":isAnswered?"rgba(0,200,180,0.05)":"transparent";
  const shadowVal   = isW?"0 0 22px rgba(248,113,113,0.35)":isC?"0 0 22px rgba(0,245,204,0.35)":"none";
  const lc          = isW?"#f87171":isC?T.tealNeon:isAnswered?T.teal:T.dim;

  const eT = showExp?eo(cl((el-expDelay)/520)):0;
  const hasE = showExp&&eT>0.05;

  return (
    <div style={{marginBottom:12}}>
      {/* Option row — panel p-5 rounded-xl */}
      <div style={{
        padding:"16px 20px",borderRadius:hasE?"12px 12px 0 0":12,
        background:bgColor,
        border:`1px solid ${borderColor}`,
        borderBottom:hasE?`1px solid ${isW?"rgba(248,113,113,0.25)":"rgba(0,245,204,0.25)"}`:`1px solid ${borderColor}`,
        boxShadow:shadowVal,
        display:"flex",gap:16,alignItems:"flex-start",
      }}>
        {/* Letter badge — w-9 h-9 rounded-lg border */}
        <div style={{
          width:34,height:34,borderRadius:8,flexShrink:0,
          border:`1px solid ${isAnswered?lc:"rgba(255,255,255,0.15)"}`,
          background:isAnswered?(isW?"rgba(248,113,113,0.12)":"rgba(0,200,180,0.10)"):"transparent",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:13,fontWeight:600,color:isAnswered?lc:"rgba(245,245,247,0.6)",
        }}>{letter}</div>
        <div style={{flex:1,fontSize:15,color:T.main,lineHeight:1.55}}>{text}</div>
        {isC&&<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.tealNeon} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
        {isW&&<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
      </div>
      {/* Explanation — bg-teal/10 or bg-red-500/10 */}
      {hasE&&(
        <div style={{
          padding:"14px 20px",fontSize:13,lineHeight:1.8,
          color:"rgba(245,245,247,0.6)",
          background:isW?"rgba(239,68,68,0.06)":"rgba(0,200,180,0.06)",
          border:`1px solid ${isW?"rgba(248,113,113,0.25)":"rgba(0,245,204,0.25)"}`,
          borderTop:`1px solid ${isW?"rgba(248,113,113,0.12)":"rgba(0,245,204,0.12)"}`,
          borderRadius:"0 0 12px 12px",
          opacity:eT,
        }}>{expText}</div>
      )}
    </div>
  );
}

function SceneMCQ({el}) {
  const bT   = eo(cl(el/500));
  const selB = el>3500;
  const rev  = el>5200;
  const rT   = eo(cl((el-5200)/900));
  const capT = eo(cl((el-10000)/900))*fOut(el,12500,800);

  const Q2_OPTS = [
    {l:"A",t:"Transient neonatal pustular melanosis"},
    {l:"B",t:"Milia"},
    {l:"C",t:"Erythema toxicum"},
    {l:"D",t:"Capillary hemangioma"},
    {l:"E",t:"Miliaria"},
  ];
  const Q1_OPTS = [
    {l:"A",t:"Milia",                               state:"neutral"},
    {l:"B",t:"Transient neonatal pustular melanosis",state:"wrong",  exp:"Why this is wrong: TNPM presents as superficial vesicopustules that rupture easily to leave hyperpigmented macules — not a soft, creamy layer covering the skin."},
    {l:"C",t:"Vernix caseosa",                       state:"correct", exp:"Why this is correct: the soft, white, cheese-like layer covering a newborn's skin is vernix caseosa — composed of sebum and desquamated cells, serving as a protective barrier in utero."},
    {l:"D",t:"Erythema toxicum",                     state:"neutral"},
  ];

  const Panel = ({qLabel,total,progress,children})=>(
    <div style={{
      width:"100%",maxWidth:790,
      background:"rgba(15,17,21,0.95)",
      border:`1px solid rgba(255,255,255,0.08)`,
      borderRadius:18,padding:"28px 34px",
      boxShadow:"0 32px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.03)",
    }}>
      {/* Header */}
      <div style={{marginBottom:22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{fontSize:12.5,color:T.dim}}>{qLabel}</div>
          <button style={{
            display:"flex",alignItems:"center",gap:6,
            padding:"7px 15px",fontSize:13,color:T.teal,
            border:`1px solid ${T.tealBorder}`,borderRadius:8,
            background:T.tealDim,cursor:"pointer",
          }}>
            <span style={{fontSize:11}}>✦</span> Astra
          </button>
        </div>
        {/* Progress bar */}
        <div style={{height:3,background:"rgba(255,255,255,0.07)",borderRadius:2}}>
          <div style={{width:`${progress}%`,height:"100%",background:T.teal,borderRadius:2}}/>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{position:"absolute",inset:0,background:T.void,opacity:bT,display:"flex"}}>
      <Sidebar active="mcq"/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 32px",position:"relative",overflowY:"auto"}}>

        {/* Q2 — unanswered */}
        <div style={{
          position:"absolute",width:"calc(100% - 64px)",maxWidth:790,
          opacity:rev?1-rT:1,pointerEvents:rev?"none":"auto",
        }}>
          <Panel qLabel="Question 2 of 15" total={15} progress={13}>
            <p style={{fontSize:20,fontWeight:700,lineHeight:1.55,marginBottom:8,color:T.main}}>
              A term newborn presents with multiple yellow-white epidermal cysts on the nose. What is the most likely diagnosis?
            </p>
            <p style={{fontSize:13,color:T.dim,marginBottom:24}}>Select the single best answer.</p>
            {Q2_OPTS.map((o,i)=>(
              <MCQOption key={i} letter={o.l} text={o.t} selected={i===1&&selB} el={el}/>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
              {["Previous","Next"].map(b=>(
                <button key={b} style={{padding:"9px 20px",border:`1px solid ${T.border}`,borderRadius:9,background:"transparent",color:b==="Next"?T.main:T.dim,fontSize:13,cursor:"pointer"}}>{b}</button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Q1 — revealed/reviewed */}
        <div style={{
          position:"absolute",width:"calc(100% - 64px)",maxWidth:790,
          opacity:rT,pointerEvents:rev?"auto":"none",
        }}>
          <Panel qLabel="Question 1 of 15" total={15} progress={7}>
            <p style={{fontSize:20,fontWeight:700,lineHeight:1.55,marginBottom:8,color:T.main}}>
              A newborn is evaluated on the second day of life. The skin shows a soft, white, creamy layer covering it. What is the most likely explanation for this finding?
            </p>
            <p style={{fontSize:13,color:T.dim,marginBottom:24}}>Select the single best answer.</p>
            {Q1_OPTS.map((o,i)=>(
              <MCQOption key={i} letter={o.l} text={o.t} state={o.state}
                showExp={!!o.exp&&rT>0.5} expText={o.exp}
                expDelay={5200+i*260} el={el}/>
            ))}
            {/* Source attribution chip — SourceAttribution component */}
            <div style={{marginTop:14,opacity:eo(cl((el-7200)/700))}}>
              <div style={{
                display:"inline-flex",alignItems:"center",gap:7,
                padding:"5px 12px",
                background:T.tealDim,border:`1px solid ${T.tealBorder}`,
                borderRadius:8,fontSize:11.5,color:T.teal,
              }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                5 Newborn Physical Examination.pdf · Page 12
              </div>
            </div>
          </Panel>
        </div>
      </div>
      <Caption line1="High-yield explanations. " teal="For every answer. Right and wrong." opacity={capT}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 6 — LEARNING (from PerformancePage.jsx + STATE_CONFIG)
// ══════════════════════════════════════════════════════════════════
function SceneLearning({el}) {
  const bT   = eo(cl(el/500));
  const pulse= Math.sin(el/1000)*0.3+0.7;
  // Phases: 0=status, 1=reinforcement prep, 2=session
  // Hard-switch with no overlap — use display:none, not opacity
  const PHASE_R = 4500;
  const PHASE_S = 8500;
  const phase = el < PHASE_R ? 0 : el < PHASE_S ? 1 : 2;
  const rT   = eo(cl((el-PHASE_R)/600));
  const sT   = eo(cl((el-PHASE_S)/600));
  const selB = el > PHASE_S + 1400;
  const showE= el > PHASE_S + 2200;
  const eT   = eo(cl((el-PHASE_S-2200)/550));
  const capT = eo(cl((el-12500)/800))*fOut(el,15000,700);

  // STATE_CONFIG.STABLE exact values from PerformancePage
  const STABLE_COLOR="#C4A84F";
  const STABLE_BG="rgba(196,168,79,0.08)";
  const STABLE_BORDER="rgba(196,168,79,0.25)";

  return (
    <div style={{position:"absolute",inset:0,background:T.void,opacity:bT}}>
      <Chrome url="synapse-app.io/learning">
        <div style={{display:"flex",height:"100%"}}>
          <Sidebar active="learning"/>
          <div style={{flex:1,overflowY:"auto",padding:"22px 28px",position:"relative",background:T.void}}>

            {/* STATUS VIEW — phase 0 only */}
            <div style={{display: phase===0 ? "block" : "none"}}>
              {/* Top meta bar — exact from PerformancePage */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <p style={{fontSize:10.5,color:T.dim,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.06em"}}>
                  LEARNING STATUS · Last computed: just now · b3113dfc
                </p>
                <div style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"4px 10px",borderRadius:5,fontSize:11,color:T.dim,
                  border:`1px solid ${T.border}`,
                }}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:T.teal,display:"inline-block"}}/>
                  WATCH
                </div>
              </div>

              {/* Specialty pill */}
              <div style={{display:"inline-flex",padding:"4px 13px",border:`1px solid rgba(0,200,180,0.28)`,borderRadius:20,fontSize:12.5,color:T.teal,marginBottom:16}}>
                Pediatrics · Pediatrics
              </div>

              {/* STABLE status card — matches STATE_CONFIG */}
              <div style={{
                background:"rgba(13,15,18,0.60)",border:`1px solid ${STABLE_BORDER}`,
                borderRadius:12,padding:"18px 22px",marginBottom:12,
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    {/* STABLE headline */}
                    <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:8}}>
                      <span style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:900,color:STABLE_COLOR}}>STABLE</span>
                      <span style={{fontSize:15,color:"#f97316",fontWeight:600}}>−26.3%</span>
                    </div>
                    {/* copy from getMicrocopy(STABLE, momentum≤2) */}
                    <p style={{fontSize:14,color:T.muted,lineHeight:1.65,marginBottom:4}}>
                      <span style={{color:T.main,fontWeight:500}}>Stable, but not improving.</span>{" "}
                      0 days without meaningful gain. Volume is there. Depth is not.
                    </p>
                    <p style={{fontSize:13,color:T.dim}}>Your performance is stable. Controlled progression is appropriate.</p>
                  </div>
                  {/* Sparkline */}
                  <div style={{width:110,height:48,flexShrink:0,marginLeft:18,opacity:0.75}}>
                    <svg viewBox="0 0 110 48" fill="none" style={{width:"100%",height:"100%"}}>
                      <polyline points="0,42 18,36 36,30 54,38 72,26 90,32 110,28"
                        stroke={STABLE_COLOR} strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                      <circle cx="110" cy="28" r="2.5" fill={STABLE_COLOR}/>
                      <text x="74" y="14" fill={T.dim} fontSize="9" fontFamily="monospace">DAY 0</text>
                    </svg>
                  </div>
                </div>
                {/* Transition dots */}
                <div style={{display:"flex",gap:5,marginTop:14,flexWrap:"wrap"}}>
                  {Array.from({length:22}).map((_,i)=>(
                    <div key={i} style={{width:8,height:8,borderRadius:"50%",border:`1.5px solid rgba(196,168,79,0.45)`,background:"rgba(196,168,79,0.10)"}}/>
                  ))}
                </div>
              </div>

              {/* Primary Risk — LEFT BORDER ACCENT */}
              <div style={{
                background:"rgba(13,15,18,0.60)",
                border:`1px solid ${T.border}`,borderLeft:`3px solid #E55A4E`,
                borderRadius:10,padding:"16px 20px",marginBottom:12,
              }}>
                <p style={{fontSize:10,color:T.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.13em",marginBottom:9}}>PRIMARY RISK</p>
                <p style={{fontSize:20,fontWeight:700,color:"#E55A4E",marginBottom:4,textShadow:`0 0 24px rgba(229,90,78,${pulse*0.4})`}}>
                  Congenital Glaucoma
                </p>
                <p style={{fontSize:13,color:"rgba(229,90,78,0.7)",marginBottom:4}}>This concept is actively limiting your performance.</p>
                <p style={{fontSize:12,color:T.dim,marginBottom:8}}>0% accuracy (3 attempts)</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",border:`1px solid ${T.border}`,borderRadius:5,fontSize:11,color:T.dim}}>
                  Low accuracy trend
                </div>
              </div>

              {/* Intervention Plan */}
              <div style={{background:"rgba(13,15,18,0.60)",border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <p style={{fontSize:10,color:T.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.13em"}}>INTERVENTION PLAN</p>
                  <span style={{fontSize:12,color:T.dim}}>20 minutes</span>
                </div>
                <p style={{fontSize:15,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginBottom:5,color:T.main}}>MEMORY_REINFORCEMENT</p>
                <p style={{fontSize:13,color:T.teal,marginBottom:4}}>→ Focus concept: Congenital Glaucoma</p>
                <p style={{fontSize:12.5,color:T.dim,marginBottom:14}}>Targeting this instability should improve your overall trajectory.</p>
                <div style={{
                  padding:"10px 18px",border:`1px solid rgba(0,200,180,0.25)`,
                  borderRadius:9,fontSize:13,color:T.teal,textAlign:"center",
                  fontFamily:"'JetBrains Mono',monospace",background:"rgba(0,200,180,0.05)",cursor:"pointer",
                }}>Start 20-Minute Focus Session</div>
              </div>
            </div>

            {/* REINFORCEMENT PREP — phase 1 only */}
            {phase===1&&(
              <div style={{opacity:rT,overflowY:"auto"}}>
                <p style={{fontSize:13,color:T.dim,marginBottom:16,cursor:"pointer"}}>← Back to Learning Status</p>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,marginBottom:10}}>Congenital Glaucoma</h2>
                <div style={{display:"flex",gap:8,marginBottom:18}}>
                  <span style={{padding:"4px 11px",border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,color:T.dim}}>Level 0 · Foundational</span>
                  <span style={{padding:"4px 11px",background:"rgba(229,90,78,0.10)",border:"1px solid rgba(229,90,78,0.28)",borderRadius:6,fontSize:12,color:"#E55A4E",fontWeight:600}}>High Risk</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:18}}>
                  {[["ROLLING ACCURACY","0%"],["EXPOSURE COUNT","3"],["SESSION DURATION","20 min"]].map(([l,v])=>(
                    <div key={l}>
                      <p style={{fontSize:10,color:T.dim,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.1em",marginBottom:5}}>{l}</p>
                      <p style={{fontSize:26,fontWeight:700,color:T.main}}>{v}</p>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:13.5,color:T.muted,lineHeight:1.7,marginBottom:18}}>
                  You struggled with this concept recently. A short focused session will reinforce memory traces and help stabilize performance in this area.
                </p>
                {/* Evidence trail */}
                <div style={{background:"#0c0e11",border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px",marginBottom:18}}>
                  <p style={{fontSize:10,color:T.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.12em",marginBottom:9}}>EVIDENCE TRAIL</p>
                  <p style={{fontSize:16,fontWeight:600,marginBottom:4}}>Why You're Struggling With <span style={{color:T.teal}}>Congenital Glaucoma</span></p>
                  <p style={{fontSize:12.5,color:T.dim,marginBottom:12}}>2 incorrect attempts traced to source material</p>
                  <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 16px"}}>
                    <p style={{fontSize:13,fontWeight:600,marginBottom:7,color:T.main}}>5 Newborn Physical Examination.pdf</p>
                    <p style={{fontSize:11.5,color:T.teal,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>p. 23 · p. 66 · p. 68</p>
                    <p style={{fontSize:11.5,color:T.dim,fontStyle:"italic",marginBottom:9}}>"Which of the following findings in a newborn's eyes suggests the need for urgent ophthalmologic evaluation?"</p>
                    <p style={{fontSize:11.5,color:T.teal,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>p. 2 · p. 13 · p. 68</p>
                    <p style={{fontSize:11.5,color:T.dim,fontStyle:"italic"}}>"Which eye finding in a newborn requires urgent treatment due to risk of vision loss?"</p>
                  </div>
                </div>
                <div style={{padding:"14px",background:T.teal,borderRadius:9,textAlign:"center",fontSize:14,fontWeight:700,color:"#000",cursor:"pointer"}}>
                  Start 20 Minute Session
                </div>
              </div>
            )}

            {/* SESSION VIEW — phase 2 only */}
            {phase===2&&(
              <div style={{opacity:sT}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                  <span style={{fontSize:14,fontWeight:600,color:T.main}}>Reinforcement Session</span>
                  <div style={{padding:"4px 13px",background:"rgba(0,200,180,0.08)",border:`1px solid rgba(0,200,180,0.25)`,borderRadius:20,fontSize:12,color:T.teal}}>Congenital Glaucoma</div>
                  <span style={{fontSize:13,color:T.dim}}>1 / 5</span>
                  <span style={{fontSize:14,fontFamily:"'JetBrains Mono',monospace",color:T.teal}}>14:56</span>
                </div>
                <div style={{background:"rgba(13,15,18,0.68)",border:`1px solid ${T.border}`,borderRadius:14,padding:"26px 28px"}}>
                  <p style={{fontSize:10,color:T.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.12em",marginBottom:13}}>QUESTION 1</p>
                  <p style={{fontSize:18,fontWeight:600,lineHeight:1.6,marginBottom:22,color:T.main}}>
                    Which anatomical abnormality is primarily responsible for congenital glaucoma?
                  </p>
                  {[
                    "A. Malformation of the optic nerve",
                    "B. Abnormal development of the trabecular meshwork",
                    "C. Defect in the lens capsule",
                    "D. Retinal vascular malformation",
                    "E. Corneal endothelial dysfunction",
                  ].map((opt,i)=>(
                    <div key={i} style={{
                      padding:"14px 18px",marginBottom:9,borderRadius:10,
                      border:`1px solid ${i===1&&selB?"rgba(0,245,204,0.55)":T.border}`,
                      background:i===1&&selB?"rgba(0,200,180,0.07)":"transparent",
                      fontSize:14,color:i===1&&selB?T.main:T.muted,
                      transition:"all 0.4s",
                    }}>{opt}</div>
                  ))}
                  {showE&&(
                    <div style={{
                      marginTop:14,padding:"14px 18px",
                      background:"rgba(0,200,180,0.06)",border:`1px solid rgba(0,245,204,0.25)`,
                      borderRadius:10,opacity:eT,
                    }}>
                      <p style={{fontSize:10,color:T.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.12em",marginBottom:7}}>EXPLANATION</p>
                      <p style={{fontSize:13,color:T.muted,lineHeight:1.72}}>
                        Congenital glaucoma results from abnormal development of the trabecular meshwork, impairing aqueous drainage and elevating intraocular pressure — an emergency requiring prompt treatment to prevent permanent vision loss.
                      </p>
                    </div>
                  )}
                  {showE&&(
                    <div style={{marginTop:14,padding:"13px",background:T.teal,borderRadius:9,textAlign:"center",fontSize:14,fontWeight:700,color:"#000",opacity:eT,cursor:"pointer"}}>Next</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Chrome>
      <Caption line1="Synapse knows what you're " teal="forgetting. Before your exam does." opacity={capT}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 7 — PLANNER (from PlannerPage.jsx)
// ══════════════════════════════════════════════════════════════════
function ScenePlanner({el}) {
  const bT = eo(cl(el/500));
  const cT = eo(cl((el-2000)/800))*fOut(el,5000,700);
  const days = Array.from({length:31},(_,i)=>i+1);

  return (
    <div style={{position:"absolute",inset:0,opacity:bT}}>
      <Chrome url="synapse-app.io/planner">
        <div style={{display:"flex",height:"100%",background:T.void}}>
          <Sidebar active="planner"/>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.void}}>

            {/* Header row */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 32px 0"}}>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:700,color:T.main}}>Planner</h1>
              <button style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"9px 20px",background:T.teal,borderRadius:10,
                fontSize:13,fontWeight:700,color:"#000",border:"none",cursor:"pointer",
              }}>+ New Event</button>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:28,borderBottom:`1px solid ${T.border}`,padding:"0 32px",marginTop:16}}>
              {["Calendar","Periods","Upcoming"].map((t,i)=>(
                <div key={i} style={{
                  fontSize:14,color:i===0?T.main:"rgba(245,245,247,0.4)",
                  paddingBottom:12,
                  borderBottom:i===0?`2px solid ${T.teal}`:"2px solid transparent",
                  cursor:"pointer",
                }}>{t}</div>
              ))}
            </div>

            {/* Full-bleed calendar — matches real app exactly */}
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",margin:"16px 32px 16px"}}>
              {/* Month nav */}
              <div style={{
                display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px 16px",
                background:"rgba(255,255,255,0.02)",
                border:`1px solid ${T.border}`,
                borderBottom:"none",
                borderRadius:"10px 10px 0 0",
              }}>
                <span style={{fontSize:15,fontWeight:600,color:T.main,fontFamily:"'Syne',sans-serif"}}>March 2026</span>
                <div style={{display:"flex",gap:6}}>
                  {["‹","›"].map(a=>(
                    <div key={a} style={{
                      width:28,height:28,borderRadius:7,
                      border:`1px solid ${T.border}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:16,color:T.dim,cursor:"pointer",
                    }}>{a}</div>
                  ))}
                </div>
              </div>

              {/* Day labels */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",border:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                  <div key={d} style={{
                    padding:"10px 0",textAlign:"center",
                    fontSize:12,color:"rgba(245,245,247,0.35)",
                    borderRight:`1px solid ${T.border}`,
                  }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid — fills remaining height */}
              <div style={{
                flex:1,display:"grid",
                gridTemplateColumns:"repeat(7,1fr)",
                gridTemplateRows:"repeat(5,1fr)",
                border:`1px solid ${T.border}`,
                borderTop:"none",
                borderRadius:"0 0 10px 10px",
                overflow:"hidden",
              }}>
                {days.map(d=>{
                  const col=(d-1)%7; // March 2026 starts Sunday
                  const isWE=col===0||col===6;
                  const isToday=d===3;
                  const hasEv=d===24;
                  return (
                    <div key={d} style={{
                      padding:"8px 10px",
                      background:isWE?"rgba(99,102,241,0.06)":"transparent",
                      borderRight:`1px solid ${T.border}`,
                      borderBottom:`1px solid ${T.border}`,
                      minHeight:0,
                    }}>
                      <span style={{
                        fontSize:13,fontWeight:isToday?700:400,
                        display:"inline-flex",alignItems:"center",justifyContent:"center",
                        width:isToday?24:20,height:isToday?24:20,
                        borderRadius:isToday?"50%":4,
                        background:isToday?T.teal:"transparent",
                        color:isToday?"#000":isWE?"rgba(245,245,247,0.5)":"rgba(245,245,247,0.6)",
                      }}>{d}</span>
                      {hasEv&&(
                        <div style={{marginTop:4,display:"flex",flexDirection:"column",gap:3}}>
                          {[0,1].map(i=>(
                            <div key={i} style={{
                              display:"flex",alignItems:"center",gap:4,
                              background:"rgba(239,68,68,0.18)",
                              border:"1px solid rgba(239,68,68,0.4)",
                              borderLeft:"3px solid #EF4444",
                              borderRadius:4,padding:"2px 7px",
                              fontSize:10.5,color:"#fca5a5",fontWeight:500,
                            }}>Oral</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Chrome>
      <Caption line1="Your exam is in the calendar. " teal="Synapse studies backward from it." opacity={cT}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 8 — TRACTION
// ══════════════════════════════════════════════════════════════════
function SceneTraction({el}) {
  const bT=eo(cl(el/500));
  // Count-up: use Math.floor on eased progress * target
  const cu=(target,start,dur)=>Math.floor(eo(cl((el-start)/dur))*target);
  const tagT=eo(cl((el-7000)/1000));

  const mcqs  = cu(3348, 600, 5000);
  const decks = cu(164,  900, 4500);
  const users = cu(17,  1200, 4000);

  const stats=[
    { v: mcqs.toLocaleString(),  l:"MCQs Generated",     c:T.teal, minW:220 },
    { v: decks.toLocaleString(), l:"Study Decks Created", c:T.main, minW:160 },
    { v: users.toString(),       l:"Beta Users",          c:T.main, minW:100 },
    { v:"YC S25",                l:"Application",         c:T.teal, minW:160, static:true },
  ];

  return (
    <div style={{position:"absolute",inset:0,background:T.void,opacity:bT,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <Grid/>
      <div style={{position:"absolute",width:700,height:380,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(0,200,180,0.05) 0%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",filter:"blur(10px)"}}/>
      <div style={{position:"relative",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"44px 100px",maxWidth:720,width:"100%",padding:"0 40px"}}>
        {stats.map((s,i)=>{
          const aT=eo(cl((el-i*450)/700));
          return (
            <div key={i} style={{
              textAlign:"center",
              opacity:aT,
              transform:`translateY(${lerp(14,0,aT)}px)`,
            }}>
              {/* Fixed-width number container stops shaking */}
              <div style={{
                display:"flex",alignItems:"baseline",justifyContent:"center",
                minWidth:s.minW,height:88,
              }}>
                <p style={{
                  fontFamily:"'Syne',sans-serif",
                  fontSize:"clamp(52px,7vw,80px)",
                  fontWeight:900,lineHeight:1,color:s.c,
                  // tabular-nums prevents character-width shifts
                  fontVariantNumeric:"tabular-nums",
                  textShadow:s.c===T.teal?`0 0 60px rgba(0,200,180,0.25)`:"none",
                  whiteSpace:"nowrap",
                }}>{s.v}</p>
              </div>
              <p style={{fontSize:15,color:T.muted,marginTop:4,fontFamily:"'Inter',sans-serif",fontWeight:400}}>{s.l}</p>
            </div>
          );
        })}
      </div>
      <p style={{
        position:"relative",marginTop:52,fontSize:17,color:"rgba(245,245,247,0.35)",
        fontStyle:"italic",textAlign:"center",opacity:tagT,fontFamily:"'Inter',sans-serif",
        letterSpacing:"0.02em",
      }}>
        Pre-revenue. Pre-launch. Already irreplaceable to its users.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE 9 — CTA
// ══════════════════════════════════════════════════════════════════
function SceneCTA({el}) {
  const bT =eo(cl(el/700));
  const glow=Math.sin(el/1600)*0.10+0.16;
  const fO =fOut(el,18000,2500);
  const lT =eo(cl(el/1000));
  const nT =eo(cl((el-900)/900));
  const uT =eo(cl((el-1700)/800));
  const tT =eo(cl((el-2300)/800));
  return (
    <div style={{position:"absolute",inset:0,background:T.void,display:"flex",alignItems:"center",justifyContent:"center",opacity:bT*fO}}>
      <Grid/>
      <div style={{
        position:"absolute",width:700,height:700,borderRadius:"50%",
        background:`radial-gradient(circle,rgba(0,200,180,${glow}) 0%,transparent 65%)`,
        top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",filter:"blur(8px)",
      }}/>
      <div style={{position:"relative",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{opacity:lT,transform:`scale(${lerp(0.6,1,lT)})`,marginBottom:24}}><Logo size={110}/></div>
        <p style={{
          fontFamily:"'Syne',sans-serif",fontSize:70,fontWeight:900,
          letterSpacing:"0.26em",color:T.main,
          opacity:nT,transform:`translateY(${lerp(12,0,nT)}px)`,
        }}>SYNAPSE</p>
        <p style={{
          fontSize:22,color:T.teal,marginTop:10,
          fontFamily:"'JetBrains Mono',monospace",
          opacity:uT,letterSpacing:"0.04em",
        }}>synapse-app.io</p>
        <p style={{fontSize:16,color:T.dim,marginTop:8,fontStyle:"italic",opacity:tT,fontFamily:"'Inter',sans-serif"}}>
          The study platform that thinks like a clinician.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENE TABLE
// ══════════════════════════════════════════════════════════════════
const SCENES=[
  {id:"hook",     start:0,    end:9000,  label:"Hook",      C:SceneHook},
  {id:"intro",    start:9000, end:17000, label:"Intro",     C:SceneIntro},
  {id:"dash",     start:17000,end:28000, label:"Dashboard", C:SceneDashboard},
  {id:"viewer",   start:28000,end:41000, label:"Viewer",    C:SceneFileViewer},
  {id:"mcq",      start:41000,end:56000, label:"MCQ",       C:SceneMCQ},
  {id:"learning", start:56000,end:73000, label:"Learning",  C:SceneLearning},
  {id:"planner",  start:73000,end:81000, label:"Planner",   C:ScenePlanner},
  {id:"traction", start:81000,end:88500, label:"Traction",  C:SceneTraction},
  {id:"cta",      start:88500,end:90000, label:"CTA",       C:SceneCTA},
];

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
export default function SynapseDemo() {
  const [elapsed, setElapsed]=useState(0);
  const [playing, setPlaying]=useState(true);
  const [sceneIdx,setSceneIdx]=useState(0);
  const rafRef=useRef(null);
  const lastRef=useRef(null);

  useEffect(()=>{
    if(playing){
      const tick=ts=>{
        if(lastRef.current!==null){
          const delta=(ts-lastRef.current)*SPEED;
          setElapsed(p=>{const n=p+delta;return n>=TOTAL_MS?0:n;});
        }
        lastRef.current=ts;
        rafRef.current=requestAnimationFrame(tick);
      };
      rafRef.current=requestAnimationFrame(tick);
    }else{
      cancelAnimationFrame(rafRef.current);
      lastRef.current=null;
    }
    return()=>cancelAnimationFrame(rafRef.current);
  },[playing]);

  useEffect(()=>{
    const i=SCENES.findIndex(s=>elapsed>=s.start&&elapsed<s.end);
    if(i!==-1)setSceneIdx(i);
  },[elapsed]);

  const tOp=s=>{
    const D=500,se=elapsed-s.start,te=s.end-elapsed;
    if(se<D)return se/D;
    if(te<D)return te/D;
    return 1;
  };

  return (
    <div style={{
      width:"100%",height:"100vh",
      background:T.void,
      display:"flex",flexDirection:"column",
      fontFamily:"'Inter',sans-serif",
      color:T.main,overflow:"hidden",
    }}>
      <style>{`
        ${FONTS}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px}
      `}</style>

      {/* Stage */}
      <div style={{flex:1,position:"relative",padding:16}}>
        {SCENES.map(scene=>{
          const active=elapsed>=scene.start&&elapsed<scene.end;
          if(!active)return null;
          const Comp=scene.C;
          return(
            <div key={scene.id} style={{position:"absolute",inset:16,opacity:tOp(scene)}}>
              <Comp el={elapsed-scene.start}/>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{
        height:50,background:"#06080a",
        borderTop:`1px solid ${T.border}`,
        display:"flex",alignItems:"center",
        padding:"0 16px",gap:14,flexShrink:0,
      }}>
        <button
          onClick={()=>setPlaying(p=>!p)}
          style={{
            width:30,height:30,borderRadius:"50%",border:"none",
            background:T.teal,color:"#000",fontSize:12,
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",flexShrink:0,
          }}
        >{playing?"⏸":"▶"}</button>

        {/* Scrubber */}
        <div
          style={{flex:1,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,cursor:"pointer",position:"relative"}}
          onClick={e=>{
            const r=e.currentTarget.getBoundingClientRect();
            setElapsed(Math.floor(((e.clientX-r.left)/r.width)*TOTAL_MS));
          }}
        >
          <div style={{width:`${(elapsed/TOTAL_MS)*100}%`,height:"100%",background:T.teal,borderRadius:2,transition:"none"}}/>
          {SCENES.map(s=>(
            <div key={s.id} style={{
              position:"absolute",top:-3,width:1,height:9,
              background:"rgba(255,255,255,0.14)",
              left:`${(s.start/TOTAL_MS)*100}%`,
            }}/>
          ))}
        </div>

        <span style={{fontSize:11,color:T.dim,fontFamily:"'JetBrains Mono',monospace",minWidth:60,textAlign:"right"}}>
          {Math.floor(elapsed/1000)}s / 90s
        </span>

        {/* Scene pills */}
        <div style={{display:"flex",gap:4}}>
          {SCENES.map((s,i)=>(
            <div key={s.id}
              onClick={()=>setElapsed(s.start+100)}
              style={{
                padding:"3px 9px",borderRadius:5,fontSize:10.5,
                cursor:"pointer",whiteSpace:"nowrap",
                background:i===sceneIdx?"rgba(0,200,180,0.10)":"transparent",
                border:`1px solid ${i===sceneIdx?"rgba(0,200,180,0.28)":T.border}`,
                color:i===sceneIdx?T.teal:T.dim,
              }}
            >{s.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
