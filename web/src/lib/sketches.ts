// Original hand-drawn gold-line SVG sketches, keyed by sku. Ported verbatim
// from the single-file site. Hard rule 2: unsourced (coming-soon) items get one
// of these instead of a photo — never a stand-in image of something DOKU
// doesn't own. These are trusted, in-repo strings; Frame renders them with
// set:html, which is safe precisely because they never contain user input.
export const SKETCHES: Record<string, string> = {
  '017': `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#B08D57" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M40,40 L120,55 L100,100 L130,150 L60,160 L75,105 Z" />
      <path d="M40,40 L100,100" stroke-width="1" opacity="0.55"/>
      <path d="M120,55 L130,150" stroke-width="1" opacity="0.55"/>
      <path d="M60,160 L75,105" stroke-width="1" opacity="0.55"/>
    </g>
  </svg>`,
  '018': `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#B08D57" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M30,128 C16,112 18,90 34,80 C32,62 50,46 76,46 C92,30 122,32 136,48
               C156,46 170,64 162,82 C176,92 172,114 154,120 C152,136 130,144 110,138
               C90,148 56,146 42,134 C36,134 32,132 30,128 Z" />
      <path d="M66,92 L82,90" />
      <path d="M112,88 L128,86" />
      <path d="M48,72 L150,58" stroke-width="1.1" opacity="0.75"/>
    </g>
  </svg>`,
  '019': `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#B08D57" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M70,30 L62,150 L50,135 Z" />
      <path d="M90,35 L78,155 L66,138 Z" />
      <path d="M110,45 L92,160 L80,142 Z" />
      <path d="M128,55 L104,165 L94,147 Z" />
    </g>
  </svg>`,
  '020': `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#B08D57" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="80" cy="112" rx="46" ry="44" />
      <path d="M80,74 C95,86 95,102 80,112 C65,122 65,138 80,150" stroke-width="1" opacity="0.6"/>
      <path d="M50,92 C60,102 60,122 50,132" stroke-width="1" opacity="0.45"/>
      <ellipse cx="80" cy="112" rx="5" ry="4.5" opacity="0.7"/>
    </g>
  </svg>`,
  '021': `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#B08D57" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
      <rect x="38" y="30" width="84" height="86" />
      <path d="M38,52 L122,52" stroke-width="1" opacity="0.55"/>
      <path d="M38,74 L122,74" stroke-width="1" opacity="0.55"/>
      <path d="M38,96 L122,96" stroke-width="1" opacity="0.55"/>
      <path d="M48,116 L46,168 M62,116 L60,172 M76,116 L75,166 M90,116 L91,172 M104,116 L103,168 M114,116 L116,166" stroke-width="1.3"/>
    </g>
  </svg>`,
};
