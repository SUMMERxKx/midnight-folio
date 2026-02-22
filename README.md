# Folio — Digital Scrapbook

A beautiful, dark-themed digital scrapbook app built with React, Zustand, and Supabase.

Create spreads, drag and drop photos, add text and stickers, draw freehand — all persisted to a Supabase backend with real-time sync across tabs.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **State:** Zustand (optimistic local state)
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **UI:** Tailwind CSS, shadcn/ui, Radix primitives
- **Canvas:** react-rnd (drag/resize), html-to-image (PNG export)

## Getting Started

### 1. Clone & install

```sh
git clone <YOUR_GIT_URL>
cd midnight-folio
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the database schema in the SQL editor (see [Database Schema](#database-schema) below)
3. Create a **public** storage bucket called `scrapbook-images`
4. Create a user in **Authentication → Users** (email + password)

### 3. Configure environment

Copy the example env file and fill in your project credentials:

```sh
cp .env.local.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) and sign in with the user you created.

## Database Schema

Run this in the Supabase SQL editor:

```sql
create table spreads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  date date,
  tags text[] default '{}',
  page_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table elements (
  id uuid primary key default gen_random_uuid(),
  spread_id uuid references spreads(id) on delete cascade,
  type text not null check (type in ('photo','text','sticker','shape','doodle')),
  x float not null default 0,
  y float not null default 0,
  width float not null default 100,
  height float not null default 100,
  rotation float default 0,
  z_index integer default 0,
  data text,
  style jsonb default '{}',
  created_at timestamptz default now()
);

-- Row Level Security
alter table spreads enable row level security;
alter table elements enable row level security;

create policy "Users own their spreads" on spreads
  for all using (auth.uid() = user_id);

create policy "Users own their elements" on elements
  for all using (
    spread_id in (select id from spreads where user_id = auth.uid())
  );
```

### Storage Bucket

Create a bucket called `scrapbook-images` with **public** access. This stores uploaded photos and serves them via public URLs.

### Realtime

To enable cross-tab sync, enable Realtime for both the `spreads` and `elements` tables in your Supabase dashboard under **Database → Replication**.

## Features

- **Spreads** — Create, duplicate, delete, rename pages
- **Elements** — Photos, text, stickers, shapes with drag/resize/rotate
- **Drawing** — Freehand drawing layer with color and thickness controls
- **Photo Upload** — Click "Photo" or double-click a placeholder to upload images
- **Z-Index Layering** — Move elements to front/back
- **PNG Export** — Export the full spread including drawings
- **Keyboard Shortcuts:**
  - `Delete` / `Backspace` — Remove selected element
  - `Escape` — Deselect
  - `Ctrl+D` / `Cmd+D` — Duplicate selected element
- **Auth** — Email + password login via Supabase Auth
- **Persistence** — All data saved to Supabase Postgres
- **Real-time** — Changes sync across browser tabs

## Project Structure

```
src/
├── components/
│   ├── folio/
│   │   ├── BottomToolbar.tsx   # Tool buttons, photo upload
│   │   ├── Canvas.tsx          # Spread canvas with pages
│   │   ├── DrawingLayer.tsx    # Freehand drawing canvas
│   │   ├── SelectionMenu.tsx   # Context menu for selected elements
│   │   ├── SpreadElement.tsx   # Draggable/resizable element
│   │   ├── SpreadsSidebar.tsx  # Sidebar with spread list
│   │   └── TopBar.tsx          # Title, zoom, export, auth
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── api.ts                  # Supabase CRUD functions
│   ├── auth.tsx                # Auth context + provider
│   ├── realtime.ts             # Supabase realtime subscriptions
│   ├── storage.ts              # Image upload to Supabase Storage
│   ├── store.ts                # Zustand state + Supabase sync
│   ├── supabase.ts             # Supabase client init
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Tailwind merge utility
├── pages/
│   ├── Index.tsx               # Main app page
│   ├── Login.tsx               # Auth login page
│   └── NotFound.tsx            # 404 page
├── App.tsx                     # Router + providers
└── main.tsx                    # Entry point
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
