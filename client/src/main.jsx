// Frontend entry point for the MyNotes application.
// Creates the shared Axios client used to communicate with the backend API.
// Defines the sign-in, note form, note card, and dashboard React components.
// Manages browser session state and coordinates note actions and API responses.import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './style.css';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mynotes-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const messageFrom = (error) => error.response?.data?.message || 'Something went wrong. Check that the API and MongoDB are running.';
const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const registering = mode === 'register';
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (registering && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const response = await api.post(`/auth/${mode}`, { email: email.trim(), password });
      onAuthenticated(response.data);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><span className="brand-mark">N</span><span>MyNotes</span></div>
    <p className="eyebrow">YOUR PERSONAL NOTEBOOK</p>
    <h1>{registering ? 'Create your account' : 'Welcome back'}</h1>
    <p className="auth-description">{registering ? 'Sign up to keep your notes private and in sync.' : 'Sign in to see your notes.'}</p>
    <form onSubmit={submit}>
      <label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
      <label htmlFor="auth-password">Password</label><input id="auth-password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
      {registering && <><label htmlFor="auth-confirm">Confirm password</label><input id="auth-confirm" type="password" autoComplete="new-password" minLength="8" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /></>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
    </form>
    <p className="auth-switch">{registering ? 'Already have an account?' : 'New to MyNotes?'} <button type="button" onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); }}>{registering ? 'Sign in' : 'Create an account'}</button></p>
  </section></main>;
}
function NoteForm({ note, busy, onClose, onSave }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState((note?.tags || []).join(', '));
  const [checklistEnabled, setChecklistEnabled] = useState(note?.checklistEnabled || false);
  const [checklist, setChecklist] = useState(note?.checklist || []);
  const [formError, setFormError] = useState('');
  function submit(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Please enter both a title and some note content.');
      return;
    }
    setFormError('');
    onSave({
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      checklistEnabled,
      checklist: checklist.filter((item) => item.text.trim()).map((item) => ({ ...item, text: item.text.trim() })),
    });
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="editor-heading"><div><span className="eyebrow">YOUR NOTEBOOK</span><h2 id="editor-title">{note ? 'Edit note' : 'A new thought'}</h2></div><button className="icon-button" type="button" aria-label="Close" onClick={onClose} disabled={busy}>×</button></div>
      <form onSubmit={submit}>
        <label htmlFor="note-title">Title</label><input id="note-title" maxLength="120" autoFocus placeholder="Give your note a title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label htmlFor="note-content">Your note</label><textarea id="note-content" rows="8" placeholder="Write something worth remembering…" value={content} onChange={(event) => setContent(event.target.value)} />
        <label className="checklist-toggle"><input type="checkbox" checked={checklistEnabled} onChange={(event) => setChecklistEnabled(event.target.checked)} /> Use a checklist</label>
        {checklistEnabled && <div className="checklist-editor">
          {checklist.map((item, index) => <div className="checklist-edit-row" key={item._id || index}>
            <input type="checkbox" aria-label={`Mark item ${index + 1} complete`} checked={item.completed} onChange={(event) => setChecklist((items) => items.map((current, itemIndex) => itemIndex === index ? { ...current, completed: event.target.checked } : current))} />
            <input type="text" aria-label={`Checklist item ${index + 1}`} placeholder="Add a task" value={item.text} onChange={(event) => setChecklist((items) => items.map((current, itemIndex) => itemIndex === index ? { ...current, text: event.target.value } : current))} />
            <button className="remove-checklist-item" type="button" aria-label={`Remove item ${index + 1}`} onClick={() => setChecklist((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
          </div>)}
          <button className="add-checklist-item" type="button" onClick={() => setChecklist((items) => [...items, { text: '', completed: false }])}>＋ Add checklist item</button>
        </div>}
        <label htmlFor="note-tags">Tags <span className="label-hint">Separate with commas</span></label><input id="note-tags" placeholder="ideas, work, personal" value={tags} onChange={(event) => setTags(event.target.value)} />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="editor-actions"><button type="button" className="button button-quiet" onClick={onClose} disabled={busy}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : note ? 'Save changes' : 'Create note'}</button></div>
      </form>
    </section>
  </div>;
}
function NoteCard({ note, onEdit, onDelete, onPin, onToggleChecklist, busy }) {
  return <article className={`note-card${note.pinned ? ' is-pinned' : ''}`}>
    <div className="card-top"><span className="note-date">{dateLabel(note.updatedAt)}</span><button className={`pin-button${note.pinned ? ' active' : ''}`} type="button" onClick={() => onPin(note)} aria-label={note.pinned ? 'Unpin note' : 'Pin note'} title={note.pinned ? 'Unpin note' : 'Pin note'}>{note.pinned ? '◆' : '◇'} <span>{note.pinned ? 'Pinned' : 'Pin'}</span></button></div>
    <button className="note-body" type="button" onClick={() => onEdit(note)} aria-label={`Edit ${note.title}`}><h3>{note.title}</h3><p>{note.content}</p></button>
    {note.checklistEnabled && note.checklist?.length > 0 && <div className="card-checklist" aria-label="Checklist">
      {note.checklist.map((item, index) => <label className={item.completed ? 'checklist-item completed' : 'checklist-item'} key={item._id || index}>
        <input type="checkbox" checked={item.completed} disabled={busy} onChange={() => onToggleChecklist(note, index)} />
        <span>{item.text}</span>
      </label>)}
    </div>}
    <div className="card-bottom"><div className="tag-list">{note.tags?.length ? note.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>) : <span className="no-tags">No tags</span>}</div><div className="card-actions"><button type="button" onClick={() => onEdit(note)}>Edit</button><button type="button" className="delete-action" onClick={() => onDelete(note)}>Delete</button></div></div>
  </article>;
}
function NoteGrid({ notes, onEdit, onDelete, onPin, onToggleChecklist, busy, emptyText }) {
  if (!notes.length) return <div className="empty-state"><div className="empty-icon">✳</div><h3>{emptyText}</h3><p>Your notes will feel right at home here.</p></div>;
  return <div className="note-grid">{notes.map((note) => <NoteCard key={note._id} note={note} onEdit={onEdit} onDelete={onDelete} onPin={onPin} onToggleChecklist={onToggleChecklist} busy={busy} />)}</div>;
}
function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('mynotes-token');
    const email = localStorage.getItem('mynotes-email');
    return token && email ? { token, user: { email } } : null;
  });
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [tagOptions, setTagOptions] = useState([]);
  async function loadNotes(searchText = query, selectedTag = tag) {
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchText.trim()) params.search = searchText.trim();
      if (selectedTag) params.tag = selectedTag;
      const [result, allResult] = await Promise.all([api.get('/notes', { params }), api.get('/notes')]);
      setNotes(result.data.notes);
      setTagOptions([...new Set(allResult.data.notes.flatMap((note) => note.tags || []))].sort((a, b) => a.localeCompare(b)));
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        signOut();
        return;
      }
      setError(messageFrom(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!auth) return undefined;
    const timer = setTimeout(() => loadNotes(query, tag), 220);
    return () => clearTimeout(timer);
  }, [query, tag, auth?.token]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const pinnedNotes = useMemo(() => notes.filter((note) => note.pinned), [notes]);
  const otherNotes = useMemo(() => notes.filter((note) => !note.pinned), [notes]);
  function acceptAuthentication(data) {
    localStorage.setItem('mynotes-token', data.token);
    localStorage.setItem('mynotes-email', data.user.email);
    setAuth(data);
    setLoading(true);
  }
  function signOut() {
    localStorage.removeItem('mynotes-token');
    localStorage.removeItem('mynotes-email');
    setAuth(null);
    setNotes([]);
    setTagOptions([]);
    setEditor(null);
    setError('');
    setLoading(false);
  }
  async function saveNote(values) {
    setBusy(true);
    try {
      if (editor.note) await api.put(`/notes/${editor.note._id}`, values);
      else await api.post('/notes', values);
      setEditor(null);
      setNotice(editor.note ? 'Your note has been updated.' : 'Your note has been saved.');
      await loadNotes();
    } catch (requestError) {
      if (requestError.response?.status === 401) signOut();
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }
  async function deleteNote(note) {
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.delete(`/notes/${note._id}`);
      setNotice('Note deleted.');
      await loadNotes();
    } catch (requestError) {
      if (requestError.response?.status === 401) signOut();
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }
  async function togglePin(note) {
    setBusy(true);
    try {
      await api.patch(`/notes/${note._id}/pin`);
      setNotice(note.pinned ? 'Note unpinned.' : 'Note pinned to the top.');
      await loadNotes();
    } catch (requestError) {
      if (requestError.response?.status === 401) signOut();
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }
  async function toggleChecklistItem(note, itemIndex) {
    const checklist = note.checklist.map((item, index) => index === itemIndex
      ? { ...item, completed: !item.completed }
      : item);
    setBusy(true);
    try {
      await api.put(`/notes/${note._id}`, {
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        checklistEnabled: true,
        checklist,
      });
      await loadNotes();
    } catch (requestError) {
      if (requestError.response?.status === 401) signOut();
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (!auth) return <AuthScreen onAuthenticated={acceptAuthentication} />;

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="Notes home"><span className="brand-mark">N</span><span>MyNotes</span></a><div className="topbar-right"><span className="signed-in-email">{auth.user.email}</span><button className="button button-quiet signout-button" type="button" onClick={signOut}>Sign out</button><span className="private-label"><span className="status-dot" /> Private notes</span><button className="button button-primary top-add" type="button" onClick={() => setEditor({ note: null })}><span className="plus">＋</span> New note</button></div></header>
    <main id="top" className="main-content">
      <section className="welcome"><div><span className="eyebrow">YOUR PERSONAL NOTEBOOK</span><h1>Good thoughts,<br /><em>kept close.</em></h1><p>A quiet corner for everything on your mind.</p></div><div className="welcome-art" aria-hidden="true"><span className="sun">✳</span><div className="art-paper"><i /><i /><i /><b>✦</b></div><span className="art-dot dot-one" /><span className="art-dot dot-two" /></div></section>
      <section className="toolbar" aria-label="Search and filter notes"><label className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search your notes…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search notes by title or content" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>×</button>}</label><label className="filter-select"><span>Tag</span><select aria-label="Filter by tag" value={tag} onChange={(event) => setTag(event.target.value)}><option value="">All tags</option>{tagOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select><span className="select-chevron">⌄</span></label><span className="note-count">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span></section>
      {error && <div className="alert error-alert" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
      {notice && <div className="alert success-alert" role="status"><span>✓</span>{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}
      {loading ? <div className="loading-state"><span className="loader" />Gathering your thoughts…</div> : <>
        {pinnedNotes.length > 0 && <section className="notes-section"><div className="section-heading"><div><span className="section-symbol pinned-symbol">◆</span><h2>Pinned</h2><span className="section-count">{pinnedNotes.length}</span></div><span className="section-caption">The ones to keep close</span></div><NoteGrid notes={pinnedNotes} onEdit={(note) => setEditor({ note })} onDelete={deleteNote} onPin={togglePin} onToggleChecklist={toggleChecklistItem} busy={busy} emptyText="Nothing pinned yet" /></section>}
        <section className="notes-section"><div className="section-heading"><div><span className="section-symbol">▤</span><h2>{pinnedNotes.length ? 'All notes' : 'Your notes'}</h2><span className="section-count">{otherNotes.length}</span></div><span className="section-caption">Every thought, in one place</span></div><NoteGrid notes={otherNotes} onEdit={(note) => setEditor({ note })} onDelete={deleteNote} onPin={togglePin} onToggleChecklist={toggleChecklistItem} busy={busy} emptyText={query || tag ? 'No notes match those filters' : pinnedNotes.length ? 'All your notes are pinned' : 'Your page is still blank'} /></section>
      </>}
      <footer className="footer"><span>Made for your everyday thoughts</span><span>✳</span></footer>
    </main>
    {editor && <NoteForm key={editor.note?._id || 'new'} note={editor.note} busy={busy} onClose={() => setEditor(null)} onSave={saveNote} />}
  </div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

