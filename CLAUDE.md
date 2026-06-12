# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Type-check + build for production (tsc -b && vite build)
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

There are no automated tests configured in this project.

## Environment

The app expects `VITE_API_URL` to be set (falls back to `/api`). Create a `.env.local` with:

```
VITE_API_URL=http://localhost:3000/api
```

## Architecture

**Stack:** React 19 + TypeScript + Vite + TailwindCSS + React Router v7. No Redux — all state is in React context or local component state.

### Routing (src/App.tsx)

Two layout zones:
- **Admin routes** (`/admin/*`): wrapped in `<AdminLayout>`, lazy-loaded, no public Header/Footer.
- **Public routes** (`/*`): wrapped in `<PublicLayout>` which includes `<Header>` and `<Footer>`. Top padding adjusts dynamically based on whether the announcement banner is open.

### Context providers (src/context/)

Four providers nested in App, innermost-to-outermost:
1. **`AuthContext`** — JWT token in `localStorage` (key: `token`) + HttpOnly cookie. Fetches `GET /auth/me` on mount. Exposes `isAdmin` (true for `ADMIN_BDE` or `ADMIN_PROF` user types). Refreshes user on window focus.
2. **`NotificationProvider`** — Toast notifications, wired to the API client via `setUnauthorizedCallback`/`setErrorCallback` in `ApiInterceptor`.
3. **`CartContext`** — Shopping cart persisted in `localStorage` (key: `cart`). Supports both legacy `variantId` and new multi-category `selectedOptions`.
4. **`BannerContext`** — Controls the announcement banner visibility at the top of public pages.

### API layer (src/api/)

All HTTP calls go through `src/api/client.ts` which provides `fetchJson`, `fetchFormData`, `uploadFile`. The client:
- Sends `Authorization: Bearer <token>` header as fallback alongside HttpOnly cookies
- Reads CSRF token from `csrf_token` cookie and sends it as `X-CSRF-Token` on mutating requests
- Throws `ApiError` (with `.status`) or `NetworkError` on failures (see `src/types/errors.ts`)
- Calls the global `onUnauthorized` callback on 401/403, triggering logout

Each domain has its own file in `src/api/` (e.g., `auth.ts`, `products.ts`, `events.ts`).

### Validation (src/types/schemas.ts)

Zod schemas validate API responses. `validateResponse()` throws in development on schema mismatch, degrades gracefully in production. User types are: `STUDENT`, `PROFESSOR`, `EXTERNAL`, `ADMIN_BDE`, `ADMIN_PROF`.

### Logging (src/utils/logger.ts)

Use `logger` (not `console.*`) throughout. All output is suppressed in production except errors. Sensitive keys (password, token, etc.) are redacted automatically from log context objects.

### Admin interface (src/components/AdminLayout.tsx)

Sidebar navigation with per-route color theming. Redirects to `/login` if user is not authenticated or not admin.

### Build chunking

Vite is configured with manual chunks: `vendor-react`, `vendor-charts` (recharts), `vendor-icons` (lucide-react). Keep heavy dependencies out of the main bundle.
