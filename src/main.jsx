import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, ChevronRight, Circle, Clock3, Flame, LayoutGrid, ListChecks, Moon, Plus, Search, Settings2, Sparkles, Sun, Target, Trash2, X } from 'lucide-react';
import './styles.css';

const seed = [
  { id: 1, title: 'Finish ML assignment', category: 'Study', priority: 'High', due: 'Today', done: false },
  { id: 2, title: 'Build the TaskFlow UI', category: 'Work', priority: 'Medium', due: 'Today', done: false },
  { id: 3, title: 'Read for 20 minutes', category: 'Personal', priority: 'Low', due: 'Today', done: true },
  { id: 4, title: 'Plan tomorrow', category: 'Personal', priority: 'Medium', due: 'Tomorrow', done: false },
];

const categories = ['All', 'Study', 'Work', 'Personal'];

function App() {
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('taskflow-tasks') || 'null') || seed);
  const [dark, setDark] = useState(() => localStorage.getItem('taskflow-theme') !== 'light');
  const [tab, setTab] = useState('Today');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: 'Study', priority: 'Medium' });

  useEffect(() => localStorage.setItem('taskflow-tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => { localStorage.setItem('taskflow-theme', dark ? 'dark' : 'light'); document.body.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);

  const today = tasks.filter(t => t.due === 'Today');
  const completed = tasks.filter(t => t.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const visible = useMemo(() => tasks.filter(t => {
    const matchesTab = tab === 'Today' ? t.due === 'Today' : tab === 'Upcoming' ? t.due !== 'Today' : t.done;
    const matchesCat = category === 'All' || t.category === category;
    const matchesSearch = t.title.toLowerCase().includes(query.toLowerCase());
    return matchesTab && matchesCat && matchesSearch;
  }), [tasks, tab, category, query]);

  const toggle = id => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = id => setTasks(ts => ts.filter(t => t.id !== id));
  const add = e => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setTasks(ts => [{ id: Date.now(), ...newTask, due: 'Today', done: false }, ...ts]);
    setNewTask({ title: '', category: 'Study', priority: 'Medium' }); setShowAdd(false); setTab('Today');
  };

  return <div className="app-shell">
    <div className="glow glow-one"/><div className="glow glow-two"/>
    <main className="phone">
      <header className="topbar">
        <div><span className="eyebrow"><Sparkles size={13}/> TASKFLOW</span><h1>Good evening, Maha<span>.</span></h1><p>Let's make today count.</p></div>
        <button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
      </header>

      <section className="hero-card">
        <div><div className="hero-label">TODAY'S FOCUS</div><strong>{today.filter(t => !t.done).length} tasks <small>remaining</small></strong><p>Keep your momentum going.</p></div>
        <div className="ring" style={{'--progress': `${progress * 3.6}deg`}}><div><b>{progress}%</b><span>done</span></div></div>
      </section>

      <div className="quick-stats"><div><Flame size={16}/><b>4</b><span>day streak</span></div><div><Target size={16}/><b>{completed}</b><span>completed</span></div><div><Clock3 size={16}/><b>82%</b><span>focus score</span></div></div>

      <div className="section-head"><div><span>YOUR TASKS</span><h2>{tab}</h2></div><button className="add-btn" onClick={() => setShowAdd(true)}><Plus size={19}/><span>Add task</span></button></div>

      <div className="tabs">{['Today', 'Upcoming', 'Done'].map(t => <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>

      <div className="filter-row"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks"/></div><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>

      <div className="task-list">{visible.length ? visible.map(t => <article className={`task ${t.done ? 'done' : ''}`} key={t.id}>
        <button className={`check ${t.done ? 'checked' : ''}`} onClick={() => toggle(t.id)}>{t.done ? <Check size={17}/> : <Circle size={19}/>}</button>
        <div className="task-main"><h3>{t.title}</h3><div className="meta"><span className={`tag ${t.category.toLowerCase()}`}>{t.category}</span><span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span></div></div>
        <button className="delete" onClick={() => remove(t.id)} aria-label="Delete task"><Trash2 size={16}/></button>
      </article>) : <div className="empty"><ListChecks size={30}/><h3>Nothing here yet</h3><p>You're clear. Enjoy the moment.</p></div>}</div>

      <nav className="bottom-nav"><button className="selected"><LayoutGrid size={19}/><span>Tasks</span></button><button><Target size={19}/><span>Insights</span></button><button><Settings2 size={19}/><span>Settings</span></button></nav>
      <footer>Designed & developed by <b>Maha</b></footer>
    </main>

    {showAdd && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowAdd(false)}><form className="sheet" onSubmit={add}><div className="sheet-head"><div><span className="eyebrow">NEW TASK</span><h2>What's next?</h2></div><button type="button" className="icon-btn" onClick={() => setShowAdd(false)}><X size={18}/></button></div><input autoFocus className="task-input" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Finish project presentation"/><div className="field"><label>Category</label><div className="choice-row">{['Study','Work','Personal'].map(c => <button type="button" className={newTask.category === c ? 'choice active' : 'choice'} onClick={() => setNewTask({...newTask, category:c})} key={c}>{c}</button>)}</div></div><div className="field"><label>Priority</label><div className="choice-row">{['Low','Medium','High'].map(p => <button type="button" className={newTask.priority === p ? 'choice active' : 'choice'} onClick={() => setNewTask({...newTask, priority:p})} key={p}>{p}</button>)}</div></div><button className="create" type="submit">Create task <ChevronRight size={18}/></button></form></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
