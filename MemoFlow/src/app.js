import { createId, loadNotes, saveNotes, getTheme, saveTheme, validateImport } from "./storage.js";

const $ = (selector) => document.querySelector(selector);
const els = {
  grid: $("#notesGrid"), empty: $("#emptyState"), dialog: $("#noteDialog"), form: $("#noteForm"),
  title: $("#noteTitle"), content: $("#noteContent"), category: $("#noteCategory"), color: $("#noteColor"),
  tags: $("#noteTags"), reminder: $("#noteReminder"), pinned: $("#notePinned"), id: $("#noteId"),
  error: $("#formError"), search: $("#searchInput"), categoryFilter: $("#categoryFilter"), sort: $("#sortSelect")
};
let notes = loadNotes();
let statusFilter = "all";
let searchQuery = "";
let lastFocused = null;
let timerId = null;

function persist() {
  if (!saveNotes(notes)) toast("Storage is full or unavailable. Export a backup and free some browser storage.", "error");
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatDate(value, options = { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }) {
  const date = safeDate(value);
  return date ? date.toLocaleString([], options) : "Invalid date";
}
function toast(message, type = "info") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  $("#toastRegion").append(item);
  window.setTimeout(() => item.remove(), 3800);
}
function updateClock() {
  $("#liveClock").textContent = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
  $("#todayLabel").textContent = new Date().toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" }).toUpperCase();
}
function activeNotes() { return notes.filter(note => !note.archived); }

function renderStats() {
  const active = activeNotes();
  const now = Date.now();
  $("#totalCount").textContent = active.length;
  $("#reminderCount").textContent = active.filter(n => n.reminderAt && !n.completed).length;
  $("#completedCount").textContent = active.filter(n => n.completed).length;
  $("#overdueCount").textContent = active.filter(n => n.reminderAt && !n.completed && new Date(n.reminderAt).getTime() < now).length;
  $("#countAll").textContent = active.length;
  $("#countReminders").textContent = active.filter(n => n.reminderAt).length;
  $("#countPinned").textContent = active.filter(n => n.pinned).length;
  $("#countCompleted").textContent = active.filter(n => n.completed).length;
  $("#countArchived").textContent = notes.filter(n => n.archived).length;
}
function getVisibleNotes() {
  let result = notes.filter(note => statusFilter === "archived" ? note.archived : !note.archived);
  if (statusFilter === "reminders") result = result.filter(n => n.reminderAt && !n.completed);
  if (statusFilter === "pinned") result = result.filter(n => n.pinned);
  if (statusFilter === "completed") result = result.filter(n => n.completed);
  if (statusFilter === "all") result = result.filter(n => !n.archived);
  const category = els.categoryFilter.value;
  if (category !== "all") result = result.filter(n => n.category === category);
  if (searchQuery) result = result.filter(n => [n.title, n.content, n.category, ...(n.tags || [])].join(" ").toLowerCase().includes(searchQuery));
  const sort = els.sort.value;
  result.sort((a,b) => {
    if (a.pinned !== b.pinned && sort === "updated") return a.pinned ? -1 : 1;
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "oldest") return a.createdAt - b.createdAt;
    if (sort === "reminder") return (a.reminderAt || "9999").localeCompare(b.reminderAt || "9999");
    if (sort === "created") return b.createdAt - a.createdAt;
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });
  return result;
}
function cardHTML(note) {
  const overdue = note.reminderAt && !note.completed && new Date(note.reminderAt).getTime() < Date.now();
  const reminderText = note.reminderAt ? `${overdue ? "Overdue · " : "Reminder · "}${formatDate(note.reminderAt)}` : `Created ${formatDate(note.createdAt, { month:"short", day:"numeric", year:"numeric" })}`;
  const tags = (note.tags || []).map(tag => `<span class="tag">#${escapeHTML(tag)}</span>`).join("");
  return `<article class="note-card color-${escapeHTML(note.color)}" data-id="${escapeHTML(note.id)}">
    <div>
      <div class="note-top"><span class="category-badge category-${escapeHTML(note.category)}">${escapeHTML(note.category)}</span>
        <div class="note-actions">
          <button class="mini-btn" data-action="complete" title="${note.completed ? "Mark active" : "Mark completed"}" aria-label="${note.completed ? "Mark active" : "Mark completed"}">${note.completed ? "↶" : "✓"}</button>
          <button class="mini-btn" data-action="pin" title="${note.pinned ? "Unpin" : "Pin"}" aria-label="${note.pinned ? "Unpin note" : "Pin note"}">${note.pinned ? "◆" : "◇"}</button>
        </div>
      </div>
      <h3 class="note-title ${note.completed ? "completed" : ""}">${escapeHTML(note.title)}</h3>
      ${note.content ? `<p class="note-content">${escapeHTML(note.content)}</p>` : ""}
      ${tags ? `<div class="tag-list">${tags}</div>` : ""}
    </div>
    <div class="note-footer"><span class="reminder-label ${overdue ? "overdue" : ""}">${escapeHTML(reminderText)}</span>
      <div class="note-footer-actions">
        <button class="mini-btn" data-action="edit" title="Edit note" aria-label="Edit note">✎</button>
        <button class="mini-btn" data-action="archive" title="${note.archived ? "Restore" : "Archive"}" aria-label="${note.archived ? "Restore note" : "Archive note"}">${note.archived ? "↩" : "▣"}</button>
        <button class="mini-btn" data-action="delete" title="Delete note" aria-label="Delete note">×</button>
      </div>
    </div>
  </article>`;
}
function render() {
  renderStats();
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.status === statusFilter));
  const visible = getVisibleNotes();
  els.grid.innerHTML = visible.map(cardHTML).join("");
  els.empty.classList.toggle("hidden", visible.length !== 0);
  els.grid.classList.toggle("hidden", visible.length === 0);
  const headings = { all:"Your notes", reminders:"Your reminders", pinned:"Pinned notes", completed:"Completed notes", archived:"Archived notes" };
  $("#listHeading").textContent = headings[statusFilter] || "Your notes";
  $("#resultSummary").textContent = `${visible.length} ${visible.length === 1 ? "item" : "items"} shown`;
  $("#emptyTitle").textContent = searchQuery ? "No matching notes" : statusFilter === "archived" ? "Nothing archived yet" : "Your space is ready";
  $("#emptyText").textContent = searchQuery ? "Try another search or clear your filters." : "Create your first note and start organizing your thoughts.";
}
function openDialog(note = null) {
  lastFocused = document.activeElement;
  els.form.reset(); els.error.textContent = "";
  els.id.value = note?.id || "";
  $("#dialogTitle").textContent = note ? "Edit note" : "Create a note";
  $("#noteTitle").value = note?.title || "";
  $("#noteContent").value = note?.content || "";
  $("#noteCategory").value = note?.category || "Personal";
  $("#noteColor").value = note?.color || "plain";
  $("#noteTags").value = (note?.tags || []).join(", ");
  $("#notePinned").checked = Boolean(note?.pinned);
  $("#noteReminder").value = note?.reminderAt ? toLocalInput(note.reminderAt) : "";
  els.dialog.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("#noteTitle").focus();
}
function closeDialog() {
  els.dialog.classList.add("hidden");
  document.body.style.overflow = "";
  lastFocused?.focus?.();
}
function toLocalInput(value) {
  const date = safeDate(value);
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0,16);
}
function saveNote(event) {
  event.preventDefault();
  const title = $("#noteTitle").value.trim();
  if (!title) { els.error.textContent = "Please enter a title."; $("#noteTitle").focus(); return; }
  const reminderValue = $("#noteReminder").value;
  const reminderDate = reminderValue ? new Date(reminderValue) : null;
  if (reminderValue && (!reminderDate || Number.isNaN(reminderDate.getTime()))) { els.error.textContent = "Please choose a valid reminder date."; return; }
  if (reminderDate && reminderDate.getTime() < Date.now() - 60000) { els.error.textContent = "Choose a future reminder time."; return; }
  const id = els.id.value;
  const existing = notes.find(n => n.id === id);
  const now = Date.now();
  const note = {
    id: existing?.id || createId(), title, content: $("#noteContent").value.trim(),
    category: $("#noteCategory").value, color: $("#noteColor").value,
    tags: [...new Set($("#noteTags").value.split(",").map(t => t.trim().toLowerCase()).filter(Boolean))].slice(0,12),
    pinned: $("#notePinned").checked, completed: existing?.completed || false, archived: existing?.archived || false,
    reminderAt: reminderDate ? reminderDate.toISOString() : null,
    notified: existing && existing.reminderAt === (reminderDate ? reminderDate.toISOString() : null) ? existing.notified : false,
    createdAt: existing?.createdAt || now, updatedAt: now
  };
  if (existing) notes = notes.map(n => n.id === id ? note : n);
  else notes.unshift(note);
  persist(); closeDialog(); render(); toast(existing ? "Note updated." : "Note created.", "success");
}
function deleteNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note || !window.confirm(`Delete "${note.title}" permanently?`)) return;
  notes = notes.filter(n => n.id !== id); persist(); render(); toast("Note deleted.", "success");
}
function handleCardAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = event.target.closest("[data-id]");
  const note = notes.find(n => n.id === card?.dataset.id);
  if (!note) return;
  const action = button.dataset.action;
  if (action === "edit") openDialog(note);
  if (action === "delete") deleteNote(note.id);
  if (action === "complete") { note.completed = !note.completed; note.updatedAt = Date.now(); persist(); render(); }
  if (action === "pin") { note.pinned = !note.pinned; note.updatedAt = Date.now(); persist(); render(); }
  if (action === "archive") { note.archived = !note.archived; note.updatedAt = Date.now(); persist(); render(); toast(note.archived ? "Note archived." : "Note restored.", "success"); }
}
function exportBackup() {
  const payload = { app:"MemoFlow", version:2, exportedAt:new Date().toISOString(), notes };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `memoflow-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  toast("Backup exported.", "success");
}
async function importBackup(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast("Backup file is too large (maximum 5 MB).", "error"); return; }
  try {
    const parsed = JSON.parse(await file.text());
    const rawNotes = Array.isArray(parsed) ? parsed : parsed.notes;
    const imported = validateImport(rawNotes);
    if (!window.confirm(`Replace your current ${notes.length} notes with ${imported.length} imported notes? Export a backup first if needed.`)) return;
    notes = imported; persist(); render(); toast(`${notes.length} notes imported.`, "success");
  } catch (error) { toast(error.message || "This backup file is invalid.", "error"); }
}
function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error("Audio is not supported.");
    const context = new AudioContext();
    [880, 1174.66].forEach((frequency, index) => {
      const oscillator = context.createOscillator(), gain = context.createGain();
      const start = context.currentTime + index * .16;
      oscillator.type = "sine"; oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.12, start + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .55);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + .6);
    });
    window.setTimeout(() => context.close(), 1200);
  } catch (error) { toast("Sound could not be played in this browser.", "error"); }
}
function checkReminders() {
  const now = Date.now(); let changed = false;
  for (const note of notes) {
    if (!note.archived && !note.completed && note.reminderAt && !note.notified) {
      const due = safeDate(note.reminderAt);
      if (due && due.getTime() <= now) {
        note.notified = true; note.updatedAt = now; changed = true;
        toast(`Reminder: ${note.title}`, "success"); playChime();
        if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
          new Notification("MemoFlow reminder", { body:note.title, tag:note.id });
        }
      }
    }
  }
  if (changed) { persist(); render(); }
}
function requestNotificationPermission() {
  if (!("Notification" in window)) { toast("Browser notifications are not supported."); return; }
  Notification.requestPermission().then(permission => toast(permission === "granted" ? "Browser notifications enabled." : "Notification permission was not granted.", permission === "granted" ? "success" : "error"));
}
function initTheme() {
  const saved = getTheme();
  const dark = saved ? saved === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", Boolean(dark));
  $("#themeBtn").textContent = dark ? "☀" : "☾";
}
function toggleTheme() {
  const dark = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", dark);
  saveTheme(dark ? "dark" : "light");
  $("#themeBtn").textContent = dark ? "☀" : "☾";
}
function bindEvents() {
  $("#newNoteBtn").addEventListener("click", () => openDialog());
  $("#emptyCreateBtn").addEventListener("click", () => openDialog());
  $("#closeDialogBtn").addEventListener("click", closeDialog);
  $("#cancelDialogBtn").addEventListener("click", closeDialog);
  els.dialog.addEventListener("click", e => { if (e.target === els.dialog) closeDialog(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !els.dialog.classList.contains("hidden")) closeDialog(); });
  els.form.addEventListener("submit", saveNote);
  els.grid.addEventListener("click", handleCardAction);
  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => { statusFilter = btn.dataset.status; render(); }));
  els.search.addEventListener("input", e => { searchQuery = e.target.value.trim().toLowerCase(); $("#clearSearchBtn").classList.toggle("hidden", !searchQuery); render(); });
  $("#clearSearchBtn").addEventListener("click", () => { els.search.value = ""; searchQuery = ""; $("#clearSearchBtn").classList.add("hidden"); render(); });
  els.categoryFilter.addEventListener("change", render); els.sort.addEventListener("change", render);
  $("#exportBtn").addEventListener("click", exportBackup);
  $("#importInput").addEventListener("change", e => { importBackup(e.target.files?.[0]); e.target.value = ""; });
  $("#themeBtn").addEventListener("click", toggleTheme);
  $("#testSoundBtn").addEventListener("click", playChime);
  $("#clearReminderBtn").addEventListener("click", () => { els.reminder.value = ""; });
  document.querySelectorAll("[data-minutes]").forEach(btn => btn.addEventListener("click", () => { els.reminder.value = toLocalInput(Date.now() + Number(btn.dataset.minutes) * 60000); }));
  $("#todayLabel").addEventListener("dblclick", requestNotificationPermission);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkReminders(); });
  window.addEventListener("focus", checkReminders);
}
function init() {
  initTheme(); bindEvents(); updateClock(); render();
  window.setInterval(updateClock, 1000);
  timerId = window.setInterval(checkReminders, 15000);
  checkReminders();
  if (!notes.length) toast("Welcome to MemoFlow — create your first note.");
}
init();
