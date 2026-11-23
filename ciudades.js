/* Ambientación de cada ciudad: colores, tipografía, saludo y dibujos (SVG propios). */
window.CIUDADES = (function () {
  const stars = (n, w, h, color) => Array.from({ length: n }, (_, i) =>
    `<circle cx="${(i * 137) % w}" cy="${(i * 71) % h}" r="${1 + (i % 3) * 0.6}" fill="${color}" opacity="${0.4 + (i % 4) * 0.15}"/>`).join('');

  /* ------------------------------------------------------------------ NEW YORK */
  const newyorkBanner = () => {
    const blds = [[0,120,70],[60,80,55],[110,140,60],[165,60,45],[205,110,70],[470,90,55],[520,50,40],[555,130,65],[615,70,50],[660,115,60],[715,85,85]];
    let b = '';
    blds.forEach(([x, y, w], i) => {
      b += `<rect x="${x}" y="${y}" width="${w}" height="${260 - y}" fill="${i % 2 ? '#2b2f36' : '#353a42'}"/>`;
      for (let yy = y + 12; yy < 230; yy += 18) for (let xx = x + 8; xx < x + w - 8; xx += 14)
        if ((xx * 7 + yy * 3 + i) % 5 !== 0) b += `<rect x="${xx}" y="${yy}" width="6" height="8" fill="#fcd34d" opacity="${(xx + yy) % 3 ? 0.9 : 0.35}"/>`;
    });
    return `<svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="nyS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#111827"/><stop offset="1" stop-color="#4b5563"/></linearGradient></defs>
      <rect width="800" height="260" fill="url(#nyS)"/>${stars(40, 800, 120, '#fef3c7')}
      <circle cx="680" cy="45" r="22" fill="#fef3c7"/>
      ${b}
      <!-- Empire State -->
      <g transform="translate(160,0)"><rect x="400" y="70" width="50" height="190" fill="#3f444c"/><rect x="410" y="45" width="30" height="30" fill="#3f444c"/>
      <rect x="418" y="25" width="14" height="22" fill="#3f444c"/><rect x="423" y="0" width="4" height="27" fill="#3f444c"/>
      ${[85,105,125,145,165,185,205].map(y => `<rect x="408" y="${y}" width="34" height="5" fill="#fcd34d" opacity=".8"/>`).join('')}</g>
      <!-- Estatua de la Libertad -->
      <g transform="translate(440,40)">
        <rect x="10" y="150" width="60" height="70" fill="#5b7f73"/><rect x="0" y="210" width="80" height="12" fill="#4a6b60"/>
        <path d="M25 150 L32 70 L48 70 L55 150 Z" fill="#6aa595"/>
        <circle cx="40" cy="60" r="11" fill="#6aa595"/>
        <path d="M29 52 L24 40 L33 49 L35 35 L39 48 L44 35 L45 49 L54 40 L50 52 Z" fill="#6aa595"/>
        <path d="M46 75 L60 20 L66 22 L54 78 Z" fill="#6aa595"/>
        <rect x="56" y="10" width="12" height="10" rx="2" fill="#6aa595"/>
        <path d="M62 10 Q55 0 62 -10 Q69 0 62 10 Z" fill="#fbbf24"/>
        <rect x="22" y="88" width="10" height="16" fill="#5b8f80"/>
      </g>
      <!-- Taxi -->
      <g transform="translate(640,205)">
        <rect x="0" y="12" width="120" height="30" rx="8" fill="#facc15"/><path d="M25 12 L40 -6 L85 -6 L100 12 Z" fill="#facc15"/>
        <rect x="45" y="-2" width="16" height="12" fill="#bfdbfe"/><rect x="66" y="-2" width="18" height="12" fill="#bfdbfe"/>
        <rect x="50" y="-13" width="22" height="8" rx="2" fill="#111"/><text x="61" y="-6.5" font-size="6" text-anchor="middle" fill="#facc15" font-family="sans-serif" font-weight="bold">TAXI</text>
        ${Array.from({ length: 10 }, (_, i) => `<rect x="${10 + i * 10}" y="24" width="5" height="5" fill="${i % 2 ? '#111' : '#facc15'}"/><rect x="${15 + i * 10}" y="24" width="5" height="5" fill="${i % 2 ? '#facc15' : '#111'}"/>`).join('')}
        <circle cx="28" cy="42" r="10" fill="#111"/><circle cx="92" cy="42" r="10" fill="#111"/><circle cx="28" cy="42" r="4" fill="#9ca3af"/><circle cx="92" cy="42" r="4" fill="#9ca3af"/>
      </g>
    </svg>`;
  };

  /* --------------------------------------------------------------------- PARÍS */
  const eiffel = (fill) => `<path d="M100 0 L104 0 L106 40 L114 40 L118 95 L130 95 L150 200 L128 200 Q102 150 76 200 L54 200 L74 95 L86 95 L90 40 L98 40 Z" fill="${fill}"/>
      <rect x="84" y="36" width="36" height="6" fill="${fill}"/><rect x="70" y="92" width="64" height="7" fill="${fill}"/>
      <path d="M92 50 L112 85 M112 50 L92 85 M80 105 L124 145 M124 105 L80 145" stroke="#fdf2f8" stroke-width="1.5" opacity=".5"/>`;
  const parisBanner = () => `<svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="paS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbeafe"/><stop offset=".7" stop-color="#fce7f3"/><stop offset="1" stop-color="#fdf2f8"/></linearGradient></defs>
      <rect width="800" height="260" fill="url(#paS)"/>
      <g fill="#fff" opacity=".9"><ellipse cx="150" cy="60" rx="50" ry="15"/><ellipse cx="180" cy="50" rx="30" ry="14"/><ellipse cx="620" cy="80" rx="45" ry="13"/></g>
      <g transform="translate(300,60)">${eiffel('#1e3a8a')}</g>
      <!-- techos parisinos -->
      <path d="M0 200 L0 170 L40 150 L80 170 L80 140 L120 125 L160 140 L160 200 Z" fill="#a5b4fc"/>
      <path d="M560 200 L560 150 L600 130 L640 150 L640 160 L700 140 L760 160 L800 150 L800 200 Z" fill="#a5b4fc"/>
      <rect x="0" y="200" width="800" height="60" fill="#e0e7ff"/>
      <!-- café -->
      <g transform="translate(560,160)">
        <rect x="0" y="30" width="150" height="70" fill="#fff"/>
        ${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 15} 10 L${i * 15 + 15} 10 L${i * 15 + 15} 32 Q${i * 15 + 7.5} 40 ${i * 15} 32 Z" fill="${i % 2 ? '#fff' : '#dc2626'}" stroke="#dc2626" stroke-width="1"/>`).join('')}
        <text x="75" y="58" text-anchor="middle" font-family="'Playfair Display',serif" font-size="16" font-style="italic" fill="#1e3a8a">Café</text>
        <circle cx="40" cy="88" r="8" fill="#1e3a8a"/><rect x="38" y="88" width="4" height="12" fill="#1e3a8a"/>
        <circle cx="110" cy="88" r="8" fill="#1e3a8a"/><rect x="108" y="88" width="4" height="12" fill="#1e3a8a"/>
      </g>
      <!-- faroles -->
      ${[60, 230, 500].map(x => `<g transform="translate(${x},130)"><rect x="-2" y="20" width="4" height="110" fill="#1e293b"/><path d="M-10 20 L10 20 L6 0 L-6 0 Z" fill="#1e293b"/><rect x="-5" y="4" width="10" height="13" fill="#fde68a"/></g>`).join('')}
      <!-- cinta tricolor -->
      <rect x="0" y="252" width="267" height="8" fill="#1e3a8a"/><rect x="267" y="252" width="266" height="8" fill="#fff"/><rect x="533" y="252" width="267" height="8" fill="#dc2626"/>
    </svg>`;

  /* ----------------------------------------------------------------- BARCELONA */
  const sagrada = (fill, cross) => {
    const towers = [[40, 70, 24], [70, 30, 26], [102, 20, 26], [134, 30, 26], [164, 70, 24]];
    return towers.map(([x, y, w]) => `<path d="M${x} 200 L${x} ${y + 30} Q${x + w / 2} ${y - 25} ${x + w} ${y + 30} L${x + w} 200 Z" fill="${fill}"/>
        <circle cx="${x + w / 2}" cy="${y - 8}" r="5" fill="${cross}"/>
        ${[0, 1, 2, 3, 4].map(k => `<circle cx="${x + w / 2}" cy="${y + 40 + k * 22}" r="2.5" fill="#7c2d12" opacity=".6"/>`).join('')}`).join('') +
      `<rect x="30" y="140" width="170" height="60" fill="${fill}"/><path d="M95 200 L95 165 Q115 140 135 165 L135 200 Z" fill="#7c2d12" opacity=".6"/>`;
  };
  const trencadis = (y, h, n) => Array.from({ length: n }, (_, i) => {
    const c = ['#f97316', '#0ea5e9', '#facc15', '#10b981', '#ef4444', '#fff'][i % 6];
    const x = i * (800 / n);
    return `<polygon points="${x},${y + (i % 3) * 3} ${x + 800 / n - 2},${y + ((i + 1) % 4) * 3} ${x + 800 / n - 4},${y + h - (i % 2) * 4} ${x + 3},${y + h - 2}" fill="${c}" stroke="#7c2d12" stroke-width="1.2"/>`;
  }).join('');
  const barcelonaBanner = () => `<svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="bcS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs>
      <rect width="800" height="260" fill="url(#bcS)"/>
      <circle cx="140" cy="70" r="40" fill="#fef3c7" opacity=".9"/>
      <g transform="translate(280,0)">${sagrada('#d6a35c', '#f97316')}</g>
      <g transform="translate(560,90) scale(.55)">${sagrada('#c9925a', '#0ea5e9')}</g>
      <rect x="0" y="200" width="800" height="60" fill="#0284c7"/>
      ${[0, 1, 2, 3].map(r => `<path d="M0 ${212 + r * 12} ${Array.from({ length: 20 }, (_, i) => `Q${i * 40 + 20} ${206 + r * 12} ${i * 40 + 40} ${212 + r * 12}`).join(' ')}" stroke="#bae6fd" stroke-width="2" fill="none" opacity=".7"/>`).join('')}
      ${trencadis(0, 16, 24)}
    </svg>`;

  /* -------------------------------------------------------------- BUENOS AIRES */
  const filete = (x, y, s, flip) => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})">
      <path d="M0 0 C30 -40 80 -10 60 20 C45 42 15 25 30 10 C38 2 50 10 44 18" stroke="#111" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M0 0 C30 -40 80 -10 60 20 C45 42 15 25 30 10 C38 2 50 10 44 18" stroke="#dc2626" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M5 8 C-10 40 30 60 55 45" stroke="#111" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M5 8 C-10 40 30 60 55 45" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M62 -18 L66 -26 L70 -18 L66 -10 Z" fill="#eab308" stroke="#111" stroke-width="1.5"/>
      <circle cx="80" cy="5" r="4" fill="#eab308" stroke="#111" stroke-width="1.5"/></g>`;
  const casa = (x, w, h, c, v) => `<rect x="${x}" y="${200 - h}" width="${w}" height="${h}" fill="${c}" stroke="#1f2937" stroke-width="1.5"/>
      <rect x="${x + 8}" y="${200 - h + 12}" width="${w / 3}" height="20" fill="${v}" stroke="#1f2937"/>
      <rect x="${x + w - 8 - w / 3}" y="${200 - h + 12}" width="${w / 3}" height="20" fill="${v}" stroke="#1f2937"/>
      <rect x="${x + w / 2 - 8}" y="${200 - 34}" width="16" height="34" fill="${v}" stroke="#1f2937"/>`;
  const buenosairesBanner = () => `<svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="baS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient></defs>
      <rect width="800" height="260" fill="url(#baS)"/>
      <g fill="#fff" opacity=".9"><ellipse cx="560" cy="50" rx="50" ry="14"/><ellipse cx="590" cy="42" rx="28" ry="12"/></g>
      ${casa(0, 80, 90, '#2563eb', '#facc15')}${casa(80, 70, 110, '#dc2626', '#22c55e')}${casa(150, 80, 80, '#facc15', '#2563eb')}${casa(230, 60, 100, '#16a34a', '#f97316')}
      ${casa(520, 70, 95, '#f97316', '#2563eb')}${casa(590, 80, 115, '#a855f7', '#facc15')}${casa(670, 70, 85, '#22c55e', '#dc2626')}${casa(740, 60, 105, '#facc15', '#2563eb')}
      <!-- Obelisco -->
      <path d="M392 200 L398 40 L402 22 L406 40 L412 200 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
      <rect x="399" y="60" width="6" height="8" fill="#334155"/>
      <rect x="370" y="200" width="64" height="8" fill="#cbd5e1"/>
      <rect x="0" y="208" width="800" height="52" fill="#475569"/><rect x="0" y="230" width="800" height="4" fill="#fff" opacity=".7" stroke-dasharray="30 20"/>
      ${filete(300, 70, .8, false)}${filete(500, 70, .8, true)}
      <rect x="0" y="0" width="800" height="10" fill="#7dd3fc"/><rect x="0" y="10" width="800" height="4" fill="#fff"/>
    </svg>`;

  /* -------------------------------------------------------------------- CANCÚN */
  const palma = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M0 0 Q10 -60 -5 -120" stroke="#92400e" stroke-width="10" fill="none" stroke-linecap="round"/>
      ${[[-60, -100], [-45, -140], [10, -150], [50, -125], [55, -95]].map(([dx, dy]) => `<path d="M-5 -120 Q${dx / 2} ${dy - 20} ${dx} ${dy}" stroke="#16a34a" stroke-width="9" fill="none" stroke-linecap="round"/>`).join('')}
      <circle cx="-8" cy="-112" r="6" fill="#78350f"/><circle cx="2" cy="-110" r="6" fill="#78350f"/></g>`;
  const piramide = (fill) => [0, 1, 2, 3, 4].map(i => `<rect x="${i * 14}" y="${150 - i * 22}" width="${200 - i * 28}" height="22" fill="${fill}" stroke="#78350f" stroke-width="1.5"/>`).join('') +
      `<rect x="70" y="28" width="60" height="34" fill="${fill}" stroke="#78350f" stroke-width="1.5"/><rect x="92" y="40" width="16" height="22" fill="#78350f"/>
       <rect x="90" y="62" width="20" height="110" fill="#b45309" opacity=".5"/>`;
  const cancunBanner = () => `<svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="caS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#ecfeff"/></linearGradient></defs>
      <rect width="800" height="260" fill="url(#caS)"/>
      <circle cx="650" cy="60" r="34" fill="#fde047"/>${Array.from({ length: 12 }, (_, i) => `<line x1="650" y1="60" x2="${650 + Math.cos(i * Math.PI / 6) * 52}" y2="${60 + Math.sin(i * Math.PI / 6) * 52}" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>`).join('')}
      <g transform="translate(470,30)">${piramide('#d6b370')}</g>
      <path d="M0 170 Q200 155 400 170 T800 168 L800 205 L0 205 Z" fill="#06b6d4"/>
      <path d="M0 180 Q200 168 400 182 T800 178 L800 205 L0 205 Z" fill="#22d3ee" opacity=".8"/>
      <path d="M0 200 Q200 190 400 198 T800 196 L800 260 L0 260 Z" fill="#fde68a"/>
      ${palma(110, 235, 1)}${palma(210, 245, .75)}${palma(740, 240, .9)}
      <g transform="translate(330,225)"><path d="M0 0 L40 -30 L80 0 Z" fill="#f43f5e"/><rect x="38" y="-30" width="4" height="40" fill="#78350f"/></g>
    </svg>`;

  /* ------------------------------------------------------------ RÍO DE JANEIRO */
  const cristo = (fill) => `<rect x="-4" y="-56" width="8" height="56" fill="${fill}"/><rect x="-36" y="-50" width="72" height="8" rx="3" fill="${fill}"/>
      <path d="M-7 -44 L7 -44 L10 0 L-10 0 Z" fill="${fill}"/><circle cx="0" cy="-62" r="6" fill="${fill}"/>`;
  const rioBanner = () => {
    const confeti = Array.from({ length: 50 }, (_, i) => `<rect x="${(i * 97) % 800}" y="${(i * 53) % 150}" width="6" height="3" fill="${['#16a34a', '#facc15', '#2563eb', '#ec4899', '#f97316'][i % 5]}" transform="rotate(${i * 37} ${(i * 97) % 800} ${(i * 53) % 150})"/>`).join('');
    return `<svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="rioS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#fef9c3"/></linearGradient></defs>
      <rect width="800" height="260" fill="url(#rioS)"/>${confeti}
      <!-- Corcovado con el Cristo -->
      <path d="M300 230 L380 140 Q420 95 450 110 L510 170 L560 230 Z" fill="#15803d"/>
      <g transform="translate(430,108)">${cristo('#f8fafc')}</g>
      <!-- Pan de Azúcar -->
      <g transform="translate(60,0)"><path d="M470 230 Q500 160 545 150 Q585 160 600 230 Z" fill="#166534"/>
      <path d="M580 230 Q610 100 660 90 Q710 100 735 230 Z" fill="#14532d"/>
      <line x1="545" y1="150" x2="660" y2="92" stroke="#334155" stroke-width="1.5"/><rect x="595" y="117" width="10" height="7" fill="#dc2626"/></g>
      <rect x="0" y="222" width="800" height="38" fill="#0ea5e9"/>
      <path d="M0 240 Q100 232 200 240 T400 240 T600 240 T800 240 L800 260 L0 260 Z" fill="#fde68a"/>
      <path d="M0 240 Q100 232 200 240 T400 240 T600 240 T800 240" stroke="#111" stroke-width="3" fill="none" stroke-dasharray="8 8"/>
      <!-- penacho de carnaval -->
      <g transform="translate(60,215)">${[-60, -35, -10, 15, 40, 65].map((a, i) => `<ellipse cx="0" cy="-45" rx="9" ry="45" fill="${['#16a34a', '#facc15', '#2563eb', '#ec4899', '#facc15', '#16a34a'][i]}" transform="rotate(${a})"/>`).join('')}<circle cx="0" cy="0" r="10" fill="#facc15"/></g>
    </svg>`;
  };

  /* ------------------------------------------------------------------ EMBLEMAS */
  const em = (bg, inner) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="31" fill="${bg}"/>${inner}</svg>`;
  const emblemas = {
    newyork: em('#111827', `<g transform="translate(14,4) scale(.42)"><path d="M25 150 L32 70 L48 70 L55 150 Z" fill="#6aa595"/><circle cx="40" cy="60" r="11" fill="#6aa595"/><path d="M29 52 L24 40 L33 49 L35 35 L39 48 L44 35 L45 49 L54 40 L50 52 Z" fill="#6aa595"/><path d="M46 75 L60 20 L66 22 L54 78 Z" fill="#6aa595"/><path d="M62 18 Q55 6 62 -4 Q69 6 62 18 Z" fill="#fbbf24"/></g>`),
    paris: em('#1e3a8a', `<g transform="translate(9,9) scale(.23)">${eiffel('#fdf2f8')}</g>`),
    barcelona: em('#ea580c', `<g transform="translate(6,8) scale(.25)">${sagrada('#fde68a', '#0ea5e9')}</g>`),
    buenosaires: em('#38bdf8', `<path d="M29 54 L31 16 L32 10 L33 16 L35 54 Z" fill="#fff" stroke="#1e3a8a" stroke-width="1"/><rect x="24" y="54" width="16" height="3" fill="#fff"/>`),
    cancun: em('#06b6d4', `<g transform="translate(34,58) scale(.33)"><path d="M0 0 Q10 -60 -5 -120" stroke="#92400e" stroke-width="12" fill="none"/>${[[-60, -100], [-45, -140], [10, -150], [50, -125], [55, -95]].map(([dx, dy]) => `<path d="M-5 -120 Q${dx / 2} ${dy - 20} ${dx} ${dy}" stroke="#bbf7d0" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}</g>`),
    rio: em('#16a34a', `<g transform="translate(32,52) scale(.55)">${cristo('#fef9c3')}</g>`),
  };

  return {
    newyork:     { ciudad: 'New York', saludo: 'Welcome to New York', font: "'Bebas Neue', Impact, sans-serif", banner: newyorkBanner, emblema: emblemas.newyork,
                   colores: { fondo: '#1f2937', fondo2: '#111827', principal: '#facc15', acento: '#9ca3af', texto: '#f9fafb', tarjeta: '#2b2f36' } },
    paris:       { ciudad: 'París', saludo: 'Bienvenue à Paris', font: "'Playfair Display', Georgia, serif", banner: parisBanner, emblema: emblemas.paris,
                   colores: { fondo: '#fdf2f8', fondo2: '#e0e7ff', principal: '#1e3a8a', acento: '#dc2626', texto: '#1e1b4b', tarjeta: '#ffffff' } },
    barcelona:   { ciudad: 'Barcelona', saludo: 'Benvinguts a Barcelona', font: "'Righteous', 'Trebuchet MS', sans-serif", banner: barcelonaBanner, emblema: emblemas.barcelona,
                   colores: { fondo: '#fff7ed', fondo2: '#fed7aa', principal: '#ea580c', acento: '#0284c7', texto: '#431407', tarjeta: '#ffffff' } },
    buenosaires: { ciudad: 'Buenos Aires', saludo: 'Bienvenidos a Buenos Aires', font: "'Lobster', 'Brush Script MT', cursive", banner: buenosairesBanner, emblema: emblemas.buenosaires,
                   colores: { fondo: '#f0f9ff', fondo2: '#bae6fd', principal: '#0369a1', acento: '#dc2626', texto: '#0c1a2b', tarjeta: '#ffffff' } },
    cancun:      { ciudad: 'Cancún', saludo: 'Bienvenidos a Cancún', font: "'Fredoka', 'Comic Sans MS', sans-serif", banner: cancunBanner, emblema: emblemas.cancun,
                   colores: { fondo: '#ecfeff', fondo2: '#fef3c7', principal: '#0891b2', acento: '#16a34a', texto: '#083344', tarjeta: '#ffffff' } },
    rio:         { ciudad: 'Río de Janeiro', saludo: 'Bem-vindos ao Rio', font: "'Pacifico', 'Brush Script MT', cursive", banner: rioBanner, emblema: emblemas.rio,
                   colores: { fondo: '#f0fdf4', fondo2: '#fef9c3', principal: '#15803d', acento: '#2563eb', texto: '#052e16', tarjeta: '#ffffff' } },
  };
})();
