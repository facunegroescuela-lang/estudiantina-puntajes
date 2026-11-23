-- =====================================================================
--  ESTUDIANTINA - Base de datos (Supabase)
--  Pegar TODO este archivo en Supabase > SQL Editor > New query > Run
--  Se puede volver a ejecutar sin perder datos.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- TABLAS
create table if not exists public.cursos (
  id          serial primary key,
  clave       text unique not null,          -- newyork, paris, ...
  nombre      text not null,                 -- "1° año"
  ciudad      text not null,
  orden       int  not null default 0
);

create table if not exists public.juegos (
  id            serial primary key,
  nombre        text unique not null,
  p1            int not null default 10 check (p1 >= 0),   -- tope 1° puesto
  p2            int not null default 7  check (p2 >= 0),   -- tope 2° puesto
  p3            int not null default 5  check (p3 >= 0),   -- tope 3° puesto
  participacion int not null default 2  check (participacion >= 0),
  activo        boolean not null default true,
  orden         int not null default 0
);

create table if not exists public.usuarios (
  id         uuid primary key default gen_random_uuid(),
  usuario    text unique not null,
  nombre     text not null,
  pass_hash  text not null,
  rol        text not null check (rol in ('cargador','admin')),
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

create table if not exists public.sesiones (
  token      uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  expira     timestamptz not null default now() + interval '12 hours'
);

create table if not exists public.cargas (
  id                  bigserial primary key,
  curso_id            int  not null references public.cursos(id),
  juego_id            int  not null references public.juegos(id),
  puesto              text not null check (puesto in ('1','2','3','P')),
  puntos              int  not null check (puntos >= 0),
  observacion         text,
  cargado_por         uuid not null references public.usuarios(id),
  cargado_por_nombre  text not null,
  creado_en           timestamptz not null default now(),
  anulada             boolean not null default false,
  anulada_por_nombre  text,
  anulada_en          timestamptz,
  motivo_anulacion    text
);

-- Permisos especiales: el admin habilita que un curso reciba otra carga en el mismo juego
create table if not exists public.habilitaciones (
  id          bigserial primary key,
  curso_id    int not null references public.cursos(id),
  juego_id    int not null references public.juegos(id),
  usada       boolean not null default false,
  creada_por  text not null,
  creada_en   timestamptz not null default now()
);

-- Registro de acciones de administración
create table if not exists public.registro (
  id        bigserial primary key,
  fecha     timestamptz not null default now(),
  usuario   text not null,
  accion    text not null
);

-- ---------------------------------------------------------- DATOS INICIALES
insert into public.cursos (clave, nombre, ciudad, orden) values
  ('newyork',     '1° año', 'New York',       1),
  ('paris',       '2° año', 'París',          2),
  ('barcelona',   '3° año', 'Barcelona',      3),
  ('buenosaires', '4° año', 'Buenos Aires',   4),
  ('cancun',      '5° año', 'Cancún',         5),
  ('rio',         '6° año', 'Río de Janeiro', 6)
on conflict (clave) do nothing;

insert into public.juegos (nombre, orden) values
  ('Esponja humana', 1), ('Globo viajero', 2), ('Encuentra la moneda', 3),
  ('Derriba los vasos', 4), ('Carrera de carretillas', 5), ('Globo sorpresa', 6)
on conflict (nombre) do nothing;

-- Administrador inicial  (usuario: admin / contraseña: cambiar123)
-- ¡Cambiá la contraseña apenas entres, desde la sección Administración!
insert into public.usuarios (usuario, nombre, pass_hash, rol)
values ('admin', 'Administrador', extensions.crypt('cambiar123', extensions.gen_salt('bf')), 'admin')
on conflict (usuario) do nothing;

-- ------------------------------------------------- SEGURIDAD (RLS)
-- Todo bloqueado por defecto. El público solo puede LEER lo que se muestra.
alter table public.cursos         enable row level security;
alter table public.juegos         enable row level security;
alter table public.usuarios       enable row level security;
alter table public.sesiones       enable row level security;
alter table public.cargas         enable row level security;
alter table public.habilitaciones enable row level security;
alter table public.registro       enable row level security;

revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on public.usuarios, public.sesiones, public.registro from anon, authenticated;

drop policy if exists leer_cursos on public.cursos;
create policy leer_cursos on public.cursos for select to anon, authenticated using (true);
drop policy if exists leer_juegos on public.juegos;
create policy leer_juegos on public.juegos for select to anon, authenticated using (true);
drop policy if exists leer_cargas on public.cargas;
create policy leer_cargas on public.cargas for select to anon, authenticated using (true);
drop policy if exists leer_habilitaciones on public.habilitaciones;
create policy leer_habilitaciones on public.habilitaciones for select to anon, authenticated using (true);

grant select on public.cursos, public.juegos, public.cargas, public.habilitaciones to anon, authenticated;

-- -------------------------------------------------------------- FUNCIONES
-- Las únicas formas de escribir datos son estas funciones, que controlan
-- la contraseña, el rol, los topes de puntos y las cargas repetidas.

create or replace function public._sesion(p_token uuid)
returns public.usuarios language plpgsql security definer set search_path = public as $$
declare u public.usuarios;
begin
  select us.* into u from public.sesiones s join public.usuarios us on us.id = s.usuario_id
   where s.token = p_token and s.expira > now() and us.activo;
  if not found then raise exception 'Tu sesión venció. Volvé a iniciar sesión.'; end if;
  return u;
end $$;

create or replace function public._admin(p_token uuid)
returns public.usuarios language plpgsql security definer set search_path = public as $$
declare u public.usuarios;
begin
  u := public._sesion(p_token);
  if u.rol <> 'admin' then raise exception 'Solo el administrador puede hacer esto.'; end if;
  return u;
end $$;

revoke execute on function public._sesion(uuid), public._admin(uuid) from public, anon, authenticated;

create or replace function public.iniciar_sesion(p_usuario text, p_clave text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u public.usuarios; t uuid;
begin
  select * into u from public.usuarios where lower(usuario) = lower(trim(p_usuario)) and activo;
  if not found or u.pass_hash <> extensions.crypt(p_clave, u.pass_hash) then
    perform pg_sleep(1);  -- frena a quien quiera adivinar contraseñas
    raise exception 'Usuario o contraseña incorrectos.';
  end if;
  delete from public.sesiones where expira < now();
  insert into public.sesiones (usuario_id) values (u.id) returning token into t;
  return json_build_object('token', t, 'id', u.id, 'nombre', u.nombre, 'rol', u.rol, 'usuario', u.usuario);
end $$;

create or replace function public.cerrar_sesion(p_token uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.sesiones where token = p_token;
$$;

create or replace function public.cargar_puntos(p_token uuid, p_curso int, p_juego int,
                                                p_puesto text, p_puntos int, p_observacion text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare u public.usuarios; j public.juegos; tope int; previas int; hab bigint; nuevo bigint;
begin
  u := public._sesion(p_token);
  select * into j from public.juegos where id = p_juego and activo;
  if not found then raise exception 'Ese juego no existe o está desactivado.'; end if;
  if not exists (select 1 from public.cursos where id = p_curso) then raise exception 'Ese curso no existe.'; end if;

  tope := case p_puesto when '1' then j.p1 when '2' then j.p2 when '3' then j.p3 when 'P' then j.participacion end;
  if tope is null then raise exception 'Puesto inválido.'; end if;
  if p_puntos is null or p_puntos < 0 or p_puntos > tope then
    raise exception 'Para ese puesto se pueden cargar como máximo % puntos.', tope;
  end if;

  -- un curso no puede sumar dos veces en el mismo juego (salvo habilitación del admin)
  perform pg_advisory_xact_lock(p_curso * 100000 + p_juego);
  select count(*) into previas from public.cargas
   where curso_id = p_curso and juego_id = p_juego and not anulada;
  if previas > 0 then
    select id into hab from public.habilitaciones
     where curso_id = p_curso and juego_id = p_juego and not usada order by id limit 1;
    if hab is null then
      raise exception 'Este curso ya tiene puntos en este juego. Si corresponde otra carga, el administrador tiene que habilitarla.';
    end if;
    update public.habilitaciones set usada = true where id = hab;
  end if;

  insert into public.cargas (curso_id, juego_id, puesto, puntos, observacion, cargado_por, cargado_por_nombre)
  values (p_curso, p_juego, p_puesto, p_puntos, nullif(trim(p_observacion), ''), u.id, u.nombre)
  returning id into nuevo;
  return nuevo;
end $$;

create or replace function public.anular_carga(p_token uuid, p_carga bigint, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare u public.usuarios; c public.cargas;
begin
  u := public._sesion(p_token);
  if coalesce(trim(p_motivo), '') = '' then raise exception 'Escribí el motivo de la anulación.'; end if;
  select * into c from public.cargas where id = p_carga for update;
  if not found then raise exception 'Esa carga no existe.'; end if;
  if c.anulada then raise exception 'Esa carga ya estaba anulada.'; end if;
  if u.rol <> 'admin' and c.cargado_por <> u.id then
    raise exception 'Solo podés anular cargas hechas por vos. Pedíselo al administrador.';
  end if;
  update public.cargas set anulada = true, anulada_por_nombre = u.nombre, anulada_en = now(),
         motivo_anulacion = trim(p_motivo) where id = p_carga;
end $$;

-- ---------- administración
create or replace function public.admin_usuarios(p_token uuid)
returns table (id uuid, usuario text, nombre text, rol text, activo boolean)
language plpgsql security definer set search_path = public as $$
begin
  perform public._admin(p_token);
  return query select x.id, x.usuario, x.nombre, x.rol, x.activo from public.usuarios x order by x.rol desc, x.nombre;
end $$;

create or replace function public.admin_crear_usuario(p_token uuid, p_usuario text, p_nombre text, p_clave text, p_rol text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare a public.usuarios;
begin
  a := public._admin(p_token);
  if p_rol not in ('cargador','admin') then raise exception 'Rol inválido.'; end if;
  if length(coalesce(p_clave,'')) < 6 then raise exception 'La contraseña tiene que tener al menos 6 caracteres.'; end if;
  if coalesce(trim(p_usuario),'') = '' or coalesce(trim(p_nombre),'') = '' then raise exception 'Completá usuario y nombre.'; end if;
  if p_rol = 'cargador' and (select count(*) from public.usuarios where rol = 'cargador' and activo) >= 6 then
    raise exception 'Ya hay 6 cargadores activos. Desactivá uno antes de crear otro.';
  end if;
  if exists (select 1 from public.usuarios where lower(usuario) = lower(trim(p_usuario))) then
    raise exception 'Ese nombre de usuario ya existe.';
  end if;
  insert into public.usuarios (usuario, nombre, pass_hash, rol)
  values (lower(trim(p_usuario)), trim(p_nombre), extensions.crypt(p_clave, extensions.gen_salt('bf')), p_rol);
  insert into public.registro (usuario, accion) values (a.nombre, 'Creó el usuario ' || trim(p_nombre) || ' (' || p_rol || ')');
end $$;

create or replace function public.admin_cambiar_clave(p_token uuid, p_id uuid, p_clave text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare a public.usuarios; n text;
begin
  a := public._admin(p_token);
  if length(coalesce(p_clave,'')) < 6 then raise exception 'La contraseña tiene que tener al menos 6 caracteres.'; end if;
  update public.usuarios set pass_hash = extensions.crypt(p_clave, extensions.gen_salt('bf')) where id = p_id returning nombre into n;
  if n is null then raise exception 'Usuario no encontrado.'; end if;
  delete from public.sesiones where usuario_id = p_id and p_id <> a.id;
  insert into public.registro (usuario, accion) values (a.nombre, 'Cambió la contraseña de ' || n);
end $$;

create or replace function public.admin_activar_usuario(p_token uuid, p_id uuid, p_activo boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a public.usuarios; u public.usuarios;
begin
  a := public._admin(p_token);
  if p_id = a.id then raise exception 'No podés desactivarte a vos mismo.'; end if;
  select * into u from public.usuarios where id = p_id;
  if not found then raise exception 'Usuario no encontrado.'; end if;
  if p_activo and u.rol = 'cargador' and not u.activo
     and (select count(*) from public.usuarios where rol = 'cargador' and activo) >= 6 then
    raise exception 'Ya hay 6 cargadores activos.';
  end if;
  update public.usuarios set activo = p_activo where id = p_id;
  if not p_activo then delete from public.sesiones where usuario_id = p_id; end if;
  insert into public.registro (usuario, accion)
  values (a.nombre, case when p_activo then 'Activó a ' else 'Desactivó a ' end || u.nombre);
end $$;

create or replace function public.admin_guardar_juego(p_token uuid, p_id int, p_nombre text,
                                                      p_p1 int, p_p2 int, p_p3 int, p_part int, p_activo boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a public.usuarios;
begin
  a := public._admin(p_token);
  if coalesce(trim(p_nombre),'') = '' then raise exception 'Escribí el nombre del juego.'; end if;
  if least(p_p1, p_p2, p_p3, p_part) < 0 or p_p1 > 1000 then raise exception 'Puntajes inválidos.'; end if;
  if p_id is null then
    insert into public.juegos (nombre, p1, p2, p3, participacion, activo, orden)
    values (trim(p_nombre), p_p1, p_p2, p_p3, p_part, coalesce(p_activo, true),
            (select coalesce(max(orden),0)+1 from public.juegos));
    insert into public.registro (usuario, accion) values (a.nombre, 'Agregó el juego ' || trim(p_nombre));
  else
    update public.juegos set nombre = trim(p_nombre), p1 = p_p1, p2 = p_p2, p3 = p_p3,
           participacion = p_part, activo = p_activo where id = p_id;
    insert into public.registro (usuario, accion)
    values (a.nombre, format('Modificó el juego %s (topes %s/%s/%s/%s, %s)', trim(p_nombre), p_p1, p_p2, p_p3, p_part,
                             case when p_activo then 'activo' else 'desactivado' end));
  end if;
end $$;

create or replace function public.admin_renombrar_curso(p_token uuid, p_id int, p_nombre text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.usuarios;
begin
  a := public._admin(p_token);
  if coalesce(trim(p_nombre),'') = '' then raise exception 'Escribí el nombre del curso.'; end if;
  update public.cursos set nombre = trim(p_nombre) where id = p_id;
  insert into public.registro (usuario, accion)
  values (a.nombre, 'Renombró el curso de ' || (select ciudad from public.cursos where id = p_id) || ' a ' || trim(p_nombre));
end $$;

create or replace function public.admin_habilitar(p_token uuid, p_curso int, p_juego int)
returns void language plpgsql security definer set search_path = public as $$
declare a public.usuarios;
begin
  a := public._admin(p_token);
  insert into public.habilitaciones (curso_id, juego_id, creada_por) values (p_curso, p_juego, a.nombre);
  insert into public.registro (usuario, accion)
  values (a.nombre, 'Habilitó otra carga para ' || (select nombre || ' (' || ciudad || ')' from public.cursos where id = p_curso)
                    || ' en ' || (select nombre from public.juegos where id = p_juego));
end $$;

create or replace function public.admin_registro(p_token uuid)
returns setof public.registro language plpgsql security definer set search_path = public as $$
begin
  perform public._admin(p_token);
  return query select * from public.registro order by fecha desc limit 200;
end $$;

-- --------------------------------------------------------------- PERMISOS
grant usage on schema public to anon, authenticated;
grant execute on function public.iniciar_sesion(text, text), public.cerrar_sesion(uuid),
  public.cargar_puntos(uuid, int, int, text, int, text), public.anular_carga(uuid, bigint, text),
  public.admin_usuarios(uuid), public.admin_crear_usuario(uuid, text, text, text, text),
  public.admin_cambiar_clave(uuid, uuid, text), public.admin_activar_usuario(uuid, uuid, boolean),
  public.admin_guardar_juego(uuid, int, text, int, int, int, int, boolean), public.admin_renombrar_curso(uuid, int, text),
  public.admin_habilitar(uuid, int, int), public.admin_registro(uuid)
to anon, authenticated;

-- --------------------------------------------------------------- TIEMPO REAL
do $$ begin
  alter publication supabase_realtime add table public.cargas;
exception when others then null; end $$;
