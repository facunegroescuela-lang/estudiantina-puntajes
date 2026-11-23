/* =====================================================================
   ESTUDIANTINA — programa de puntajes
   ===================================================================== */
(function () {
  'use strict';
  const CFG = window.ESTUDIANTINA_CONFIG || {};
  const CIU = window.CIUDADES;
  const PUESTOS = [['1', '1° puesto'], ['2', '2° puesto'], ['3', '3° puesto'], ['P', 'Participación']];
  const nombrePuesto = (p) => (PUESTOS.find(x => x[0] === p) || [p, p])[1];
  const tope = (j, p) => ({ '1': j.p1, '2': j.p2, '3': j.p3, 'P': j.participacion })[p];

  /* ------------------------------------------------------------ utilidades */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fecha = (s) => new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const hora = (s) => new Date(s).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  function toast(msg, tipo = 'ok') {
    const t = $('#toast');
    t.textContent = msg; t.className = 'toast ' + tipo; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3500);
  }
  function modal(html) {
    const m = $('#modal'); $('#modal-caja').innerHTML = html; m.hidden = false;
    return { cerrar: () => { m.hidden = true; $('#modal-caja').innerHTML = ''; }, caja: $('#modal-caja') };
  }
  function confirmar(titulo, texto, boton = 'Confirmar') {
    return new Promise(res => {
      const m = modal(`<h3>${titulo}</h3><p class="modal-texto">${texto}</p>
        <div class="fila-botones"><button class="btn sec" data-r="0">Cancelar</button><button class="btn" data-r="1">${boton}</button></div>`);
      $$('button', m.caja).forEach(b => b.onclick = () => { m.cerrar(); res(b.dataset.r === '1'); });
    });
  }
  function pedirTexto(titulo, etiqueta, tipo = 'text', boton = 'Aceptar') {
    return new Promise(res => {
      const m = modal(`<h3>${titulo}</h3><label class="campo"><span>${etiqueta}</span>
        ${tipo === 'area' ? '<textarea id="pt" rows="3"></textarea>' : `<input id="pt" type="${tipo}" autocomplete="off">`}</label>
        <div class="fila-botones"><button class="btn sec" data-r="0">Cancelar</button><button class="btn" data-r="1">${boton}</button></div>`);
      setTimeout(() => $('#pt').focus(), 50);
      $$('button', m.caja).forEach(b => b.onclick = () => { const v = $('#pt').value; m.cerrar(); res(b.dataset.r === '1' ? v : null); });
    });
  }

  /* ------------------------------------------------------------ sesión */
  const SKEY = 'estudiantina_sesion';
  let sesion = null;
  try { sesion = JSON.parse(localStorage.getItem(SKEY)); } catch (e) { sesion = null; }
  const guardarSesion = (s) => { sesion = s; try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); } catch (e) {} pintarSesion(); };

  /* ======================================================= BACKEND: SUPABASE */
  function backendSupabase() {
    const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    async function rpc(fn, args) {
      const { data, error } = await sb.rpc(fn, args);
      if (error) throw new Error(error.message || 'Error de conexión');
      return data;
    }
    async function tabla(nombre, orden, asc = true) {
      const { data, error } = await sb.from(nombre).select('*').order(orden, { ascending: asc }).limit(5000);
      if (error) throw new Error(error.message);
      return data;
    }
    return {
      modo: 'supabase',
      async cargarTodo() {
        const [cursos, juegos, cargas, habilitaciones] = await Promise.all([
          tabla('cursos', 'orden'), tabla('juegos', 'orden'), tabla('cargas', 'id', false), tabla('habilitaciones', 'id')]);
        return { cursos, juegos, cargas, habilitaciones };
      },
      login: (u, c) => rpc('iniciar_sesion', { p_usuario: u, p_clave: c }),
      logout: (t) => rpc('cerrar_sesion', { p_token: t }).catch(() => {}),
      cargarPuntos: (t, curso, juego, puesto, puntos, obs) => rpc('cargar_puntos', { p_token: t, p_curso: curso, p_juego: juego, p_puesto: puesto, p_puntos: puntos, p_observacion: obs }),
      anular: (t, id, motivo) => rpc('anular_carga', { p_token: t, p_carga: id, p_motivo: motivo }),
      adminUsuarios: (t) => rpc('admin_usuarios', { p_token: t }),
      adminCrearUsuario: (t, u, n, c, r) => rpc('admin_crear_usuario', { p_token: t, p_usuario: u, p_nombre: n, p_clave: c, p_rol: r }),
      adminCambiarClave: (t, id, c) => rpc('admin_cambiar_clave', { p_token: t, p_id: id, p_clave: c }),
      adminActivar: (t, id, a) => rpc('admin_activar_usuario', { p_token: t, p_id: id, p_activo: a }),
      adminGuardarJuego: (t, id, n, p1, p2, p3, pp, act) => rpc('admin_guardar_juego', { p_token: t, p_id: id, p_nombre: n, p_p1: p1, p_p2: p2, p_p3: p3, p_part: pp, p_activo: act }),
      adminRenombrarCurso: (t, id, n) => rpc('admin_renombrar_curso', { p_token: t, p_id: id, p_nombre: n }),
      adminHabilitar: (t, c, j) => rpc('admin_habilitar', { p_token: t, p_curso: c, p_juego: j }),
      adminRegistro: (t) => rpc('admin_registro', { p_token: t }),
      suscribir(cb) {
        try { sb.channel('cargas-vivo').on('postgres_changes', { event: '*', schema: 'public', table: 'cargas' }, cb).subscribe(); } catch (e) {}
      },
    };
  }

  /* ========================================== BACKEND: DEMO (solo este equipo) */
  function backendDemo() {
    const K = 'estudiantina_demo_v1';
    const ahora = () => new Date().toISOString();
    const hace = (min) => new Date(Date.now() - min * 60000).toISOString();
    function inicial() {
      const cursos = [['newyork', '1° año', 'New York'], ['paris', '2° año', 'París'], ['barcelona', '3° año', 'Barcelona'],
        ['buenosaires', '4° año', 'Buenos Aires'], ['cancun', '5° año', 'Cancún'], ['rio', '6° año', 'Río de Janeiro']]
        .map(([clave, nombre, ciudad], i) => ({ id: i + 1, clave, nombre, ciudad, orden: i + 1 }));
      const juegos = ['Esponja humana', 'Globo viajero', 'Encuentra la moneda', 'Derriba los vasos', 'Carrera de carretillas', 'Globo sorpresa']
        .map((nombre, i) => ({ id: i + 1, nombre, p1: 10, p2: 7, p3: 5, participacion: 2, activo: true, orden: i + 1 }));
      const usuarios = [
        { id: 'u1', usuario: 'admin', nombre: 'Administrador', clave: 'cambiar123', rol: 'admin', activo: true },
        { id: 'u2', usuario: 'profe1', nombre: 'Prof. Gómez', clave: 'demo123', rol: 'cargador', activo: true },
        { id: 'u3', usuario: 'profe2', nombre: 'Prof. Ruiz', clave: 'demo123', rol: 'cargador', activo: true }];
      const ej = [[5, 1, '1', 'u2', 95], [6, 1, '2', 'u2', 94], [2, 1, '3', 'u2', 93], [1, 1, 'P', 'u2', 92],
                  [3, 2, '1', 'u3', 60], [5, 2, '2', 'u3', 59], [4, 2, '3', 'u3', 58], [6, 4, '1', 'u2', 20], [5, 4, '2', 'u2', 19]];
      const cargas = ej.map(([c, j, p, u, m], i) => ({ id: i + 1, curso_id: c, juego_id: j, puesto: p, puntos: tope(juegos[j - 1], p),
        observacion: null, cargado_por: u, cargado_por_nombre: usuarios.find(x => x.id === u).nombre, creado_en: hace(m),
        anulada: false, anulada_por_nombre: null, anulada_en: null, motivo_anulacion: null })).reverse();
      return { cursos, juegos, usuarios, cargas, habilitaciones: [], registro: [], sesiones: {}, sig: 100 };
    }
    let db;
    try { db = JSON.parse(localStorage.getItem(K)) || inicial(); } catch (e) { db = inicial(); }
    const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (e) {} };
    const err = (m) => { throw new Error(m); };
    const ses = (t) => { const u = db.usuarios.find(x => x.id === db.sesiones[t] && x.activo); if (!u) err('Tu sesión venció. Volvé a iniciar sesión.'); return u; };
    const adm = (t) => { const u = ses(t); if (u.rol !== 'admin') err('Solo el administrador puede hacer esto.'); return u; };
    const reg = (u, a) => db.registro.unshift({ id: db.sig++, fecha: ahora(), usuario: u.nombre, accion: a });
    const pub = () => JSON.parse(JSON.stringify({ cursos: db.cursos, juegos: db.juegos, cargas: db.cargas, habilitaciones: db.habilitaciones }));
    const cargadoresActivos = () => db.usuarios.filter(x => x.rol === 'cargador' && x.activo).length;
    const listeners = [];
    const done = (v) => { save(); listeners.forEach(f => setTimeout(f, 0)); return v; };
    return {
      modo: 'demo',
      async cargarTodo() { return pub(); },
      async login(u, c) {
        const x = db.usuarios.find(y => y.usuario === String(u).trim().toLowerCase() && y.activo);
        if (!x || x.clave !== c) err('Usuario o contraseña incorrectos.');
        const t = 't' + Math.random().toString(36).slice(2); db.sesiones[t] = x.id; save();
        return { token: t, id: x.id, nombre: x.nombre, rol: x.rol, usuario: x.usuario };
      },
      async logout(t) { delete db.sesiones[t]; save(); },
      async cargarPuntos(t, curso, juego, puesto, puntos, obs) {
        const u = ses(t); const j = db.juegos.find(x => x.id === juego && x.activo);
        if (!j) err('Ese juego no existe o está desactivado.');
        const max = tope(j, puesto); if (max == null) err('Puesto inválido.');
        if (!(puntos >= 0 && puntos <= max)) err(`Para ese puesto se pueden cargar como máximo ${max} puntos.`);
        if (db.cargas.some(c => c.curso_id === curso && c.juego_id === juego && !c.anulada)) {
          const h = db.habilitaciones.find(h => h.curso_id === curso && h.juego_id === juego && !h.usada);
          if (!h) err('Este curso ya tiene puntos en este juego. Si corresponde otra carga, el administrador tiene que habilitarla.');
          h.usada = true;
        }
        const id = db.sig++;
        db.cargas.unshift({ id, curso_id: curso, juego_id: juego, puesto, puntos, observacion: (obs || '').trim() || null,
          cargado_por: u.id, cargado_por_nombre: u.nombre, creado_en: ahora(), anulada: false, anulada_por_nombre: null, anulada_en: null, motivo_anulacion: null });
        return done(id);
      },
      async anular(t, id, motivo) {
        const u = ses(t); if (!String(motivo || '').trim()) err('Escribí el motivo de la anulación.');
        const c = db.cargas.find(x => x.id === id); if (!c) err('Esa carga no existe.'); if (c.anulada) err('Esa carga ya estaba anulada.');
        if (u.rol !== 'admin' && c.cargado_por !== u.id) err('Solo podés anular cargas hechas por vos. Pedíselo al administrador.');
        Object.assign(c, { anulada: true, anulada_por_nombre: u.nombre, anulada_en: ahora(), motivo_anulacion: motivo.trim() });
        return done();
      },
      async adminUsuarios(t) { adm(t); return db.usuarios.map(({ clave, ...r }) => r); },
      async adminCrearUsuario(t, us, n, c, r) {
        const a = adm(t); us = String(us || '').trim().toLowerCase(); n = String(n || '').trim();
        if (!us || !n) err('Completá usuario y nombre.'); if (String(c || '').length < 6) err('La contraseña tiene que tener al menos 6 caracteres.');
        if (r === 'cargador' && cargadoresActivos() >= 6) err('Ya hay 6 cargadores activos. Desactivá uno antes de crear otro.');
        if (db.usuarios.some(x => x.usuario === us)) err('Ese nombre de usuario ya existe.');
        db.usuarios.push({ id: 'u' + db.sig++, usuario: us, nombre: n, clave: c, rol: r, activo: true });
        reg(a, `Creó el usuario ${n} (${r})`); return done();
      },
      async adminCambiarClave(t, id, c) {
        const a = adm(t); if (String(c || '').length < 6) err('La contraseña tiene que tener al menos 6 caracteres.');
        const u = db.usuarios.find(x => x.id === id); if (!u) err('Usuario no encontrado.');
        u.clave = c; reg(a, 'Cambió la contraseña de ' + u.nombre); return done();
      },
      async adminActivar(t, id, act) {
        const a = adm(t); if (id === a.id) err('No podés desactivarte a vos mismo.');
        const u = db.usuarios.find(x => x.id === id); if (!u) err('Usuario no encontrado.');
        if (act && u.rol === 'cargador' && !u.activo && cargadoresActivos() >= 6) err('Ya hay 6 cargadores activos.');
        u.activo = act; reg(a, (act ? 'Activó a ' : 'Desactivó a ') + u.nombre); return done();
      },
      async adminGuardarJuego(t, id, n, p1, p2, p3, pp, act) {
        const a = adm(t); n = String(n || '').trim(); if (!n) err('Escribí el nombre del juego.');
        if (Math.min(p1, p2, p3, pp) < 0 || [p1, p2, p3, pp].some(isNaN)) err('Puntajes inválidos.');
        if (id == null) { db.juegos.push({ id: db.sig++, nombre: n, p1, p2, p3, participacion: pp, activo: act !== false, orden: db.juegos.length + 1 }); reg(a, 'Agregó el juego ' + n); }
        else { Object.assign(db.juegos.find(x => x.id === id), { nombre: n, p1, p2, p3, participacion: pp, activo: act }); reg(a, `Modificó el juego ${n} (topes ${p1}/${p2}/${p3}/${pp}, ${act ? 'activo' : 'desactivado'})`); }
        return done();
      },
      async adminRenombrarCurso(t, id, n) {
        const a = adm(t); n = String(n || '').trim(); if (!n) err('Escribí el nombre del curso.');
        const c = db.cursos.find(x => x.id === id); c.nombre = n; reg(a, `Renombró el curso de ${c.ciudad} a ${n}`); return done();
      },
      async adminHabilitar(t, c, j) {
        const a = adm(t); db.habilitaciones.push({ id: db.sig++, curso_id: c, juego_id: j, usada: false, creada_por: a.nombre, creada_en: ahora() });
        const cu = db.cursos.find(x => x.id === c), ju = db.juegos.find(x => x.id === j);
        reg(a, `Habilitó otra carga para ${cu.nombre} (${cu.ciudad}) en ${ju.nombre}`); return done();
      },
      async adminRegistro(t) { adm(t); return db.registro.slice(0, 200); },
      suscribir(cb) { listeners.push(cb); window.addEventListener('storage', e => { if (e.key === K) { try { db = JSON.parse(e.newValue); } catch (x) {} cb(); } }); },
    };
  }

  const configurado = CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase;
  const api = configurado ? backendSupabase() : backendDemo();

  /* ------------------------------------------------------------ datos */
  let D = { cursos: [], juegos: [], cargas: [], habilitaciones: [] };
  const curso = (id) => D.cursos.find(c => c.id === id) || { nombre: '?', ciudad: '?', clave: 'general' };
  const juego = (id) => D.juegos.find(j => j.id === id) || { nombre: '?' };
  const validas = () => D.cargas.filter(c => !c.anulada);
  function totales() {
    const t = D.cursos.map(c => ({ ...c, total: validas().filter(x => x.curso_id === c.id).reduce((s, x) => s + x.puntos, 0) }));
    t.sort((a, b) => b.total - a.total || a.orden - b.orden);
    let pos = 0, prev = null;
    t.forEach((c, i) => { if (c.total !== prev) { pos = i + 1; prev = c.total; } c.pos = pos; });
    return t;
  }
  async function recargar() {
    try { D = await api.cargarTodo(); }
    catch (e) { console.error(e); toast('No se pudieron cargar los datos: ' + e.message, 'error'); }
  }
  async function manejarError(e) {
    toast(e.message, 'error');
    if (/sesión venció/i.test(e.message)) { guardarSesion(null); render(); }
  }

  /* ------------------------------------------------------------ tema */
  function setTema(clave) {
    document.body.dataset.tema = clave;
    const r = document.documentElement.style;
    const c = CIU[clave] ? CIU[clave].colores : null;
    ['fondo', 'fondo2', 'principal', 'acento', 'texto', 'tarjeta'].forEach(k => c ? r.setProperty('--' + k, c[k]) : r.removeProperty('--' + k));
    r.setProperty('--fuente-ciudad', CIU[clave] ? CIU[clave].font : 'inherit');
  }
  const emblema = (clave, cls = 'emblema') => `<span class="${cls}">${CIU[clave] ? CIU[clave].emblema : ''}</span>`;

  function pintarSesion() {
    const el = $('#sesion-top');
    $('#nav-admin').hidden = !(sesion && sesion.rol === 'admin');
    el.innerHTML = sesion
      ? `<span class="quien">👤 ${esc(sesion.nombre)}</span><button class="btn mini sec" id="btn-salir">Salir</button>`
      : `<a class="btn mini" href="#/cargar">Ingresar</a>`;
    const b = $('#btn-salir'); if (b) b.onclick = salir;
  }
  async function salir() {
    if (sesion) await api.logout(sesion.token);
    guardarSesion(null); toast('Sesión cerrada'); render();
  }

  /* ============================================================ VISTAS */
  const app = () => $('#app');

  function vistaInicio() {
    setTema('general');
    const t = totales(); const max = Math.max(1, ...t.map(c => c.total));
    const medalla = (p) => ({ 1: '🥇', 2: '🥈', 3: '🥉' }[p] || p + '°');
    const ult = D.cargas.slice(0, 8);
    app().innerHTML = `
      <section class="portada">
        <div><h1>Tabla de posiciones</h1><p>La vuelta al mundo en 6 ciudades · <span class="vivo">● EN VIVO</span></p></div>
      </section>
      <section class="ranking">
        ${t.map(c => {
          const k = CIU[c.clave] || {}; const col = k.colores || {};
          return `<a class="fila-curso" href="#/curso/${c.clave}" style="--c:${col.principal};--cf:${col.fondo2};--ct:${col.texto}">
            <span class="pos">${medalla(c.pos)}</span>${emblema(c.clave)}
            <span class="datos"><b>${esc(c.nombre)}</b><span class="ciudad" style="font-family:${k.font}">${esc(c.ciudad)}</span>
              <span class="barra"><i style="width:${Math.round(c.total / max * 100)}%"></i></span></span>
            <span class="total">${c.total}<small>pts</small></span></a>`;
        }).join('')}
      </section>
      <section class="tarjeta">
        <h2>Últimas cargas</h2>
        ${ult.length ? `<ul class="feed">${ult.map(x => { const c = curso(x.curso_id); return `
          <li class="${x.anulada ? 'anulada' : ''}">${emblema(c.clave, 'emblema mini')}
            <span><b>${x.anulada ? '' : '+'}${x.puntos}</b> a ${esc(c.nombre)} (${esc(c.ciudad)}) · ${esc(juego(x.juego_id).nombre)}
            <small>Cargó ${esc(x.cargado_por_nombre)} · ${hora(x.creado_en)}${x.anulada ? ' · ANULADA' : ''}</small></span></li>`; }).join('')}</ul>`
          : '<p class="vacio">Todavía no se cargaron puntos. ¡Que empiece la Estudiantina!</p>'}
      </section>`;
  }

  function vistaCurso(clave) {
    const c = D.cursos.find(x => x.clave === clave);
    if (!c) { app().innerHTML = '<p class="vacio">Curso no encontrado.</p>'; return; }
    setTema(clave);
    const k = CIU[clave]; const t = totales(); const yo = t.find(x => x.id === c.id);
    const mias = D.cargas.filter(x => x.curso_id === c.id);
    const porJuego = D.juegos.filter(j => j.activo || mias.some(x => x.juego_id === j.id)).map(j => {
      const v = mias.filter(x => x.juego_id === j.id && !x.anulada);
      return { j, pts: v.reduce((s, x) => s + x.puntos, 0), hay: v.length > 0, puesto: v[0] && nombrePuesto(v[0].puesto) };
    });
    app().innerHTML = `
      <section class="hero-ciudad">
        <div class="banner">${k.banner()}</div>
        <div class="hero-texto">
          <p class="saludo">${esc(k.saludo)}</p>
          <h1>${esc(c.nombre)}</h1>
          <p>Representa a <b>${esc(k.ciudad)}</b></p>
        </div>
      </section>
      <section class="stats">
        <div class="stat"><span>Puntaje total</span><b>${yo.total}</b></div>
        <div class="stat"><span>Posición</span><b>${yo.pos}°<small> de ${t.length}</small></b></div>
        <div class="stat"><span>Juegos con puntos</span><b>${porJuego.filter(x => x.hay).length}<small> de ${porJuego.length}</small></b></div>
      </section>
      <section class="tarjeta">
        <h2>Puntos por juego</h2>
        <div class="grilla-juegos">${porJuego.map(x => `
          <div class="juego ${x.hay ? '' : 'sin'}"><span>${esc(x.j.nombre)}</span>
            <b>${x.hay ? x.pts + ' pts' : '—'}</b><small>${x.hay ? esc(x.puesto) : 'Todavía sin puntos'}</small></div>`).join('')}
        </div>
      </section>
      <section class="tarjeta">
        <h2>Cargas de ${esc(c.nombre)}</h2>
        ${mias.length ? `<ul class="feed">${mias.map(x => `
          <li class="${x.anulada ? 'anulada' : ''}"><span><b>${x.puntos} pts</b> · ${esc(juego(x.juego_id).nombre)} · ${nombrePuesto(x.puesto)}
            <small>Cargó ${esc(x.cargado_por_nombre)} el ${fecha(x.creado_en)}${x.observacion ? ' · “' + esc(x.observacion) + '”' : ''}</small>
            ${x.anulada ? `<small class="motivo">Anulada por ${esc(x.anulada_por_nombre)}: ${esc(x.motivo_anulacion)}</small>` : ''}</span></li>`).join('')}</ul>`
          : '<p class="vacio">Este curso todavía no tiene puntos.</p>'}
      </section>
      <nav class="otras-ciudades">${D.cursos.filter(x => x.id !== c.id).map(x => `<a href="#/curso/${x.clave}">${emblema(x.clave, 'emblema mini')}${esc(x.ciudad)}</a>`).join('')}
        <a href="#/">🏆 Ranking</a></nav>`;
  }

  function vistaLogin(destino) {
    setTema('general');
    app().innerHTML = `
      <section class="tarjeta login">
        <h2>🔒 Ingreso de cargadores</h2>
        <p>Solo las personas autorizadas pueden cargar puntos. Cada carga queda registrada con tu nombre.</p>
        <form id="f-login">
          <label class="campo"><span>Usuario</span><input name="u" autocomplete="username" autocapitalize="none" required></label>
          <label class="campo"><span>Contraseña</span><input name="c" type="password" autocomplete="current-password" required></label>
          <button class="btn grande" type="submit">Ingresar</button>
        </form>
        ${api.modo === 'demo' ? '<p class="nota">Demo: <b>admin</b> / <b>cambiar123</b> o <b>profe1</b> / <b>demo123</b></p>' : ''}
      </section>`;
    $('#f-login').onsubmit = async (e) => {
      e.preventDefault(); const b = $('button', e.target); b.disabled = true; b.textContent = 'Ingresando…';
      try {
        const s = await api.login(e.target.u.value, e.target.c.value);
        guardarSesion(s); toast('¡Hola, ' + s.nombre + '!'); render();
      } catch (er) { toast(er.message, 'error'); b.disabled = false; b.textContent = 'Ingresar'; }
    };
  }

  const barraSesion = () => `<div class="barra-sesion">Sesión iniciada: <b>${esc(sesion.nombre)}</b>
      <span class="rol">${sesion.rol === 'admin' ? 'Administrador' : 'Cargador de puntos'}</span>
      <button class="btn mini sec" id="salir2">Cerrar sesión</button></div>`;

  /* ---------------------------------------------------------- CARGAR */
  let F = { curso: null, juego: null, puesto: null, puntos: '', obs: '' };
  function vistaCargar() {
    if (!sesion) return vistaLogin('cargar');
    setTema(F.curso ? curso(F.curso).clave : 'general');
    const j = F.juego ? juego(F.juego) : null;
    const yaTiene = (cid, jid) => validas().filter(x => x.curso_id === cid && x.juego_id === jid);
    const habilitado = (cid, jid) => D.habilitaciones.some(h => h.curso_id === cid && h.juego_id === jid && !h.usada);
    const max = j && F.puesto ? tope(j, F.puesto) : null;
    if (max != null && (F.puntos === '' || +F.puntos > max)) F.puntos = String(max);
    const listo = F.curso && F.juego && F.puesto && F.puntos !== '';
    const mias = D.cargas.filter(x => x.cargado_por === sesion.id).slice(0, 10);
    app().innerHTML = `
      ${barraSesion()}
      <section class="tarjeta">
        <h2>➕ Cargar puntos</h2>
        <h3 class="paso">1. Curso</h3>
        <div class="grilla-botones">${D.cursos.map(c => { const col = CIU[c.clave].colores; return `
          <button class="opcion curso-op ${F.curso === c.id ? 'sel' : ''}" data-curso="${c.id}" style="--c:${col.principal}">
            ${emblema(c.clave, 'emblema mini')}<span><b>${esc(c.nombre)}</b><small>${esc(c.ciudad)}</small></span></button>`; }).join('')}</div>
        <h3 class="paso">2. Juego</h3>
        <div class="grilla-botones">${D.juegos.filter(x => x.activo).map(g => {
          const prev = F.curso ? yaTiene(F.curso, g.id) : []; const hab = F.curso && habilitado(F.curso, g.id);
          const bloq = prev.length && !hab;
          return `<button class="opcion ${F.juego === g.id ? 'sel' : ''}" data-juego="${g.id}" ${bloq ? 'disabled' : ''}>
            <span><b>${esc(g.nombre)}</b><small>${prev.length ? (hab ? '✔ Otra carga habilitada' : `Ya tiene ${prev.reduce((s, x) => s + x.puntos, 0)} pts`) : `Hasta ${g.p1} pts`}</small></span></button>`;
        }).join('')}</div>
        <h3 class="paso">3. Puesto</h3>
        <div class="grilla-botones cuatro">${PUESTOS.map(([p, n]) => `
          <button class="opcion ${F.puesto === p ? 'sel' : ''}" data-puesto="${p}" ${j ? '' : 'disabled'}>
            <span><b>${n}</b><small>${j ? 'hasta ' + tope(j, p) + ' pts' : 'elegí el juego'}</small></span></button>`).join('')}</div>
        <div class="fila-campos">
          <label class="campo"><span>Puntos ${max != null ? `(máximo ${max})` : ''}</span>
            <input id="puntos" type="number" inputmode="numeric" min="0" ${max != null ? `max="${max}"` : 'disabled'} value="${esc(F.puntos)}"></label>
          <label class="campo"><span>Observación (opcional)</span><input id="obs" maxlength="140" value="${esc(F.obs)}" placeholder="Ej: ganaron en la final"></label>
        </div>
        <button class="btn grande" id="btn-cargar" ${listo ? '' : 'disabled'}>Cargar puntos</button>
      </section>
      <section class="tarjeta">
        <h2>Tus últimas cargas</h2>
        ${mias.length ? `<ul class="feed">${mias.map(x => itemCarga(x)).join('')}</ul>` : '<p class="vacio">Todavía no cargaste puntos.</p>'}
      </section>`;
    $('#salir2').onclick = salir;
    $$('[data-curso]').forEach(b => b.onclick = () => { F.curso = +b.dataset.curso; if (F.juego && yaTiene(F.curso, F.juego).length && !habilitado(F.curso, F.juego)) F.juego = null; vistaCargar(); });
    $$('[data-juego]').forEach(b => b.onclick = () => { F.juego = +b.dataset.juego; F.puntos = ''; vistaCargar(); });
    $$('[data-puesto]').forEach(b => b.onclick = () => { F.puesto = b.dataset.puesto; F.puntos = ''; vistaCargar(); });
    const ip = $('#puntos');
    ip.oninput = () => { F.puntos = ip.value; $('#btn-cargar').disabled = !(F.curso && F.juego && F.puesto && ip.value !== ''); };
    $('#obs').oninput = (e) => { F.obs = e.target.value; };
    $('#btn-cargar').onclick = async () => {
      const pts = parseInt(F.puntos, 10);
      if (isNaN(pts) || pts < 0 || pts > max) return toast(`Los puntos tienen que estar entre 0 y ${max}.`, 'error');
      const c = curso(F.curso);
      const ok = await confirmar('Confirmar carga',
        `¿Cargar <b>${pts} puntos</b> a <b>${esc(c.nombre)} – ${esc(c.ciudad)}</b> por <b>${esc(j.nombre)}</b> (${nombrePuesto(F.puesto)})?<br><small>Quedará registrado a nombre de ${esc(sesion.nombre)}.</small>`, 'Sí, cargar');
      if (!ok) return;
      try {
        await api.cargarPuntos(sesion.token, F.curso, F.juego, F.puesto, pts, F.obs);
        toast(`✔ ${pts} puntos cargados a ${c.nombre} (${c.ciudad})`);
        F = { curso: null, juego: null, puesto: null, puntos: '', obs: '' };
        await recargar(); vistaCargar(); window.scrollTo(0, 0);
      } catch (e) { manejarError(e); await recargar(); if (sesion) vistaCargar(); }
    };
    conectarAnular();
  }

  function puedeAnular(x) { return sesion && !x.anulada && (sesion.rol === 'admin' || x.cargado_por === sesion.id); }
  function itemCarga(x) {
    const c = curso(x.curso_id);
    return `<li class="${x.anulada ? 'anulada' : ''}">${emblema(c.clave, 'emblema mini')}
      <span class="crece"><b>${x.puntos} pts</b> · ${esc(c.nombre)} (${esc(c.ciudad)}) · ${esc(juego(x.juego_id).nombre)} · ${nombrePuesto(x.puesto)}
        <small>📅 ${fecha(x.creado_en)} · Cargó <b>${esc(x.cargado_por_nombre)}</b>${x.observacion ? ' · “' + esc(x.observacion) + '”' : ''}</small>
        ${x.anulada ? `<small class="motivo">❌ ANULADA por ${esc(x.anulada_por_nombre)} el ${fecha(x.anulada_en)}: ${esc(x.motivo_anulacion)}</small>` : ''}</span>
      ${puedeAnular(x) ? `<button class="btn mini peligro" data-anular="${x.id}">Anular</button>` : ''}</li>`;
  }
  function conectarAnular() {
    $$('[data-anular]').forEach(b => b.onclick = async () => {
      const id = +b.dataset.anular; const x = D.cargas.find(c => c.id === id); const c = curso(x.curso_id);
      const motivo = await pedirTexto('Anular carga', `Vas a anular ${x.puntos} pts de ${esc(c.nombre)} (${esc(juego(x.juego_id).nombre)}). Escribí el motivo:`, 'area', 'Anular');
      if (motivo === null) return;
      try { await api.anular(sesion.token, id, motivo); toast('Carga anulada. Queda registrada en el historial.'); await recargar(); render(); }
      catch (e) { manejarError(e); }
    });
  }

  /* ---------------------------------------------------------- HISTORIAL */
  let H = { curso: '', juego: '', usuario: '', estado: '' };
  function vistaHistorial() {
    setTema('general');
    const usuarios = [...new Set(D.cargas.map(x => x.cargado_por_nombre))].sort();
    const lista = D.cargas.filter(x => (!H.curso || x.curso_id === +H.curso) && (!H.juego || x.juego_id === +H.juego)
      && (!H.usuario || x.cargado_por_nombre === H.usuario) && (!H.estado || (H.estado === 'anuladas') === x.anulada));
    const sel = (id, label, opts, val) => `<label class="campo"><span>${label}</span><select id="${id}"><option value="">Todos</option>
      ${opts.map(([v, t]) => `<option value="${esc(v)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
    app().innerHTML = `
      ${sesion ? barraSesion() : ''}
      <section class="tarjeta">
        <h2>📋 Historial de cargas</h2>
        <p class="nota">Todas las cargas quedan registradas con quién las hizo y cuándo. Las anuladas no se borran: se muestran con el motivo.</p>
        <div class="filtros">
          ${sel('f-curso', 'Curso', D.cursos.map(c => [c.id, c.nombre + ' – ' + c.ciudad]), H.curso)}
          ${sel('f-juego', 'Juego', D.juegos.map(j => [j.id, j.nombre]), H.juego)}
          ${sel('f-usuario', 'Cargó', usuarios.map(u => [u, u]), H.usuario)}
          ${sel('f-estado', 'Estado', [['validas', 'Válidas'], ['anuladas', 'Anuladas']], H.estado)}
        </div>
        <p class="nota">${lista.length} carga(s)</p>
        ${lista.length ? `<ul class="feed">${lista.map(itemCarga).join('')}</ul>` : '<p class="vacio">No hay cargas con esos filtros.</p>'}
      </section>`;
    const s2 = $('#salir2'); if (s2) s2.onclick = salir;
    [['f-curso', 'curso'], ['f-juego', 'juego'], ['f-usuario', 'usuario'], ['f-estado', 'estado']].forEach(([id, k]) =>
      $('#' + id).onchange = (e) => { H[k] = e.target.value; vistaHistorial(); });
    conectarAnular();
  }

  /* ---------------------------------------------------------- ADMIN */
  let tabAdmin = 'usuarios';
  async function vistaAdmin() {
    if (!sesion) return vistaLogin('admin');
    setTema('general');
    if (sesion.rol !== 'admin') { app().innerHTML = barraSesion() + '<p class="vacio">Esta sección es solo para el administrador.</p>'; $('#salir2').onclick = salir; return; }
    const tabs = [['usuarios', '👥 Usuarios'], ['juegos', '🎯 Juegos y topes'], ['cursos', '🏙️ Cursos'], ['habilitar', '🔓 Habilitar carga'], ['registro', '🗒️ Registro']];
    app().innerHTML = `${barraSesion()}
      <nav class="tabs">${tabs.map(([k, n]) => `<button class="tab ${tabAdmin === k ? 'sel' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>
      <section class="tarjeta" id="admin-cuerpo"><p class="cargando">Cargando…</p></section>`;
    $('#salir2').onclick = salir;
    $$('[data-tab]').forEach(b => b.onclick = () => { tabAdmin = b.dataset.tab; vistaAdmin(); });
    const el = $('#admin-cuerpo');
    const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast(okMsg); await recargar(); vistaAdmin(); } catch (e) { manejarError(e); } };
    try {
      if (tabAdmin === 'usuarios') {
        const us = await api.adminUsuarios(sesion.token);
        const act = us.filter(u => u.rol === 'cargador' && u.activo).length;
        el.innerHTML = `<h2>Usuarios</h2>
          <p class="nota">Cargadores activos: <b>${act} de 6</b>. Solo estas personas pueden cargar puntos.</p>
          <ul class="lista-admin">${us.map(u => `<li class="${u.activo ? '' : 'inactivo'}">
            <span class="crece"><b>${esc(u.nombre)}</b> <small>@${esc(u.usuario)} · ${u.rol === 'admin' ? 'Administrador' : 'Cargador'}${u.activo ? '' : ' · DESACTIVADO'}</small></span>
            <button class="btn mini sec" data-clave="${u.id}" data-n="${esc(u.nombre)}">Cambiar contraseña</button>
            ${u.id !== sesion.id ? `<button class="btn mini ${u.activo ? 'peligro' : ''}" data-act="${u.id}" data-v="${u.activo ? 0 : 1}">${u.activo ? 'Desactivar' : 'Activar'}</button>` : ''}</li>`).join('')}</ul>
          <h3>Crear usuario</h3>
          <form id="f-nuevo" class="fila-campos">
            <label class="campo"><span>Nombre para mostrar</span><input name="n" required placeholder="Prof. Gómez"></label>
            <label class="campo"><span>Usuario</span><input name="u" required autocapitalize="none" placeholder="gomez"></label>
            <label class="campo"><span>Contraseña (mín. 6)</span><input name="c" required minlength="6" autocomplete="new-password"></label>
            <label class="campo"><span>Rol</span><select name="r"><option value="cargador">Cargador de puntos</option><option value="admin">Administrador</option></select></label>
            <button class="btn" type="submit">Crear</button>
          </form>`;
        $$('[data-clave]').forEach(b => b.onclick = async () => {
          const c = await pedirTexto('Cambiar contraseña', 'Nueva contraseña para ' + b.dataset.n + ' (mínimo 6 caracteres)', 'text', 'Guardar');
          if (c !== null) run(() => api.adminCambiarClave(sesion.token, b.dataset.clave, c), 'Contraseña cambiada');
        });
        $$('[data-act]').forEach(b => b.onclick = () => run(() => api.adminActivar(sesion.token, b.dataset.act, b.dataset.v === '1'), 'Usuario actualizado'));
        $('#f-nuevo').onsubmit = (e) => { e.preventDefault(); const f = e.target;
          run(() => api.adminCrearUsuario(sesion.token, f.u.value, f.n.value, f.c.value, f.r.value), 'Usuario creado'); };
      }
      if (tabAdmin === 'juegos') {
        const fila = (g) => `<form class="fila-juego" data-id="${g ? g.id : ''}">
            <input name="n" value="${g ? esc(g.nombre) : ''}" placeholder="Nombre del juego" required>
            <label>1°<input name="p1" type="number" min="0" value="${g ? g.p1 : 10}"></label>
            <label>2°<input name="p2" type="number" min="0" value="${g ? g.p2 : 7}"></label>
            <label>3°<input name="p3" type="number" min="0" value="${g ? g.p3 : 5}"></label>
            <label>Part.<input name="pp" type="number" min="0" value="${g ? g.participacion : 2}"></label>
            <label class="chk"><input name="a" type="checkbox" ${!g || g.activo ? 'checked' : ''}> Activo</label>
            <button class="btn mini" type="submit">${g ? 'Guardar' : 'Agregar'}</button></form>`;
        el.innerHTML = `<h2>Juegos y puntajes máximos</h2>
          <p class="nota">El tope de cada puesto es el máximo que se puede cargar. Así se evitan errores o cargas exageradas. Un juego desactivado deja de aparecer para cargar, pero sus puntos se conservan.</p>
          ${D.juegos.map(fila).join('')}<h3>Agregar juego</h3>${fila(null)}`;
        $$('.fila-juego').forEach(f => f.onsubmit = (e) => { e.preventDefault();
          const id = f.dataset.id ? +f.dataset.id : null; const n = (k) => parseInt(f[k].value, 10);
          run(() => api.adminGuardarJuego(sesion.token, id, f.n.value, n('p1'), n('p2'), n('p3'), n('pp'), f.a.checked), 'Juego guardado'); });
      }
      if (tabAdmin === 'cursos') {
        el.innerHTML = `<h2>Cursos y ciudades</h2><p class="nota">Podés cambiar el nombre del curso (por ejemplo “5° A”). La ciudad y su ambientación quedan fijas.</p>
          ${D.cursos.map(c => `<form class="fila-curso-adm" data-id="${c.id}">${emblema(c.clave, 'emblema mini')}<span class="ciu">${esc(c.ciudad)}</span>
            <input name="n" value="${esc(c.nombre)}" required><button class="btn mini" type="submit">Guardar</button></form>`).join('')}`;
        $$('.fila-curso-adm').forEach(f => f.onsubmit = (e) => { e.preventDefault(); run(() => api.adminRenombrarCurso(sesion.token, +f.dataset.id, f.n.value), 'Curso actualizado'); });
      }
      if (tabAdmin === 'habilitar') {
        const pend = D.habilitaciones.filter(h => !h.usada);
        el.innerHTML = `<h2>Habilitar otra carga</h2>
          <p class="nota">Un curso no puede recibir dos veces puntos por el mismo juego. Si de verdad corresponde (por ejemplo, un juego con dos rondas), habilitá una carga extra acá. Se usa una sola vez y queda registrado.</p>
          <form id="f-hab" class="fila-campos">
            <label class="campo"><span>Curso</span><select name="c">${D.cursos.map(c => `<option value="${c.id}">${esc(c.nombre)} – ${esc(c.ciudad)}</option>`).join('')}</select></label>
            <label class="campo"><span>Juego</span><select name="j">${D.juegos.map(j => `<option value="${j.id}">${esc(j.nombre)}</option>`).join('')}</select></label>
            <button class="btn" type="submit">Habilitar una carga más</button></form>
          <h3>Habilitaciones sin usar</h3>
          ${pend.length ? `<ul class="feed">${pend.map(h => `<li><span>${esc(curso(h.curso_id).nombre)} (${esc(curso(h.curso_id).ciudad)}) · ${esc(juego(h.juego_id).nombre)}<small>Habilitó ${esc(h.creada_por)} el ${fecha(h.creada_en)}</small></span></li>`).join('')}</ul>` : '<p class="vacio">No hay habilitaciones pendientes.</p>'}`;
        $('#f-hab').onsubmit = (e) => { e.preventDefault(); run(() => api.adminHabilitar(sesion.token, +e.target.c.value, +e.target.j.value), 'Carga extra habilitada'); };
      }
      if (tabAdmin === 'registro') {
        const r = await api.adminRegistro(sesion.token);
        el.innerHTML = `<h2>Registro de administración</h2><p class="nota">Cambios de usuarios, contraseñas, juegos y habilitaciones.</p>
          ${r.length ? `<ul class="feed">${r.map(x => `<li><span>${esc(x.accion)}<small>${esc(x.usuario)} · ${fecha(x.fecha)}</small></span></li>`).join('')}</ul>` : '<p class="vacio">Sin movimientos todavía.</p>'}`;
      }
    } catch (e) { el.innerHTML = '<p class="vacio">No se pudo cargar esta sección.</p>'; manejarError(e); }
  }

  /* ============================================================ ROUTER */
  function ruta() { return (location.hash.replace(/^#\/?/, '') || '').split('/'); }
  function render() {
    const [r, p] = ruta();
    $$('#nav a').forEach(a => a.classList.toggle('activo', a.dataset.ruta === (r || 'inicio') || (r === 'curso' && a.dataset.ruta === 'inicio')));
    if (r === 'curso') vistaCurso(p);
    else if (r === 'cargar') vistaCargar();
    else if (r === 'historial') vistaHistorial();
    else if (r === 'admin') vistaAdmin();
    else vistaInicio();
  }
  const refrescable = () => ['', 'curso', 'historial'].includes(ruta()[0]) && $('#modal').hidden;
  async function refrescar() { await recargar(); if (refrescable()) render(); }

  async function iniciar() {
    $('#titulo').textContent = CFG.TITULO || 'Estudiantina';
    $('#escuela').textContent = CFG.ESCUELA || '';
    document.title = (CFG.TITULO || 'Estudiantina') + ' · Puntajes';
    $('#aviso-demo').hidden = api.modo !== 'demo';
    pintarSesion();
    await recargar();
    window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
    render();
    api.suscribir(() => refrescar());
    setInterval(refrescar, 15000);
  }
  iniciar();
})();
