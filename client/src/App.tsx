import { FormEvent, useEffect, useMemo, useState } from 'react'

type Task = { id: number; title: string; completed: boolean; created_at: string }
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadTasks() {
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/tasks`)
      if (!response.ok) throw new Error('Impossible de charger les tâches.')
      setTasks(await response.json() as Task[])
    } catch {
      setError('Connexion à l’API impossible. Vérifie sa disponibilité et la configuration CORS.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTasks() }, [])

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    const response = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: cleanTitle }),
    })
    if (!response.ok) { setError('La tâche n’a pas pu être créée.'); return }
    setTitle('')
    await loadTasks()
  }

  async function toggleTask(task: Task) {
    const response = await fetch(`${API_URL}/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
    if (response.ok) await loadTasks()
    else setError('La tâche n’a pas pu être mise à jour.')
  }

  async function deleteTask(task: Task) {
    const response = await fetch(`${API_URL}/api/tasks/${task.id}`, { method: 'DELETE' })
    if (response.ok) await loadTasks()
    else setError('La tâche n’a pas pu être supprimée.')
  }

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (filter === 'open') return !task.completed
    if (filter === 'done') return task.completed
    return true
  }), [tasks, filter])
  const remaining = tasks.filter((task) => !task.completed).length

  return (
    <main className="shell">
      <header className="topbar"><a className="brand" href="#">tb<span>.</span></a><span className="top-note">ESPACE PERSONNEL</span></header>
      <section className="intro">
        <p className="eyebrow">VOTRE ESPACE DE TRAVAIL</p>
        <h1>Une chose<br /><em>à la fois.</em></h1>
        <p className="lede">Notez vos idées, avancez à votre rythme et gardez l’essentiel en vue.</p>
      </section>
      <section className="board" aria-label="Liste de tâches">
        <div className="board-head"><div><span className="section-kicker">AUJOURD’HUI</span><h2>Ma liste <span className="count">{remaining}</span></h2></div>
          <div className="filters" aria-label="Filtres">
            <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Tout</button>
            <button className={filter === 'open' ? 'selected' : ''} onClick={() => setFilter('open')}>À faire</button>
            <button className={filter === 'done' ? 'selected' : ''} onClick={() => setFilter('done')}>Terminées</button>
          </div>
        </div>
        <form className="add-form" onSubmit={addTask}>
          <label className="sr-only" htmlFor="new-task">Nouvelle tâche</label>
          <input id="new-task" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Ajouter une tâche…" />
          <button type="submit" aria-label="Ajouter la tâche">＋</button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <p className="empty">Chargement…</p> : visibleTasks.length === 0 ?
          <div className="empty"><span className="empty-mark">✳</span><p>{tasks.length === 0 ? 'Votre liste commence ici.' : 'Rien dans cette sélection.'}</p></div> :
          <ul className="task-list">{visibleTasks.map((task) => <li className={task.completed ? 'task done' : 'task'} key={task.id}>
            <button className="check" aria-label={task.completed ? `Marquer ${task.title} à faire` : `Terminer ${task.title}`} onClick={() => void toggleTask(task)}>{task.completed ? '✓' : ''}</button>
            <span className="task-title">{task.title}</span>
            <button className="delete" aria-label={`Supprimer ${task.title}`} onClick={() => void deleteTask(task)}>×</button>
          </li>)}</ul>}
        <footer className="board-foot"><span>{remaining} tâche{remaining > 1 ? 's' : ''} à terminer</span><span>FAIT AVEC INTENTION <b>✳</b></span></footer>
      </section>
      <footer className="page-foot">TASKBOARD <span>·</span> UN PETIT PAS APRÈS L’AUTRE</footer>
    </main>
  )
}
