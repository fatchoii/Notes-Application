import { useState, useEffect, useRef } from "react";
import "./NotesApp.css";

const STORAGE_KEY = "mn_notes";

const DEFAULT_FOLDERS = [
  { id: "all", label: "All Notes", icon: "📋" },
  { id: "personal", label: "Personal", icon: "🏠" },
  { id: "work", label: "Work", icon: "💼" },
  { id: "ideas", label: "Ideas", icon: "💡" },
];

const defaultNotes = [
  {
    id: 1,
    folder: "personal",
    title: "Welcome",
    body: "Start writing your thoughts here.\n\nClick the + button to create a new note, or edit this one.",
    updated: Date.now() - 86400000,
  },
  {
    id: 2,
    folder: "ideas",
    title: "Ideas",
    body: "– A minimalist approach\n– Less clutter, more focus\n– Write what matters",
    updated: Date.now() - 3600000,
  },
  {
    id: 3,
    folder: "work",
    title: "Meeting notes",
    body: "Q3 planning:\n– Review OKRs\n– Assign owners\n– Set deadlines",
    updated: Date.now() - 7200000,
  },
];

function fmt(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function NotesApp() {
  const [notes, setNotes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultNotes;
    } catch {
      return defaultNotes;
    }
  });

  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [activeFolder, setActiveFolder] = useState("all");
  const [activeId, setActiveId] = useState(defaultNotes[0].id);
  const [query, setQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // Notes filtered by folder + search query
  const visibleNotes = notes
    .filter((n) => activeFolder === "all" || n.folder === activeFolder)
    .filter(
      (n) =>
        !query ||
        (n.title + n.body).toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.updated - a.updated);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  function folderCount(folderId) {
    if (folderId === "all") return notes.length;
    return notes.filter((n) => n.folder === folderId).length;
  }

  function newNote() {
    const folder = activeFolder === "all" ? "personal" : activeFolder;
    const n = { id: Date.now(), folder, title: "", body: "", updated: Date.now() };
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  function updateNote(field, value) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeId ? { ...n, [field]: value, updated: Date.now() } : n
      )
    );
  }

  function deleteNote() {
    if (!window.confirm("Delete this note?")) return;
    const remaining = notes.filter((n) => n.id !== activeId);
    setNotes(remaining);
    setActiveId(visibleNotes.find((n) => n.id !== activeId)?.id ?? null);
  }

  function addFolder() {
    const label = window.prompt("Folder name:");
    if (!label?.trim()) return;
    const id = label.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setFolders((prev) => [...prev, { id, label: label.trim(), icon: "📁" }]);
  }

  const activeFolderLabel =
    folders.find((f) => f.id === activeFolder)?.label ?? "Notes";

  return (
    <div className={`notes-app${darkMode ? " dark-mode" : ""}`}>

      {/* ── Column 1 · Folders ── */}
      <aside className="folders-col">
        <div className="folders-header">
          <span className="folders-header-label">Folders</span>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </div>

        <div className="folder-list">
          {folders.map((f) => (
            <div
              key={f.id}
              className={`folder-item${activeFolder === f.id ? " active" : ""}`}
              onClick={() => {
                setActiveFolder(f.id);
                setActiveId(
                  notes
                    .filter((n) => f.id === "all" || n.folder === f.id)
                    .sort((a, b) => b.updated - a.updated)[0]?.id ?? null
                );
              }}
            >
              <span className="folder-icon">{f.icon}</span>
              {f.label}
              <span className="folder-count">{folderCount(f.id)}</span>
            </div>
          ))}
        </div>

        <div className="folders-footer">
          <button className="new-folder-btn" onClick={addFolder}>
            + New folder
          </button>
        </div>
      </aside>

      {/* ── Column 2 · Notes list ── */}
      <section className="notes-col">
        <div className="notes-col-header">
          <span className="notes-col-title">{activeFolderLabel}</span>
          <button className="new-note-btn" onClick={newNote} aria-label="New note">
            +
          </button>
        </div>

        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search notes"
          />
        </div>

        <div className="note-list">
          {visibleNotes.length === 0 ? (
            <div className="note-list-empty">No notes found</div>
          ) : (
            visibleNotes.map((n) => (
              <div
                key={n.id}
                className={`note-item${n.id === activeId ? " active" : ""}`}
                onClick={() => setActiveId(n.id)}
              >
                <div className="note-item-title">{n.title || "Untitled"}</div>
                <div className="note-item-preview">
                  {n.body.split("\n")[0] || "No content"}
                </div>
                <div className="note-item-date">{fmt(n.updated)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Column 3 · Editor ── */}
      <main className="editor-col">
        {!activeNote ? (
          <div className="empty-state">
            <div className="empty-state-icon">📓</div>
            <p className="empty-state-text">Select a note or create one</p>
          </div>
        ) : (
          <>
            <div className="editor-toolbar">
              <div className="editor-meta">
                <span className="editor-folder-tag">
                  {folders.find((f) => f.id === activeNote.folder)?.label ?? activeNote.folder}
                </span>
                <span className="char-count">{activeNote.body.length} chars</span>
              </div>
            </div>

            <div className="title-row">
              <input
                ref={titleRef}
                className="title-input"
                placeholder="Title"
                maxLength={80}
                value={activeNote.title}
                onChange={(e) => updateNote("title", e.target.value)}
              />
              <button
                className="delete-btn"
                onClick={deleteNote}
                title="Delete note"
                aria-label="Delete note"
              >
                🗑 Delete
              </button>
            </div>

            <textarea
              ref={bodyRef}
              className="body-input"
              placeholder="Write something..."
              value={activeNote.body}
              onChange={(e) => updateNote("body", e.target.value)}
            />
          </>
        )}
      </main>

    </div>
  );
}
