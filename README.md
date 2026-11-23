# Estudiantina · Sistema de puntajes

Página web para registrar y mostrar los puntajes de la Estudiantina. Cada curso representa una ciudad (New York, París, Barcelona, Buenos Aires, Cancún y Río de Janeiro).

- **Página publicada:** https://contadorpuntosmaxi.netlify.app
- **Base de datos:** Supabase (los puntos y los usuarios se guardan ahí)

## Qué hay en este repositorio

| Archivo | Qué es |
|---|---|
| `index.html`, `styles.css`, `app.js`, `ciudades.js` | La página web |
| `config.js` | Dirección y clave pública de Supabase (conecta la página con la base de datos) |
| `supabase_setup.sql` | Estructura de la base de datos: tablas, reglas de seguridad y funciones |
| `netlify.toml` | Configuración de Netlify |
| `Estudiantina_que_es_y_por_que.pdf` | Explicación para profesores y directivos |
| `Estudiantina_guia_de_instalacion.pdf` | Guía de instalación |

## Cómo funciona

```
GitHub (código)  ──►  Netlify (publica la página)  ──►  los celulares
                                                        │
                                Supabase (guarda puntos y usuarios)
```

Cada vez que se cambia un archivo en GitHub, Netlify vuelve a publicar la página sola, en menos de un minuto.

## Recrear la base de datos desde cero

1. Crear un proyecto en supabase.com.
2. SQL Editor → New query → pegar `supabase_setup.sql` → Run.
3. Copiar la Project URL y la Publishable key en `config.js`.

## Seguridad

- La clave de `config.js` es la **publishable** (pública): está hecha para ir en la página.
- Las reglas de seguridad están en la base de datos: solo 6 cargadores con contraseña pueden sumar puntos, con topes por juego y sin cargas repetidas.
- La clave **secret / service_role** de Supabase NUNCA se sube a este repositorio.

Proyecto escolar · Instituto Contardo Ferrini
