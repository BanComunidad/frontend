# Spec técnica — Frontend BanComunidad (SvelteKit + BFF)

- **Fecha:** 2026-09-11
- **Alcance de esta spec:** **Iteración 1 — vista del CLIENTE (apoderado / usuario normal)**. Las rutas y vistas de `/admin` quedan para la **iteración 2** (fuera de alcance aquí).
- **Backend:** repo hermano `Koin/backend` (Go). Contratos en `Koin/backend/scripts/api/endpoints.md`.

---

## 1. Objetivo
Dashboard web para que un apoderado inicie sesión (por **email**) y vea, por comunidad, las **cuentas, saldos, movimientos, cartolas y apoderados** — leyendo del espejo local del backend (costo $0, sin tocar el banco). Un usuario puede pertenecer a **varias comunidades** y cambiar entre ellas.

## 2. Stack
| Área | Elección |
|---|---|
| Framework | **SvelteKit** (Svelte 5 / runes) + **TypeScript** |
| Adapter | **`@sveltejs/adapter-node`** (server propio; se auto-hostea junto al Go en AWS) |
| Estilos | **Tailwind CSS** + primitivas accesibles (`bits-ui` / shadcn-svelte) — set mínimo |
| Datos | `load` server-side + **form actions** (nada de fetch directo del browser al Go) |
| Validación | **zod** (formulario de login) |
| Formato dinero | `Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP' })` (montos = entero CLP, sin decimales) |
| Gráficos (opcional it.1) | LayerChart o SVG propio para saldo/movimientos |
| Tests | Vitest (unit) + Playwright (e2e, smoke) |

## 3. Arquitectura — patrón BFF (Backend For Frontend)
**El browser nunca habla con la API Go directamente.** Habla solo con el server de SvelteKit (mismo origen), y SvelteKit reenvía server-to-server al Go.

```
Browser ──cookie httpOnly (JWT)──▶ SvelteKit (Node, adapter-node)
                                     │  Authorization: Bearer <jwt>  (server-to-server)
                                     ▼
                                Go API (Koin/backend)  ──▶ Postgres (espejo)
```

Por qué BFF:
- **Sin CORS** (el browser solo pega a su propio origen). El Go no necesita cambios.
- **El JWT vive en una cookie `httpOnly`, `Secure`, `SameSite=Lax`** puesta por SvelteKit → **nunca** accesible desde JS del cliente (mitiga robo de token por XSS).
- Un único punto (el server SvelteKit) inyecta el `Bearer`, mapea errores y maneja 401.

## 4. Sesión y "comunidad activa"
El JWT del backend está **scopeado a UNA comunidad** (mono-comunidad). El usuario tiene varias → el BFF gestiona la comunidad activa así:

**Login (una sola entrada de credenciales):**
1. `POST /api/auth/login {email,password}` (sin comunidad) → valida credenciales y devuelve `memberships[]` (con `legal_name`, `rut`, `role`).
2. Elegir comunidad por defecto: cookie `last_community` si existe, si no `memberships[0]`.
3. `POST /api/auth/login {email,password,community_id}` → `token` (scopeado). El password **solo** se usa dentro de esta request; nunca se persiste.
4. Guardar `token` en cookie `session` (httpOnly). Redirigir a `/`.

**Cambiar de comunidad (sin re-loguear):** `POST /api/auth/select-community {community_id}` (usa el `Bearer` de la cookie) → nuevo `token` → reemplaza `session` + setea `last_community`.

**Logout:** `POST /api/auth/logout` → limpia cookies.

**Comunidad activa** = la del JWT. En `hooks.server.ts` se **decodifica el payload** del JWT (base64, sin verificar firma — el Go la verifica en cada llamada) para exponer `locals.session = { userId, communityId, role, platformRole }` a las páginas. Las vistas scopeadas (accounts/attorneys) usan `locals.session.communityId`.

**Expiración:** el JWT dura 12h; al expirar el Go responde 401 → el BFF limpia la cookie y redirige a `/login` (no hay refresh token). Documentar como re-login.

## 5. Estructura del proyecto (SvelteKit)
```
src/
  hooks.server.ts                 # lee cookie 'session', decodifica claims -> locals.session; guarda protegidas
  lib/
    server/
      api.ts                      # apiFetch(event, path, init): base URL + Bearer + manejo 401/errores
      session.ts                  # get/set/clear cookies; decode JWT payload
    types.ts                      # tipos TS de los contratos (ver §8)
    format.ts                     # money(CLP), fecha, rut
    components/                   # AppShell, CommunitySwitcher, AccountCard, MovementsTable, Money, EmptyState, ErrorBanner
  routes/
    +layout.svelte                # AppShell (topbar con switcher + menú usuario)
    +layout.server.ts             # carga base: locals.session + GET /api/communities (para el switcher)
    login/
      +page.svelte                # form email + password
      +page.server.ts             # action: login (BFF, §4)
    (app)/                        # grupo protegido (redirige a /login si no hay sesión)
      +layout.server.ts           # guard: exige locals.session
      +page.svelte                # DASHBOARD comunidad activa (cuentas + resumen)
      +page.server.ts             # load: accounts de la comunidad activa + último saldo por cuenta
      comunidades/
        +page.svelte              # lista TODAS las comunidades del usuario (con rol)
        +page.server.ts           # load: GET /api/communities
      cuentas/[accountId]/
        +page.svelte              # detalle de cuenta: saldo + movimientos (paginado)
        +page.server.ts           # load: balance + movements(from,to,page)
        cartolas/
          +page.svelte            # lista de cartolas de la cuenta
          +page.server.ts         # load: GET .../statements
      apoderados/
        +page.svelte              # apoderados de la comunidad activa
        +page.server.ts           # load: GET /api/communities/{cid}/attorneys
  routes/actions/
    switch/+server.ts             # POST: select-community -> nueva cookie
    logout/+server.ts             # POST: logout
```

## 6. Vistas del cliente (iteración 1) y endpoints que consumen
| Ruta | Muestra | Endpoint(s) Go |
|---|---|---|
| `/login` | Form email + password; errores de credenciales | `POST /api/auth/login` |
| `/` (dashboard) | Comunidad activa: tarjetas de **cuentas** con saldo, preview de últimos movimientos, switcher de comunidad | `GET /api/communities/{cid}/accounts`, `GET /api/accounts/{id}/balance` |
| `/comunidades` | Las **10 comunidades** del usuario (nombre, rut, rol); click → cambia de comunidad | `GET /api/communities` (+ `select-community` al elegir) |
| `/cuentas/[id]` | **Saldo** actual + tabla de **movimientos** (filtros fecha, paginación) | `GET /api/accounts/{id}/balance`, `GET /api/accounts/{id}/movements?from&to&offset&limit` |
| `/cuentas/[id]/cartolas` | **Cartolas** (periodo + summary) | `GET /api/accounts/{id}/statements` |
| `/apoderados` | **Apoderados** de la comunidad activa | `GET /api/communities/{cid}/attorneys` |
| (topbar) switcher | Cambiar comunidad activa | `POST /api/auth/select-community` |
| (menú) salir | Cerrar sesión | `POST /api/auth/logout` |

Interacciones que escriben: **solo** login / select-community / logout (todas vía **form actions** POST). El resto es lectura.

## 7. Capa server (BFF)
`src/lib/server/api.ts` (bosquejo):
```ts
export async function apiFetch(event, path, init: RequestInit = {}) {
  const token = getSession(event.cookies);           // cookie httpOnly
  const res = await event.fetch(`${env.API_BASE_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...init.headers },
  });
  if (res.status === 401) { clearSession(event.cookies); throw redirect(303, '/login'); }
  if (!res.ok) {
    const body = await res.json().catch(() => null);   // envelope {error:{code,message}}
    throw error(res.status, body?.error?.message ?? 'Error');
  }
  return res.json();
}
```
- `hooks.server.ts`: decodifica el JWT de la cookie → `event.locals.session`; el grupo `(app)` exige `locals.session` (si no, redirect `/login`).
- Los `load()` corren en el server → llaman `apiFetch`. El cliente recibe solo data ya resuelta (nunca el token).

## 8. Contratos de datos (TypeScript)
Reflejan las respuestas del Go (ver `endpoints.md`). Ejemplos:
```ts
export type Membership = { community_id: string; legal_name: string; rut: string; role: 'ADMINISTRATOR'|'ATTORNEY'|'VIEWER' };
export type Account   = { id: string; provider_account_id: string; type: 'CURRENT'|'SAVING'; status: string; currency: string };
export type Balance   = { available_balance: number; ledger_balance: number; currency: string; captured_at: string };
export type Movement  = { id: string; provider_transaction_ref: string; date: string; amount: number; type: 'CREDIT'|'DEBIT'; description: string; resulting_balance?: number };
export type Statement = { id: string; provider_statement_id: string; period: string; status: string; summary: {
  opening_balance: number; closing_balance: number; total_credits: number; total_debits: number; movement_count: number } };
export type Attorney  = { id: string; type: string; name: string; identification: string; status: string };
export type ApiError  = { error: { code: string; message: string } };
```
Montos = **entero CLP** (sin decimales). `amount` con **signo** (+ abono / − cargo).

## 9. UI / UX
- **AppShell**: topbar con nombre de la comunidad activa + **CommunitySwitcher** (dropdown de `GET /api/communities`), y menú de usuario (email + salir). Contenido responsivo (mobile-first: los comités entran desde el celular).
- **Dinero**: siempre `Money.svelte` con `Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0})`. Créditos en verde, débitos en rojo.
- **Estados**: cada vista maneja **loading** (skeletons), **empty** (EmptyState: “aún no hay movimientos”) y **error** (ErrorBanner con el `message` del envelope). `+error.svelte` global.
- **Tablas**: movimientos con columnas fecha / glosa / tipo / monto; paginación por `offset/limit`; filtro por rango de fecha.
- **Accesibilidad**: componentes con foco/teclado (bits-ui), contraste AA, `lang="es"`.

## 10. Seguridad
- JWT en cookie **httpOnly + Secure + SameSite=Lax**; jamás en `localStorage` ni expuesto a JS.
- **CSRF**: usar **form actions** (SvelteKit valida `Origin` en POST por defecto). Cualquier `+server.ts` POST valida origin.
- El BFF nunca reenvía cabeceras del cliente al Go salvo el `Bearer` que él mismo controla.
- No se loguean tokens ni PII.
- Scope: las vistas de cuenta usan la comunidad del JWT; si el usuario manipula un `accountId` de otra comunidad, el Go responde 403 → se muestra “no autorizado”.

## 11. Configuración / entorno
- `API_BASE_URL` — URL del Go (dev `http://localhost:8080`; prod: dirección interna en el VPC).
- `SESSION_COOKIE_NAME` (default `bc_session`), `COOKIE_SECURE` (true en prod).
- `ORIGIN` — para SvelteKit en prod (URLs/redirects correctos).
- Sin secretos propios: el JWT lo emite el Go.

## 12. Build / deploy
- `adapter-node` → imagen Docker pequeña (Node LTS). Corre **en el mismo VPC/host** que el Go; `API_BASE_URL` apunta a la dirección interna del Go (no expuesta a internet).
- Solo el SvelteKit se publica al usuario (TLS en el borde). Barato de operar (un contenedor liviano).
- CI: `pnpm build` + `svelte-check` + lint + tests; luego build Docker.

## 13. Testing
- **Unit** (Vitest): `format.ts` (CLP/fecha/rut), `api.ts` (mapeo 401/errores con fetch fake).
- **e2e** (Playwright): login por email → dashboard → switch de comunidad → detalle de cuenta → movimientos → cartolas → logout, contra el backend con `db/seed_demo.sql`.

## 14. Fuera de alcance (iteración 2)
`/admin` completo: alta de administradores/comunidades/usuarios/membresías, vínculo de banco, onboarding (wizard de estados), traspaso y trigger de sync; MFA; recuperación de clave. Se agregarán como grupo de rutas `(admin)` protegido por `platform_role`.

## 15. Backlog inicial (iteración 1)
1. Scaffold SvelteKit + TS + Tailwind + adapter-node; `lib/server/api.ts`, `session.ts`, `hooks.server.ts`.
2. `/login` (form action BFF, cookie httpOnly) + guard del grupo `(app)`.
3. AppShell + CommunitySwitcher (+ action `switch`) + logout.
4. Dashboard `/` (cuentas + saldos + preview movimientos).
5. `/comunidades`.
6. `/cuentas/[id]` (saldo + movimientos paginados + filtros).
7. `/cuentas/[id]/cartolas`.
8. `/apoderados`.
9. Estados loading/empty/error + formato CLP + responsive.
10. e2e Playwright contra `seed_demo`.
