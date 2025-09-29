# Project Saving Plan (Right-Sized)

This app is single-user and runs on my machine. The goal is simply to save and reload canvas projects; anything beyond that can wait. The checklist below replaces the over-engineered plan the AI produced earlier.

---

## Snapshot Of The Current State
- Express server only exposes gallery endpoints (`GET/POST/DELETE /api/gallery`) and stores files in `generated/` with metadata in `gallery.json`.
- Frontend keeps the entire canvas (`useHistory` in `App.tsx`) in memory and loses it on refresh.
- There is no concept of a project ID, no backend storage for canvas state, and no UI to pick a saved project.

These constraints mean that a minimal project system can piggyback on the existing file-based setup without adding databases, feature flags, or multi-user concerns.

---

## Minimal Feature Goal
"Create, save, and reopen a project that captures the full canvas state (nodes + connections + settings)." Autosave, migrations, and organized media libraries are nice-to-haves but not required right now.

---

## Phase 1 — Backend Basics (file-backed)
- [ ] Ensure `generated/projects/` exists alongside `generated/gallery.json`.
- [ ] Store project metadata in `generated/projects.json` (array of `{ id, name, updatedAt }`).
- [ ] Store each project state in `generated/projects/{projectId}.json`.
- [ ] Implement endpoints in `server/index.js`:
  - [ ] `GET /api/projects` → return metadata list.
  - [ ] `GET /api/projects/:id` → return `{ metadata, state }` from disk.
  - [ ] `POST /api/projects` → create new project (accepts `name`, optional initial `state`, returns id).
  - [ ] `PUT /api/projects/:id` → upsert state for existing project and refresh `updatedAt`.
  - [ ] `DELETE /api/projects/:id` (optional but easy) → remove metadata + JSON file.
- [ ] Keep write operations sequential (await file writes) — good enough for single-user use.

---

## Phase 2 — Frontend Wiring
- [ ] Add `services/projectApi.ts` with thin wrappers for the endpoints above (mirrors `galleryApi.ts`).
- [ ] Define lightweight types in the same file or in `types.ts`: `ProjectMetadata`, `ProjectState`.
- [ ] Add local React state (context or simple hook) to track:
  - [ ] Currently loaded project metadata + canvas state.
  - [ ] Unsaved changes flag (boolean is fine; no elaborate diffing).
  - [ ] Basic loading/error flags for UI feedback.
- [ ] On startup: fetch project list, optionally auto-load the most recent project, or show "New Project" prompt.
- [ ] Add simple UI affordances:
  - [ ] Button to "Save Project" (calls `PUT` with current canvas state).
  - [ ] Button to "Save As…" (calls `POST`, switches current id).
  - [ ] Dropdown/list to switch projects (loads via `GET /api/projects/:id`).
  - [ ] Optional delete button if Phase 1 `DELETE` exists.
- [ ] Ensure gallery calls include the active project ID so each project only sees its own media (see Phase 2b).

---

## Phase 2b — Project-Scoped Gallery
- [ ] Update backend gallery endpoints:
  - [ ] Accept optional `projectId` on `POST /api/gallery` and persist it in `gallery.json`.
  - [ ] Add filtering in `GET /api/gallery` (e.g., `?projectId=...`).
  - [ ] Consider creating per-project subfolders under `generated/` later, but start with metadata tagging.
- [ ] Update `services/galleryApi.ts` to send/receive `projectId`.
- [ ] Ensure UI calls include the active project ID when saving gallery items and only fetch the current project’s media.
- [ ] Fallback: if no project is loaded, treat gallery as global (keeps current behavior during transition).

---

## Phase 3 — Quality-of-Life Extras (later, optional)
These can wait until the basics work:
- Autosave timer.
- Per-project media folders on disk.
- Migration script for existing gallery items.
- Storage quotas or performance tuning.
- Multi-user or multi-device scenarios.
- Detailed analytics or error reporting.

Revisit once the core save/load loop feels solid.

---

## Testing & Verification
- [ ] Manual sanity checks with curl/Postman for each endpoint.
- [ ] Save and reload multiple projects through the UI; verify canvas state comes back exactly.
- [ ] Restart server/app to ensure persistence works.
