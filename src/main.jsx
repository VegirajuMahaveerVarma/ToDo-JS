import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, Bell, Check, ChevronRight, Circle, Clock3, Download, Flame, LayoutGrid, ListChecks, Moon, Plus, Search, Settings2, Sparkles, Sun, Target, Trash2, Upload, X } from 'lucide-react';
import './styles.css';
import './daily.css';

const STORAGE = 'taskflow-tasks-v4';
const PROFILE_STORAGE = 'taskflow-profile-v1';
const THEME_STORAGE = 'taskflow-theme-v2';
const TODAY = () => new Date().toISOString().slice(0, 10);
const starterTasks = [
  { id: '1', title: 'Finish ML assignment', category: 'Study', priority: 'High', due: 'Today', time: '19:30', repeat: 'None', done: false },
  { id: '2', title: 'Build the TaskFlow UI', category: 'Work', priority: 'Medium', due: 'Today', time: '21:00', repeat: 'None', done: false },
  { id: '3', title: 'Read for 20 minutes', category: 'Personal', priority: 'Low', due: 'Today', time: '22:15', repeat: 'None', done: true },
  { id: '4', title: 'Plan tomorrow', category: 'Personal', priority: 'Medium', due: 'Tomorrow', time: '18:00', repeat: 'None', done: false },
];
const categories = ['All', 'Study', 'Work', 'Personal'];
const priorities = ['Low', 'Medium', 'High'];
const repeats = ['None', 'Every day', 'Weekdays', 'Every week'];

function readStorage(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function recurringDoneToday(t) { return t.repeat !== 'None' && t.lastDoneDate === TODAY(); }
function isWeekday() { const d = new Date().getDay(); return d >= 1 && d <= 5; }
function isVisibleToday(t) { return t.repeat === 'Every day' || (t.repeat === 'Weekdays' && isWeekday()) || t.due === 'Today'; }

function App() {
  const [profile, setProfile] = useState(() => readStorage(PROFILE_STORAGE, null));
  const [profileForm, setProfileForm] = useState({ name: '', gender: '' });
  const [tasks, setTasks] = useState(() => readStorage(STORAGE, starterTasks));
  const [dark, setDark] = useState(() => readStorage(THEME_STORAGE, 'dark') === 'dark');
  const [view, setView] = useState('tasks');
  const [tab, setTab] = useState('Today');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: 'Study', priority: 'Medium', due: 'Today', time: '', repeat: 'None' });
  const [notice, setNotice] = useState('');

  useEffect(() => localStorage.setItem(STORAGE, JSON.stringify(tasks)), [tasks]);
  useEffect(() => { localStorage.setItem(THEME_STORAGE, JSON.stringify(dark ? 'dark' : 'light')); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.body.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);

  const active = t => t.repeat === 'None' ? t.done : recurringDoneToday(t);
  const todayTasks = tasks.filter(isVisibleToday);
  const completed = todayTasks.filter(active).length;
  const pending = todayTasks.filter(t => !active(t)).length;
  const progress = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;
  const streak = Math.max(1, Math.min(99, Math.floor(tasks.filter(t => t.lastDoneDate).length / 2) + 2));

  const visible = useMemo(() => tasks.filter(t => {
    const done = active(t);
    const matchesTab = tab === 'Today' ? isVisibleToday(t) : tab === 'Daily' ? t.repeat !== 'None' : tab === 'Upcoming' ? t.repeat === 'None' && t.due !== 'Today' && !done : done;
    return matchesTab && (category === 'All' || t.category === category) && t.title.toLowerCase().includes(query.toLowerCase().trim());
  }), [tasks, tab, category, query]);

  const saveProfile = e => { e.preventDefault(); const name = profileForm.name.trim(); if (!name || !profileForm.gender) return; const next = { name, gender: profileForm.gender }; localStorage.setItem(PROFILE_STORAGE, JSON.stringify(next)); setProfile(next); };
  const toggle = id => setTasks(ts => ts.map(t => t.id === id ? (t.repeat === 'None' ? { ...t, done: !t.done } : { ...t, lastDoneDate: recurringDoneToday(t) ? null : TODAY() }) : t));
  const remove = id => setTasks(ts => ts.filter(t => t.id !== id));
  const add = e => { e.preventDefault(); const title = newTask.title.trim(); if (!title) return; setTasks(ts => [{ id: crypto.randomUUID?.() ?? String(Date.now()), ...newTask, done: false, lastDoneDate: null }, ...ts]); setNewTask({ title: '', category: 'Study', priority: 'Medium', due: 'Today', time: '', repeat: 'None' }); setShowAdd(false); setView('tasks'); setTab(newTask.repeat !== 'None' ? 'Daily' : newTask.due === 'Today' ? 'Today' : 'Upcoming'); };
  const requestNotifications = async () => { if (!('Notification' in window)) return setNotice('Notifications are not supported here.'); const p = await Notification.requestPermission(); setNotice(p === 'granted' ? 'Task reminders are enabled on this device.' : 'Notifications were not enabled.'); };
  const exportData = () => { const blob = new Blob([JSON.stringify({ version: 4, exportedAt: new Date().toISOString(), profile, tasks }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `taskflow-backup-${TODAY()}.json`; a.click(); URL.revokeObjectURL(a.href); setNotice('Backup exported.'); };
  const importData = e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (!Array.isArray(data.tasks)) throw new Error(); setTasks(data.tasks); if (data.profile) { setProfile(data.profile); localStorage.setItem(PROFILE_STORAGE, JSON.stringify(data.profile)); } setNotice('Backup restored successfully.'); } catch { setNotice('Invalid TaskFlow backup file.'); } }; reader.readAsText(file); e.target.value = ''; };

  if (!profile) return <div className="app-shell onboarding"><div className="glow glow-one"/><div className="glow glow-two"/><main className="onboarding-card"><span className="eyebrow"><Sparkles size={13}/> TASKFLOW</span><h1>Welcome to TaskFlow<span>.</span></h1><p>Let's keep things simple. Tell us a little about you.</p><form onSubmit={saveProfile}><label>Your name</label><input autoFocus value={profileForm.name} onChange={e => setProfileForm({...profileForm,name:e.target.value})} placeholder="Enter your name" maxLength={30} required/><label>Gender</label><div className="gender-row">{['Male','Female','Other'].map(g => <button type="button" className={profileForm.gender===g?'gender active':'gender'} onClick={() => setProfileForm({...profileForm,gender:g})} key={g}>{g}</button>)}</div><button className="create" type="submit" disabled={!profileForm.name.trim() || !profileForm.gender}>Continue <ChevronRight size={18}/></button></form><small>Your information stays on this device.</small></main></div>;

  return <div className="app-shell"><div className="glow glow-one"/><div className="glow glow-two"/><main className="phone">
    <header className="topbar"><div><span className="eyebrow"><Sparkles size={13}/> TASKFLOW</span><h1>Good evening, {profile.name}<span>.</span></h1><p>{new Intl.DateTimeFormat('en-IN',{weekday:'long',month:'long',day:'numeric'}).format(new Date())} · Keep your momentum going.</p></div><button className="icon-btn" onClick={() => setDark(v => !v)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button></header>
    {view === 'tasks' && <><section className="hero-card"><div><div className="hero-label">TODAY'S FOCUS</div><strong>{pending} <small>tasks remaining</small></strong><p>{pending ? 'One task at a time. You’ve got this.' : 'Everything is under control.'}</p></div><div className="ring" style={{ '--progress': `${progress * 3.6}deg` }}><div><b>{progress}%</b><span>done</span></div></div></section>
      <div className="quick-stats"><div><Flame size={16}/><b>{streak}</b><span>day streak</span></div><div><Target size={16}/><b>{completed}</b><span>completed</span></div><div><Clock3 size={16}/><b>{pending}</b><span>open tasks</span></div></div>
      <div className="section-head"><div><span>YOUR TASKS</span><h2>{tab}</h2></div><button className="add-btn" onClick={() => setShowAdd(true)}><Plus size={19}/><span>Add task</span></button></div>
      <div className="tabs">{['Today','Daily','Upcoming','Done'].map(item => <button className={tab===item?'active':''} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
      <div className="filter-row"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks"/></div><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></div>
      <div className="task-list">{visible.length ? visible.map(t => <article className={`task ${active(t)?'done':''}`} key={t.id}><button className={`check ${active(t)?'checked':''}`} onClick={() => toggle(t.id)}>{active(t)?<Check size={17}/>:<Circle size={19}/>}</button><div className="task-main"><h3>{t.title}</h3><div className="meta"><span className={`tag ${t.category.toLowerCase()}`}>{t.category}</span><span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span>{t.repeat!=='None'&&<span className="repeat-badge">↻ {t.repeat}</span>}{t.time&&<span className="time"><Clock3 size={11}/> {t.time}</span>}</div></div><button className="delete" onClick={() => remove(t.id)}><Trash2 size={16}/></button></article>) : <div className="empty"><ListChecks size={30}/><h3>Nothing here yet</h3><p>Tap “Add task” and make your next move.</p></div>}</div></>}
    {view === 'insights' && <section className="page-card"><span className="eyebrow"><BarChart3 size={13}/> INSIGHTS</span><h2>Your productivity</h2><p className="muted">A simple snapshot of your progress.</p><div className="insight-grid"><div><span>Completion</span><strong>{progress}%</strong></div><div><span>Completed</span><strong>{completed}</strong></div><div><span>Remaining</span><strong>{pending}</strong></div><div><span>Streak</span><strong>{streak}d</strong></div></div><div className="progress-track"><span style={{width:`${progress}%`}}/></div><div className="insight-note"><Target size={18}/><div><b>Keep the streak alive</b><p>Finish one meaningful task before adding another.</p></div></div></section>}
    {view === 'settings' && <section className="page-card"><span className="eyebrow"><Settings2 size={13}/> SETTINGS</span><h2>Make TaskFlow yours</h2><div className="setting-row"><div><b>Profile</b><span>{profile.name} · {profile.gender}</span></div></div><div className="setting-row"><div><b>Appearance</b><span>{dark?'Dark theme':'Light theme'}</span></div><button className="setting-toggle" onClick={() => setDark(v=>!v)}>{dark?'Dark':'Light'}</button></div><div className="setting-row"><div><b>Notifications</b><span>Optional task reminders.</span></div><button className="setting-toggle" onClick={requestNotifications}><Bell size={14}/> Enable</button></div><div className="setting-row"><div><b>Local storage</b><span>Your tasks stay on this device.</span></div><span className="status-dot">Local</span></div><div className="backup-actions"><button onClick={exportData}><Download size={15}/> Export backup</button><label><Upload size={15}/> Restore backup<input type="file" accept="application/json" onChange={importData}/></label></div><div className="about"><Sparkles size={18}/><div><b>TaskFlow by Maha</b><p>Offline-first personal productivity.</p></div></div><button className="danger" onClick={() => {if(window.confirm('Reset all tasks?')) setTasks(starterTasks);}}>Reset demo tasks</button></section>}
    <nav className="bottom-nav"><button className={view==='tasks'?'selected':''} onClick={()=>setView('tasks')}><LayoutGrid size={19}/><span>Tasks</span></button><button className={view==='insights'?'selected':''} onClick={()=>setView('insights')}><BarChart3 size={19}/><span>Insights</span></button><button className={view==='settings'?'selected':''} onClick={()=>setView('settings')}><Settings2 size={19}/><span>Settings</span></button></nav><footer>Designed & developed by <b>Maha</b></footer>
  </main>
  {notice&&<div className="toast" onClick={()=>setNotice('')}>{notice}</div>}
  {showAdd&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowAdd(false)}><form className="sheet" onSubmit={add}><div className="sheet-head"><div><span className="eyebrow">NEW TASK</span><h2>What's next?</h2></div><button type="button" className="icon-btn" onClick={()=>setShowAdd(false)}><X size={18}/></button></div><input autoFocus className="task-input" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} placeholder="e.g. Study for 30 minutes" maxLength={100}/><div className="field"><label>Category</label><div className="choice-row">{categories.slice(1).map(x=><button type="button" className={newTask.category===x?'choice active':'choice'} onClick={()=>setNewTask({...newTask,category:x})} key={x}>{x}</button>)}</div></div><div className="field"><label>Priority</label><div className="choice-row">{priorities.map(x=><button type="button" className={newTask.priority===x?'choice active':'choice'} onClick={()=>setNewTask({...newTask,priority:x})} key={x}>{x}</button>)}</div></div><div className="field"><label>Repeat</label><div className="choice-row repeat-options">{repeats.map(x=><button type="button" className={newTask.repeat===x?'choice active':'choice'} onClick={()=>setNewTask({...newTask,repeat:x})} key={x}>{x}</button>)}</div></div><div className="form-row"><div className="field"><label>Due</label><select value={newTask.due} onChange={e=>setNewTask({...newTask,due:e.target.value})}><option>Today</option><option>Tomorrow</option><option>Later</option></select></div><div className="field"><label>Time</label><input type="time" value={newTask.time} onChange={e=>setNewTask({...newTask,time:e.target.value})}/></div></div><button className="create" type="submit">Create task <ChevronRight size={18}/></button></form></div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
