# Duelo diario

PWA privada para dos personas: misiones diarias con puntos, rachas con multiplicador, marcador VS en directo, validación anti-trampas, avatar y (próximamente) tienda de accesorios.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind 4 + Drizzle ORM sobre Postgres (Supabase en producción, PGlite en local).

## Estado por fases

| Fase | Qué incluye | Estado |
| --- | --- | --- |
| 1 | Diseño y mockups (dirección "Pop Caramelo") | Hecha |
| 2 | Login, misiones, puntos, rachas, validación, pasos manuales | Hecha |
| 3 | Clasificación, ganador semanal, apuesta por semana, 24 logros, estadísticas | Hecha |
| 4 | Avatar 3D (React Three Fiber) y tienda | Pendiente |
| 5 | Pulido, notificaciones push, PWA instalable, despliegue | Pendiente |

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

## Pasos (Apple Health / Google Fit)

Ahora se apuntan a mano desde la tarjeta de pasos. Una web no puede leer Apple Health directamente, así que en la fase 5 se añadirá el endpoint `/api/steps` con un token por persona para que un Atajo de iOS envíe los pasos automáticamente. La API de Google Fit está cerrándose, así que en Android seguirán siendo manuales.

## Tiempo real

La pantalla Hoy se refresca cada 5 segundos mientras está visible y al volver a la app, así que los puntos de la pareja aparecen casi al momento. En la fase 5 se puede cambiar a Supabase Realtime.

## Tests

```bash
npm test          # lógica de fechas, rachas, puntos, monedas y misiones
npm run typecheck
npm run lint
```

## Desplegar (Vercel + Supabase, gratis)

1. Crea un proyecto en Supabase y copia la cadena de conexión del *Transaction pooler* (puerto 6543).
2. Importa el repo en Vercel y añade las variables `DATABASE_URL` y `SESSION_SECRET` (mira `.env.example`).
3. Las migraciones de `drizzle/` se aplican solas al arrancar. Desde tu ordenador, crea las cuentas contra esa base de datos: `DATABASE_URL=... npm run users`.

Más detalle en la fase 5.
