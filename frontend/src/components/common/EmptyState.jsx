/**
 * EmptyState — illustrated empty state component.
 * Usage: <EmptyState type="conflicts" message="No conflicts found." />
 * Types: conflicts | notifications | rehearsals | productions | roles | attendance | reports | members | default
 */

const W = 180, H = 140;
const svgProps = { viewBox: `0 0 ${W} ${H}`, width: W, height: H, xmlns: 'http://www.w3.org/2000/svg' };

const illustrations = {

  // ── Magnifying glass detective ─────────────────────────────────
  conflicts: (
    <svg {...svgProps}>
      <ellipse cx="62" cy="100" rx="32" ry="36" fill="#f97316"/>
      <circle  cx="62" cy="52"  r="30"           fill="#f97316"/>
      <ellipse cx="51" cy="48" rx="7" ry="8"     fill="white"/>
      <ellipse cx="73" cy="48" rx="7" ry="8"     fill="white"/>
      <circle  cx="53" cy="49" r="4"             fill="#1e293b"/>
      <circle  cx="75" cy="49" r="4"             fill="#1e293b"/>
      <circle  cx="54" cy="47" r="1.5"           fill="white"/>
      <circle  cx="76" cy="47" r="1.5"           fill="white"/>
      <path d="M45 39 Q51 35 57 39" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M67 39 Q73 35 79 39" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M53 64 Q62 68 71 64" stroke="#c2410c" strokeWidth="2"   fill="none" strokeLinecap="round"/>
      <path d="M85 80 Q110 55 118 62" stroke="#f97316" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <circle  cx="132" cy="58" r="24" stroke="#1e293b" strokeWidth="6" fill="white" fillOpacity="0.6"/>
      <circle  cx="132" cy="58" r="17" fill="#e0f2fe" opacity="0.7"/>
      <path d="M123 47 Q128 43 134 46" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="150" y1="76" x2="165" y2="95" stroke="#1e293b" strokeWidth="7" strokeLinecap="round"/>
      <ellipse cx="62" cy="138" rx="30" ry="5" fill="#1e293b" opacity="0.1"/>
    </svg>
  ),

  // ── Sleeping bell ──────────────────────────────────────────────
  notifications: (
    <svg {...svgProps}>
      <path d="M50 100 Q46 62 90 52 Q134 42 130 100 Z" fill="#f97316"/>
      <circle cx="90" cy="52" r="10"            fill="#c2410c"/>
      <rect   x="85" y="38" width="10" height="14" rx="5" fill="#c2410c"/>
      <ellipse cx="90" cy="100" rx="42" ry="8"  fill="#ea580c"/>
      <circle cx="90" cy="115" r="9"            fill="#c2410c"/>
      <path d="M72 76 Q76 72 80 76" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M100 76 Q104 72 108 76" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M80 88 Q90 95 100 88" stroke="#7c2d12" strokeWidth="2"   fill="none" strokeLinecap="round"/>
      <text x="128" y="55" fontSize="13" fontWeight="800" fill="#94a3b8" fontFamily="system-ui">z</text>
      <text x="140" y="42" fontSize="17" fontWeight="800" fill="#94a3b8" fontFamily="system-ui">z</text>
      <text x="155" y="28" fontSize="21" fontWeight="800" fill="#cbd5e1" fontFamily="system-ui">z</text>
      <ellipse cx="90" cy="136" rx="38" ry="5"  fill="#1e293b" opacity="0.1"/>
    </svg>
  ),

  // ── Character sitting on empty calendar ───────────────────────
  rehearsals: (
    <svg {...svgProps}>
      <rect x="28" y="42" width="124" height="90" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="3"/>
      <rect x="28" y="42" width="124" height="30" rx="10" fill="#f97316"/>
      <rect x="28" y="58" width="124" height="14" fill="#f97316"/>
      <rect x="60" y="35" width="8" height="18" rx="4" fill="#64748b"/>
      <rect x="112" y="35" width="8" height="18" rx="4" fill="#64748b"/>
      {[0,1,2,3,4,5,6].map(i => <circle key={i}     cx={50 + i*13} cy="92"  r="4" fill="#f1f5f9"/>)}
      {[0,1,2,3,4,5].map(i   => <circle key={`b${i}`} cx={50 + i*13} cy="108" r="4" fill="#f1f5f9"/>)}
      <circle  cx="90" cy="30" r="16"          fill="#f97316"/>
      <ellipse cx="90" cy="50" rx="14" ry="10" fill="#f97316"/>
      <path d="M83 27 Q86 24 89 27" stroke="#7c2d12" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M91 27 Q94 24 97 27" stroke="#7c2d12" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M84 34 Q90 39 96 34" stroke="#7c2d12" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="82" y1="58" x2="76" y2="72" stroke="#f97316" strokeWidth="6" strokeLinecap="round"/>
      <line x1="98" y1="58" x2="104" y2="72" stroke="#f97316" strokeWidth="6" strokeLinecap="round"/>
      <ellipse cx="90" cy="136" rx="36" ry="5" fill="#1e293b" opacity="0.08"/>
    </svg>
  ),

  // ── Character holding clapperboard ────────────────────────────
  productions: (
    <svg {...svgProps}>
      <ellipse cx="66" cy="102" rx="30" ry="34" fill="#f97316"/>
      <circle  cx="66" cy="56"  r="28"          fill="#f97316"/>
      <ellipse cx="56" cy="52" rx="6" ry="7"    fill="white"/>
      <ellipse cx="76" cy="52" rx="6" ry="7"    fill="white"/>
      <circle  cx="57" cy="53" r="3.5"          fill="#1e293b"/>
      <circle  cx="77" cy="53" r="3.5"          fill="#1e293b"/>
      <circle  cx="58" cy="51" r="1.3"          fill="white"/>
      <circle  cx="78" cy="51" r="1.3"          fill="white"/>
      <path d="M56 66 Q66 74 76 66" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M85 85 Q108 72 112 75" stroke="#f97316" strokeWidth="9" fill="none" strokeLinecap="round"/>
      <rect x="104" y="68" width="58" height="48" rx="5" fill="white" stroke="#1e293b" strokeWidth="3"/>
      <rect x="104" y="58" width="58" height="14" rx="4" fill="#1e293b"/>
      <line x1="115" y1="58" x2="111" y2="72" stroke="white" strokeWidth="4"/>
      <line x1="126" y1="58" x2="122" y2="72" stroke="white" strokeWidth="4"/>
      <line x1="137" y1="58" x2="133" y2="72" stroke="white" strokeWidth="4"/>
      <line x1="148" y1="58" x2="144" y2="72" stroke="white" strokeWidth="4"/>
      <line x1="114" y1="86" x2="152" y2="86" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="114" y1="97" x2="144" y2="97" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="85" cy="138" rx="38" ry="5"  fill="#1e293b" opacity="0.09"/>
    </svg>
  ),

  // ── Character with empty clipboard ────────────────────────────
  roles: (
    <svg {...svgProps}>
      <rect x="90" y="40" width="68" height="88" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="3"/>
      <rect x="106" y="33" width="36" height="16" rx="8" fill="#64748b"/>
      <rect x="112" y="33" width="24" height="16" rx="8" fill="#94a3b8"/>
      <line x1="102" y1="68"  x2="148" y2="68"  stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round"/>
      <line x1="102" y1="80"  x2="140" y2="80"  stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round"/>
      <line x1="102" y1="92"  x2="144" y2="92"  stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round"/>
      <line x1="102" y1="104" x2="130" y2="104" stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="62" cy="102" rx="30" ry="34" fill="#f97316"/>
      <circle  cx="62" cy="55"  r="27"          fill="#f97316"/>
      <ellipse cx="52" cy="51" rx="6" ry="6.5"  fill="white"/>
      <ellipse cx="72" cy="51" rx="6" ry="6.5"  fill="white"/>
      <circle  cx="53" cy="52" r="3.5"          fill="#1e293b"/>
      <circle  cx="73" cy="52" r="3.5"          fill="#1e293b"/>
      <circle  cx="54" cy="50" r="1.3"          fill="white"/>
      <circle  cx="74" cy="50" r="1.3"          fill="white"/>
      <path d="M47 43 Q52 46 57 43" stroke="#c2410c" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M67 43 Q72 46 77 43" stroke="#c2410c" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M54 65 Q62 70 70 65" stroke="#c2410c" strokeWidth="2"   fill="none" strokeLinecap="round"/>
      <path d="M82 85 Q92 76 96 80" stroke="#f97316" strokeWidth="9"   fill="none" strokeLinecap="round"/>
      <ellipse cx="90" cy="138" rx="40" ry="5"  fill="#1e293b" opacity="0.09"/>
    </svg>
  ),

  // ── Character with empty checklist ────────────────────────────
  attendance: (
    <svg {...svgProps}>
      <circle cx="130" cy="75" r="45" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="3"/>
      <path d="M110 75 L125 90 L152 60" stroke="#e2e8f0" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="55" cy="102" rx="30" ry="34" fill="#f97316"/>
      <circle  cx="55" cy="54"  r="27"           fill="#f97316"/>
      <ellipse cx="45" cy="50" rx="6" ry="6.5"   fill="white"/>
      <ellipse cx="65" cy="50" rx="6" ry="6.5"   fill="white"/>
      <circle  cx="46" cy="52" r="3.5"           fill="#1e293b"/>
      <circle  cx="66" cy="52" r="3.5"           fill="#1e293b"/>
      <circle  cx="47" cy="50" r="1.3"           fill="white"/>
      <circle  cx="67" cy="50" r="1.3"           fill="white"/>
      <path d="M40 42 Q45 45 50 42" stroke="#c2410c" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M60 42 Q65 45 70 42" stroke="#c2410c" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M45 64 Q55 60 65 64" stroke="#c2410c" strokeWidth="2"   fill="none" strokeLinecap="round"/>
      <ellipse cx="90" cy="138" rx="40" ry="5"   fill="#1e293b" opacity="0.09"/>
    </svg>
  ),

  // ── Character looking at empty chart ──────────────────────────
  reports: (
    <svg {...svgProps}>
      <line x1="90" y1="30"  x2="90"  y2="115" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round"/>
      <line x1="90" y1="115" x2="168" y2="115" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round"/>
      <rect x="97"  y="88"  width="14" height="27" rx="3" fill="#f1f5f9"/>
      <rect x="116" y="74"  width="14" height="41" rx="3" fill="#f1f5f9"/>
      <rect x="135" y="95"  width="14" height="20" rx="3" fill="#f1f5f9"/>
      <rect x="154" y="82"  width="14" height="33" rx="3" fill="#f1f5f9"/>
      <ellipse cx="48" cy="102" rx="30" ry="34"  fill="#f97316"/>
      <circle  cx="48" cy="52"  r="27"           fill="#f97316"/>
      <ellipse cx="38" cy="48" rx="6" ry="6.5"   fill="white"/>
      <ellipse cx="58" cy="48" rx="6" ry="6.5"   fill="white"/>
      <circle  cx="39" cy="50" r="3.5"           fill="#1e293b"/>
      <circle  cx="59" cy="50" r="3.5"           fill="#1e293b"/>
      <circle  cx="40" cy="48" r="1.3"           fill="white"/>
      <circle  cx="60" cy="48" r="1.3"           fill="white"/>
      <text x="35" y="40" fontSize="11" fontWeight="900" fill="#c2410c" fontFamily="system-ui">?</text>
      <path d="M40 64 Q44 61 48 64 Q52 67 56 64" stroke="#c2410c" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M68 82 Q80 72 88 78" stroke="#f97316" strokeWidth="9" fill="none" strokeLinecap="round"/>
      <ellipse cx="90" cy="138" rx="40" ry="5"   fill="#1e293b" opacity="0.09"/>
    </svg>
  ),

  // ── Character waving with empty silhouettes ───────────────────
  members: (
    <svg {...svgProps}>
      <circle  cx="118" cy="52" r="16"           fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
      <ellipse cx="118" cy="82" rx="20" ry="16"  fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
      <circle  cx="148" cy="58" r="13"           fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
      <ellipse cx="148" cy="84" rx="16" ry="13"  fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
      <circle  cx="88"  cy="56" r="13"           fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
      <ellipse cx="88"  cy="82" rx="16" ry="13"  fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
      <ellipse cx="48"  cy="104" rx="30" ry="32" fill="#f97316"/>
      <circle  cx="48"  cy="55"  r="27"          fill="#f97316"/>
      <ellipse cx="38"  cy="51" rx="6" ry="6.5"  fill="white"/>
      <ellipse cx="58"  cy="51" rx="6" ry="6.5"  fill="white"/>
      <circle  cx="39"  cy="52" r="3.5"          fill="#1e293b"/>
      <circle  cx="59"  cy="52" r="3.5"          fill="#1e293b"/>
      <circle  cx="40"  cy="50" r="1.3"          fill="white"/>
      <circle  cx="60"  cy="50" r="1.3"          fill="white"/>
      <path d="M38 65 Q48 73 58 65" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M68 80 Q78 60 82 55"  stroke="#f97316" strokeWidth="9"  fill="none" strokeLinecap="round"/>
      <circle  cx="82"  cy="52"  r="7"           fill="#f97316"/>
      <ellipse cx="80"  cy="138" rx="40" ry="5"  fill="#1e293b" opacity="0.09"/>
    </svg>
  ),

  // ── Default: character shrugging with empty box ───────────────
  default: (
    <svg {...svgProps}>
      <rect x="90" y="52" width="72" height="66" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="3"/>
      <path d="M90 52 L108 38 L162 38 L162 52"  fill="#f8fafc" stroke="#e2e8f0" strokeWidth="3"/>
      <path d="M90 70 L162 70"                   stroke="#e2e8f0" strokeWidth="2"/>
      <path d="M126 38 L126 52"                  stroke="#e2e8f0" strokeWidth="2"/>
      <ellipse cx="52" cy="104" rx="30" ry="32"  fill="#f97316"/>
      <circle  cx="52" cy="55"  r="27"           fill="#f97316"/>
      <ellipse cx="42" cy="51" rx="6" ry="6.5"   fill="white"/>
      <ellipse cx="62" cy="51" rx="6" ry="6.5"   fill="white"/>
      <circle  cx="43" cy="52" r="3.5"           fill="#1e293b"/>
      <circle  cx="63" cy="52" r="3.5"           fill="#1e293b"/>
      <circle  cx="44" cy="50" r="1.3"           fill="white"/>
      <circle  cx="64" cy="50" r="1.3"           fill="white"/>
      <path d="M37 42 Q42 38 47 41" stroke="#c2410c" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M57 41 Q62 38 67 42" stroke="#c2410c" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M43 66 Q52 63 61 66" stroke="#c2410c" strokeWidth="2"   fill="none" strokeLinecap="round"/>
      <path d="M30 88 Q22 78 24 70" stroke="#f97316" strokeWidth="9"   fill="none" strokeLinecap="round"/>
      <path d="M74 88 Q82 78 80 70" stroke="#f97316" strokeWidth="9"   fill="none" strokeLinecap="round"/>
      <ellipse cx="90" cy="138" rx="40" ry="5"   fill="#1e293b" opacity="0.09"/>
    </svg>
  ),
};

const EmptyState = ({ type = 'default', message, sub }) => (
  <div className="flex flex-col items-center justify-center py-14 select-none">
    <div className="mb-3">
      {illustrations[type] ?? illustrations.default}
    </div>
    <p className="text-sm font-semibold text-slate-500 mt-1">{message}</p>
    {sub && <p className="text-xs text-gray-600 mt-1 max-w-xs text-center">{sub}</p>}
  </div>
);

export default EmptyState;
