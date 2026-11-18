# Duelo diario

PWA privada para dos personas: misiones diarias con puntos, rachas con multiplicador, marcador VS en directo, validación anti-trampas, avatar y (próximamente) tienda de accesorios.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind 4 + Drizzle ORM sobre Postgres (Supabase en producción, PGlite en local).

## Estado por fases

| Fase | Qué incluye | Estado |
| --- | --- | --- |
| 1 | Diseño y mockups (dirección "Pop Caramelo") | Hecha |
| 2 | Login, misiones, puntos, rachas, validación, pasos manuales | Hecha |
| 3 | Clasificación, ganador semanal, apuesta por semana, 24 logros, estadísticas | Hecha |
| 4 | Avatar 3D personalizable, tienda con 32 objetos y rarezas, vestidor | Hecha |
| 5 | Pulido, notificaciones push, PWA instalable, pasos por Atajo, despliegue | Hecha |

## Arrancar en local

Necesitas Node 20 o superior.

```bash
npm install
cp users.config.example.json users.config.json   # edita usuarios y contraseñas
echo "SESSION_SECRET=$(openssl rand -base64 48)" > .env.local
npm run users      # crea las 2 cuentas (y misiones de ejemplo la primera vez)
npm run dev        # http://localhost:3000
```

Sin `DATABASE_URL` se usa PGlite, un Postgres embebido que guarda los datos en `.data/`. Para empezar de cero, borra esa carpeta.

## Cambiar usuarios y contraseñas

Solo existen 2 cuentas y no hay registro público. Hay dos formas de gestionarlas:

1. **Archivo de configuración.** Edita `users.config.json` (no se sube a git) y ejecuta `npm run users`. Las contraseñas se guardan solo como hash bcrypt (coste 12). Si quitas el campo `password`, esa contraseña no cambia. Debe haber exactamente 2 usuarios.
2. **Panel de admin.** Entra con la cuenta `"role": "admin"` y ve a Ajustes → Cuentas.

Cambiar una contraseña cierra la sesión de esa cuenta en todos los móviles. Si no, la sesión dura 180 días (cookie httpOnly firmada), así que no hace falta volver a entrar cada día.

## Reglas del juego

- **Puntos de ranking y monedas van separados.** Cada misión da los mismos puntos y monedas; gastar monedas en la tienda nunca resta puntos de ranking.
- **Rachas:** días seguidos con al menos una misión hecha. Multiplicador: 3 días x1.1, 7 días x1.25, 14 días x1.5, 30 días x2 (en `src/lib/domain/streak.ts`).
- **Frecuencias:** cada día, días concretos de la semana, o N veces por semana.
- **Validación:** si una misión la tiene activada, queda "Por validar" y no suma hasta que la otra persona la apruebe.
- **Retos semanales:** pagan todos sus puntos al completar las N veces de la semana (sin multiplicador).
- **Medianoche:** todo se calcula con la fecha de Europe/Madrid, así que las misiones se reinician solas a las 00:00 sin tareas programadas.

## Ranking y logros

- Clasificación de hoy, semana, mes e histórico (solo cuentan misiones aprobadas).
- Cada semana (lunes a domingo, hora de Madrid) se cierra sola: gana quien más puntos tenga; empate si igualan. La apuesta se guarda por semana desde Ajustes y aparece en el resultado.
- 24 logros en bronce, plata, oro y diamante (misiones, rachas, puntos, semanas ganadas, días perfectos, retos, validaciones, categorías, pasos). Se calculan del historial, no hay que guardarlos. La lista está en `src/lib/domain/achievements.ts`.
- Estadísticas: puntos por día, semana y mes, por categoría, e historial reciente.

Para probar con datos inventados en local: `npm run demo` (se niega a correr si hay `DATABASE_URL`).

## Avatar 3D y tienda

- Muñeco chibi en 3D (Three.js con React Three Fiber) hecho solo con formas básicas: sin modelos externos ni licencias de terceros, y pesa poco. Se gira arrastrando, respira y parpadea, salta y gira al completar una misión, y se pone triste si a las 20:00 no has hecho nada.
- **Vestidor → Aspecto** (gratis): piel, peinado, color de pelo, ojos y camiseta básica.
- **Tienda:** 32 objetos en 7 huecos (sombreros, gafas, ropa, mascotas, escenarios, poses, efectos) con rareza común (60), rara (180), épica (450) y legendaria (1.200). Puedes probártelos antes de comprar.
- Comprar gasta monedas, nunca puntos de ranking. El catálogo está en `src/lib/domain/shop.ts`: para añadir un objeto basta con una línea nueva.
- Si un móvil no tiene WebGL, se muestra el muñeco 2D.

## Pasos (Apple Health)

Se pueden apuntar a mano desde la tarjeta de pasos, o enviarlos solos cada noche con un Atajo de iOS:

1. En la app, **Ajustes → Pasos automáticos** te da la dirección (`https://tu-app/api/steps`) y tu token personal.
2. En el iPhone: Atajos → Automatización → Hora del día (por ejemplo 23:30, diariamente, sin preguntar).
3. Acciones: «Buscar muestras de salud» (Pasos, desde hoy) → «Calcular estadísticas» (suma) → «Obtener contenido de URL» con método POST, cabecera `Authorization: Bearer <token>` y cuerpo JSON `{"steps": <suma>}`.

El endpoint acepta también el número como texto ("10.450" o "10450,0"). Si el token se filtra, genera otro en Ajustes y el viejo deja de valer. En Android no hay forma fiable de leer los pasos desde una web (la API de Google Fit se está cerrando), así que allí siguen siendo manuales.

## Notificaciones

- **Recordatorios** a las horas que elija cada persona (09, 13, 18, 20 o 22 h, hora de Madrid) si le quedan misiones, con un texto que pica según el marcador y la racha.
- **Avisos de la pareja**: cuando la otra persona suma puntos (se puede apagar) y cuando pide que valides una misión (siempre).
- Se activan en cada móvil desde **Ajustes → Avisos**. En iPhone solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4 o superior).

Para que funcionen hacen falta estas variables (mira `.env.example`):

```bash
npx web-push generate-vapid-keys   # da la clave pública y la privada
openssl rand -hex 32               # para CRON_SECRET
```

Los recordatorios los dispara un cron que llama a `POST /api/cron/reminders` con `Authorization: Bearer $CRON_SECRET`:

- **GitHub Actions** (`.github/workflows/reminders.yml`, recomendado): se ejecuta cada hora. Añade en el repo los secretos `APP_URL` (por ejemplo `https://duelo.vercel.app`) y `CRON_SECRET`. GitHub puede retrasarlo unos minutos.
- **Vercel Cron** (`vercel.json`): el plan gratuito solo permite uno al día; está a las 19:00 UTC, que son las 20:00 en invierno y las 21:00 en verano. Sirve de respaldo si no usas GitHub Actions.

## Instalar como app

- **iPhone (Safari):** Compartir → «Añadir a pantalla de inicio».
- **Android (Chrome):** menú ⋮ → «Instalar aplicación», o el botón de **Ajustes → Instalar la app**.

Sin conexión se muestra una pantalla de aviso en vez de un error.

## Tiempo real

La pantalla Hoy se refresca cada 5 segundos mientras está visible y al volver a la app, así que los puntos de la pareja aparecen casi al momento. Para dos personas es suficiente y no necesita configurar nada más; además llega un aviso push cuando la pareja suma.

## Tests

```bash
npm test          # lógica de fechas, rachas, puntos, monedas, misiones, ranking, tienda y avisos
npm run typecheck
npm run lint
```

GitHub Actions ejecuta el typecheck y los tests en cada push y PR (`.github/workflows/ci.yml`).

## Desplegar (Vercel + Supabase, gratis)

1. **Supabase:** crea un proyecto (región Europa, por ejemplo Frankfurt). En *Connect → Transaction pooler* copia la cadena de conexión (puerto 6543) y pon tu contraseña de la base de datos.
2. **Vercel:** *Add New → Project*, importa `duelo-diario` y añade en *Environment Variables*:
   - `DATABASE_URL`: la cadena de Supabase.
   - `SESSION_SECRET`: `openssl rand -base64 48`.
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (por ejemplo `mailto:tu-correo`).
   - `CRON_SECRET`.
   Despliega. Las migraciones de `drizzle/` se aplican solas la primera vez que arranca.
3. **Cuentas:** desde tu ordenador, con `users.config.json` relleno: `DATABASE_URL="postgres://..." npm run users`. Crea las dos cuentas y las misiones de ejemplo.
4. **Recordatorios:** en GitHub, *Settings → Secrets and variables → Actions*, añade `APP_URL` y `CRON_SECRET`.
5. Abrid la URL en los dos móviles, instaladla, entrad y activad los avisos en Ajustes.

Si cambias la clave VAPID, cada móvil tiene que volver a activar los avisos.
