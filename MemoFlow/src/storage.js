const STORAGE_KEY = "memoflow_notes_v2";
const LEGACY_KEY = "memoflow_notes_v1";
const THEME_KEY = "memoflow_theme_v2";

export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeNote(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 120) : "";
  if (!title) return null;
  const allowedCategories = ["Personal", "Work", "Ideas", "Urgent"];
  const allowedColors = ["plain", "lavender", "mint", "peach", "sky", "rose", "default", "amber", "emerald", "violet"];
  const reminderDate = input.reminderAt ? new Date(input.reminderAt) : null;
  const validReminder = reminderDate && !Number.isNaN(reminderDate.getTime()) ? reminderDate.toISOString() : null;
  return {
    id: typeof input.id === "string" && input.id.length < 150 ? input.id : createId(),
    title,
    content: typeof input.content === "string" ? input.content.slice(0, 10000) : "",
    category: allowedCategories.includes(input.category) ? input.category : "Personal",
    color: allowedColors.includes(input.color) ? input.color : "plain",
    tags: Array.isArray(input.tags) ? [...new Set(input.tags.filter(t => typeof t === "string").map(t => t.trim().slice(0, 30)).filter(Boolean))].slice(0, 12) : [],
    pinned: Boolean(input.pinned),
    completed: Boolean(input.completed),
    archived: Boolean(input.archived),
    reminderAt: validReminder,
    notified: Boolean(input.notified),
    createdAt: Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : Date.now(),
    updatedAt: Number.isFinite(Number(input.updatedAt)) ? Number(input.updatedAt) : Date.now()
  };
}

export function loadNotes() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const migrated = JSON.parse(raw);
        const safe = Array.isArray(migrated) ? migrated.map(normalizeNote).filter(Boolean) : [];
        saveNotes(safe);
        return safe;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Saved notes data is not an array.");
    return parsed.map(normalizeNote).filter(Boolean);
  } catch (error) {
    console.error("Could not load MemoFlow data:", error);
    return [];
  }
}

export function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error("Could not save MemoFlow data:", error);
    return false;
  }
}

export function getTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}
export function saveTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch (error) { console.warn("Theme preference could not be saved.", error); }
}

export function validateImport(value) {
  if (!Array.isArray(value)) throw new Error("Backup must contain a list of notes.");
  if (value.length > 5000) throw new Error("This backup contains too many notes (maximum 5,000).");
  const notes = value.map(normalizeNote).filter(Boolean);
  if (value.length && !notes.length) throw new Error("No valid notes were found in this backup.");
  const ids = new Set();
  for (const note of notes) {
    if (ids.has(note.id)) note.id = createId();
    ids.add(note.id);
  }
  return notes;
}
