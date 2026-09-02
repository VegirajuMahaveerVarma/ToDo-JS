import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, ChevronRight, Circle, Clock3, Flame, LayoutGrid, ListChecks, Moon, Plus, Search, Settings2, Sparkles, Sun, Target, Trash2, X, BarChart3 } from 'lucide-react';
import './styles.css';

const STORAGE = 'taskflow-tasks-v2';
const THEME_STORAGE = 'taskflow-theme-v2';
const starterTasks = [
  { id: '1', title: 'Finish ML assignment', category: 'Study', priority: 'High', due: 'Today', time: '19:30', done: false },
  { id: '2', title: 'Build the TaskFlow UI', category: 'Work', priority: 'Medium', due: 'Today', time: '21:00', done: false },
  { id: '3', title: 'Read for 20 minutes', category: 'Personal', priority: 'Low', due: 'Today', time: '22:15', done: true },
  { id: '4', title: 'Plan tomorrow', category: 'Personal', priority: 'Medium', due: 'Tomorrow', time: '18:00', done: false },
];
const categories = ['All', 'Study', 'Work', 'Personal'];
const priorities = ['Low', 'Medium', 'High'];
const navItems = [
  { id: 'tasks', label: 'Tasks', icon: LayoutGrid },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function dateLabel() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function App() {
  const [tasks, setTasks] = useState(() => readStorage(STORAGE, starterTasks));
  const [dark, setDark] = useState(() => readStorage(THEME_STORAGE, 'dark') === 'dark');
  const [view, setView] = useState('tasks');
  const [tab, setTab] = useState('Today');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: 'Study', priority: 'Medium', due: 'Today', time: '' });

  useEffect(() => localStorage.setItem(STORAGE, JSON.stringify(tasks)), [tasks]);
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE, JSON.stringify(dark ? 'dark' : 'light'));
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.body.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  const todayTasks = tasks.filter(t => t.due === 'Today');
  const completed = tasks.filter(t => t.done).length;
  const pending = tasks.filter(t => !t.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const streak = Math.max(1, Math.min(21, Math.floor(completed / 2) + 2));

  const visible = useMemo(() => tasks.filter(t => {
    const matchesTab = tab === 'Today' ? t.due === 'Today' : tab === 'Upcoming' ? t.due !== 'Today' && !t.done : t.done;
    const matchesCategory = category === 'All' || t.category === category;
    const matchesSearch = t.title.toLowerCase().includes(query.toLowerCase().trim());
    return matchesTab && matchesCategory && matchesSearch;
  }), [tasks, tab, category, query]);

  const toggle = id => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = id => setTasks(ts => ts.filter(t => t.id !== id));
  const add = event => {
    event.preventDefault();
    const title = newTask.title.trim();
    if (!title) return;
    setTasks(ts => [{ id: crypto.randomUUID?.() ?? String(Date.now()), ...newTask, title, done: false }, ...ts]);
    setNewTask({ title: '', category: 'Study', priority: 'Medium', due: 'Today', time: '' });
    setShowAdd(false);
    setView('tasks');
    setTab(newTask.due === 'Today' ? 'Today' : 'Upcoming');
  };

  return <div className="app-shell">
    <div className="glow glow-one"/><div className="glow glow-two"/>
    <main className="phone">
      <header className="topbar">
        <div><span className="eyebrow"><Sparkles size={13}/> TASKFLOW</span><h1>Good evening, Maha<span>.</span></h1><p>{dateLabel()} · Keep your momentum going.</p></div>
        <button className="icon-btn" onClick={() => setDark(v => !v)} aria-label="Toggle theme">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
      </header>

      {view === 'tasks' && <>
        <section className="hero-card">
          <div><div className="hero-label">TODAY'S FOCUS</div><strong>{todayTasks.filter(t => !t.done).length} <small>tasks remaining</small></strong><p>{pending === 0 ? 'Everything is under control.' : 'One task at a time. You’ve got this.'}</p></div>
          <div className="ring" style={{ '--progress': `${progress * 3.6}deg` }}><div><b>{progress}%</b><span>done</span></div></div>
        </section>
        <div className="quick-stats"><div><Flame size={16}/><b>{streak}</b><span>day streak</span></div><div><Target size={16}/><b>{completed}</b><span>completed</span></div><div><Clock3 size={16}/><b>{pending}</b><span>open tasks</span></div></div>
        <div className="section-head"><div><span>YOUR TASKS</span><h2>{tab}</h2></div><button className="add-btn" onClick={() => setShowAdd(true)}><Plus size={19}/><span>Add task</span></button></div>
        <div className="tabs">{['Today', 'Upcoming', 'Done'].map(item => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
        <div className="filter-row"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks"/></div><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category">{categories.map(item => <option key={item}>{item}</option>)}</select></div>
        <div className="task-list">{visible.length ? visible.map(task => <article className={`task ${task.done ? 'done' : ''}`} key={task.id}>
          <button className={`check ${task.done ? 'checked' : ''}`} onClick={() => toggle(task.id)} aria-label={task.done ? 'Mark incomplete' : 'Complete task'}>{task.done ? <Check size={17}/> : <Circle size={19}/>}</button>
          <div className="task-main"><h3>{task.title}</h3><div className="meta"><span className={`tag ${task.category.toLowerCase()}`}>{task.category}</span><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>{task.time && <span className="time"><Clock3 size={11}/> {task.time}</span>}</div></div>
          <button className="delete" onClick={() => remove(task.id)} aria-label="Delete task"><Trash2 size={16}/></button>
        </article>) : <div className="empty"><ListChecks size={30}/><h3>Nothing here yet</h3><p>Tap “Add task” and make your next move.</p></div>}</div>
      </>}

      {view === 'insights' && <section className="page-card"><span className="eyebrow"><BarChart3 size={13}/> INSIGHTS</span><h2>Your productivity</h2><p className="muted">A simple snapshot of how you're moving this week.</p><div className="insight-grid"><div><span>Completion</span><strong>{progress}%</strong></div><div><span>Completed</span><strong>{completed}</strong></div><div><span>Remaining</span><strong>{pending}</strong></div><div><span>Streak</span><strong>{streak}d</strong></div></div><div className="progress-track"><span style={{ width: `${progress}%` }}/></div><div className="insight-note"><Target size={18}/><div><b>Keep the streak alive</b><p>Finish one meaningful task before adding another.</p></div></div></section>}

      {view === 'settings' && <section className="page-card"><span className="eyebrow"><Settings2 size={13}/> SETTINGS</span><h2>Make TaskFlow yours</h2><div className="setting-row"><div><b>Appearance</b><span>{dark ? 'Dark theme' : 'Light theme'}</span></div><button className="setting-toggle" onClick={() => setDark(v => !v)}>{dark ? 'Dark' : 'Light'}</button></div><div className="setting-row"><div><b>Storage</b><span>Tasks are saved on this device.</span></div><span className="status-dot">Local</span></div><div className="about"><Sparkles size={18}/><div><b>TaskFlow by Maha</b><p>A premium personal productivity experience.</p></div></div><button className="danger" onClick={() => { if (window.confirm('Reset all tasks?')) setTasks(starterTasks); }}>Reset demo tasks</button></section>}

      <nav className="bottom-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'selected' : ''} onClick={() => setView(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <footer>Designed & developed by <b>Maha</b></footer>
    </main>

    {showAdd && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowAdd(false)}><form className="sheet" onSubmit={add}><div className="sheet-head"><div><span className="eyebrow">NEW TASK</span><h2>What's next?</h2></div><button type="button" className="icon-btn" onClick={() => setShowAdd(false)}><X size={18}/></button></div><input autoFocus className="task-input" value={newTask.title} onChange={e => setNewTask({...newTask, title:e.target.value})} placeholder="e.g. Finish project presentation" maxLength={100}/><div className="field"><label>Category</label><div className="choice-row">{categories.slice(1).map(item => <button type="button" className={newTask.category === item ? 'choice active' : 'choice'} onClick={() => setNewTask({...newTask, category:item})} key={item}>{item}</button>)}</div></div><div className="field"><label>Priority</label><div className="choice-row">{priorities.map(item => <button type="button" className={newTask.priority === item ? 'choice active' : 'choice'} onClick={() => setNewTask({...newTask, priority:item})} key={item}>{item}</button>)}</div></div><div className="form-row"><div className="field"><label>Due</label><select value={newTask.due} onChange={e => setNewTask({...newTask,due:e.target.value})}><option>Today</option><option>Tomorrow</option><option>Later</option></select></div><div className="field"><label>Time</label><input type="time" value={newTask.time} onChange={e => setNewTask({...newTask,time:e.target.value})}/></div></div><button className="create" type="submit">Create task <ChevronRight size={18}/></button></form></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
