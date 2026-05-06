# TICKR Desktop — App para Windows

Next.js 14 + Electron + Supabase

---

## Instalación rápida (10 minutos)

### Requisitos previos
- **Node.js 18+** → https://nodejs.org (instalador .msi para Windows)

---

### Paso 1 — Supabase (opcional pero recomendado)

1. https://supabase.com → nuevo proyecto → espera ~2 min
2. **SQL Editor** → pega `supabase-schema.sql` → Run
3. **Settings → API** → copia Project URL y anon key

---

### Paso 2 — Variables de entorno

Abre PowerShell en la carpeta del proyecto:

```powershell
copy .env.local.example .env.local
notepad .env.local
```

Pon tus keys de Supabase (o déjalo vacío para jugar en local sin nube).

---

### Paso 3 — Instalar y arrancar

```powershell
npm install
npm run dev
```

La ventana del juego se abre automáticamente.

---

### Paso 4 — Generar instalador .exe

```powershell
npm run electron:build
```

Genera `dist/Tickr Setup 1.0.0.exe` — instalable en cualquier Windows.

---

## Estructura

```
electron/
  main.js       — Proceso principal (ventana, controles)
  preload.js    — Bridge seguro Electron ↔ app
src/
  app/          — Páginas Next.js
  components/   — React components
    TitleBar.tsx — Barra personalizada (minimize/maximize/close)
    TopBar.tsx
    BottomNav.tsx
    tabs/        — Una carpeta por sección del juego
  lib/
    store.ts    — Estado global (Zustand + localStorage)
    stocks.ts   — Datos y helpers
    supabase.ts — Cliente Supabase
supabase-schema.sql — Ejecutar en Supabase SQL Editor
```
