import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { render, wikiLinks, slug } from './md.js'
import { layout } from './graph.js'
import { SEED } from './seed.js'

const KEY = 'wasfa:v1'
const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d?.notes?.length) return d } catch (e) {} return { notes: SEED, current: 's1' } }
const uid = () => 'n' + Math.random().toString(36).slice(2, 9)
const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago' }

function Graph({ notes, current, onOpen }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = 420
  const edges = useMemo(() => {
    const byTitle = new Map(notes.map((n) => [slug(n.title), n.id]))
    const e = []
    notes.forEach((n) => wikiLinks(n.body).forEach((t) => { const id = byTitle.get(slug(t)); if (id && id !== n.id) e.push([n.id, id]) }))
    return e
  }, [notes])
  const key = notes.map((n) => n.id).join() + '|' + edges.map((e) => e.join('>')).join()
  const pos = useMemo(() => layout(notes, edges, W, H), [key])
  const at = (id) => pos[notes.findIndex((n) => n.id === id)]
  const near = new Set(); const act = hover || current
  edges.forEach(([a, b]) => { if (a === act) near.add(b); if (b === act) near.add(a) })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="group" aria-label="Graph of linked notes">
      {edges.map(([a, b], i) => { const p = at(a), q = at(b); const on = a === act || b === act
        return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={on ? '#f2b441' : '#2f4439'} strokeWidth={on ? 2 : 1.2} /> })}
      {notes.map((n, i) => { const p = pos[i]; const isCur = n.id === current; const on = isCur || n.id === hover || near.has(n.id)
        const deg = edges.filter(([a, b]) => a === n.id || b === n.id).length
        return (
          <g key={n.id} transform={`translate(${p.x},${p.y})`} tabIndex={0} role="button" aria-label={`Open ${n.title}`} style="cursor:pointer" onClick={() => onOpen(n.id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(n.id)} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}>
            <circle r={9 + deg * 2.5} fill={isCur ? '#f2b441' : on ? '#6fd1a0' : '#1f3328'} stroke={isCur ? '#fff3d0' : '#6fd1a0'} strokeWidth="2" />
            <text y={-16 - deg * 2.5} textAnchor="middle" fill={on ? '#e8efe9' : '#8fa597'} fontSize="13" style="font-family:Inter,sans-serif">{n.title}</text>
          </g>)
      })}
    </svg>
  )
}

export default function App() {
  const [state, setState] = useState(load)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('split')
  const [toast, setToast] = useState('')
  const { notes, current } = state
  const note = notes.find((n) => n.id === current) || notes[0]
  const titles = useMemo(() => new Set(notes.map((n) => slug(n.title))), [notes])
  const html = useMemo(() => render(note.body, titles), [note.body, titles])
  const prev = useRef(null)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)) }, [state])
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800) }
  const open = (id) => setState((s) => ({ ...s, current: id }))
  const titleOf = (b) => (b.match(/^#\s+(.*)/m)?.[1] || '').trim()
  const edit = (body) => setState((s) => ({ ...s, notes: s.notes.map((n) => { if (n.id !== note.id) return n; const t = titleOf(body); return { ...n, body, title: t || n.title, updated: Date.now() } }) }))
  const create = (title = 'Untitled note') => {
    const n = { id: uid(), title, body: `# ${title}\n\n`, updated: Date.now() }
    setState((s) => ({ notes: [n, ...s.notes], current: n.id })); setTab('edit'); return n
  }
  const remove = () => { if (notes.length < 2) return say('Keep at least one note'); setState((s) => { const rest = s.notes.filter((n) => n.id !== note.id); return { notes: rest, current: rest[0].id } }); say('Note deleted') }
  const exportMd = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([note.body], { type: 'text/markdown' })); a.download = slug(note.title).replace(/\s/g, '-') + '.md'; a.click(); say('Exported ' + a.download) }

  const backlinks = useMemo(() => notes.filter((n) => n.id !== note.id && wikiLinks(n.body).some((t) => slug(t) === slug(note.title))), [notes, note])
  const list = notes.filter((n) => !q || (n.title + n.body).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.updated - a.updated)

  const onPreview = (e) => {
    const a = e.target.closest?.('a.wiki')
    if (a) { e.preventDefault(); const t = a.dataset.wiki; const hit = notes.find((n) => slug(n.title) === slug(t)); hit ? open(hit.id) : create(t); return }
    if (e.target.matches?.('input[type=checkbox]')) {
      const ln = +e.target.dataset.line; const lines = note.body.split('\n')
      lines[ln] = lines[ln].replace(/\[( |x)\]/i, e.target.checked ? '[x]' : '[ ]'); edit(lines.join('\n'))
    }
  }

  const Tab = ({ id, children }) => <button onClick={() => setTab(id)} aria-pressed={tab === id} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === id ? 'bg-[#f2b441] text-[#1a1305]' : 'text-[#8fa597] hover:text-white'}`}>{children}</button>

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <aside className="flex max-h-[34vh] shrink-0 flex-col border-b border-[#27382f] bg-[#16211b] md:max-h-none md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 pb-2">
          <h1 className="serif text-2xl font-semibold tracking-tight">Wasfa <span className="text-[#f2b441]">.</span></h1>
          <button onClick={() => create()} className="rounded-md bg-[#f2b441] px-3 py-1.5 text-sm font-semibold text-[#1a1305]">+ New</button>
        </div>
        <div className="px-4 pb-2"><label className="sr-only" htmlFor="q">Search notes</label>
          <input id="q" value={q} onInput={(e) => setQ(e.target.value)} placeholder="Search notes" className="w-full rounded-md border border-[#27382f] bg-[#0f1713] px-3 py-2 text-sm placeholder:text-[#6b8173]" /></div>
        <ul className="flex-1 overflow-y-auto px-2 pb-3">
          {list.map((n) => (
            <li key={n.id}><button onClick={() => open(n.id)} aria-current={n.id === note.id} className={`w-full rounded-lg px-3 py-2 text-left ${n.id === note.id ? 'bg-[#223a2d]' : 'hover:bg-[#1c2d24]'}`}>
              <div className="truncate text-sm font-medium">{n.title}</div>
              <div className="mono text-[10px] text-[#6b8173]">{ago(n.updated)}</div></button></li>))}
          {!list.length && <li className="p-3 text-sm text-[#6b8173]">No notes match.</li>}
        </ul>
        <p className="hidden border-t border-[#27382f] p-3 text-[11px] leading-snug text-[#6b8173] md:block">Saved in this browser only. Export a note to keep a copy.</p>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27382f] px-4 py-2">
          <div className="flex gap-1" role="group" aria-label="View"><Tab id="edit">Edit</Tab><Tab id="preview">Preview</Tab><Tab id="split">Split</Tab><Tab id="graph">Graph</Tab></div>
          <div className="flex gap-2 text-sm"><button onClick={exportMd} className="rounded-md border border-[#2f4439] px-3 py-1.5 hover:bg-[#1c2d24]">Export .md</button><button onClick={remove} className="rounded-md border border-[#4a2f2f] px-3 py-1.5 text-[#ef8c8c] hover:bg-[#2a1b1b]">Delete</button></div>
        </div>
        <div className="flex min-h-0 flex-1">
          {(tab === 'edit' || tab === 'split') && (
            <div className={`min-h-0 ${tab === 'split' ? 'hidden w-1/2 border-r border-[#27382f] md:block' : 'w-full'}`}>
              <label htmlFor="ed" className="sr-only">Note text</label>
              <textarea id="ed" ref={prev} spellcheck={false} value={note.body} onInput={(e) => edit(e.target.value)} className="mono h-full w-full resize-none bg-transparent p-5 text-[14px] leading-relaxed text-[#d7e4da]" />
            </div>)}
          {(tab === 'preview' || tab === 'split') && (
            <div className={`min-h-0 overflow-y-auto ${tab === 'split' ? 'w-full md:w-1/2' : 'w-full'}`}>
              <article className="prose-w mx-auto max-w-2xl px-6 py-8" onClick={onPreview} dangerouslySetInnerHTML={{ __html: html }} />
              <section className="mx-auto max-w-2xl px-6 pb-10" aria-label="Backlinks">
                <h2 className="mono mb-2 text-[11px] uppercase tracking-widest text-[#6b8173]">Backlinks ({backlinks.length})</h2>
                {backlinks.length ? <ul className="flex flex-wrap gap-2">{backlinks.map((b) => <li key={b.id}><button onClick={() => open(b.id)} className="rounded-full border border-[#f2b441]/50 px-3 py-1 text-sm text-[#f2b441] hover:bg-[#f2b441]/10">{b.title}</button></li>)}</ul>
                  : <p className="text-sm text-[#6b8173]">No other note links here yet. Type [[{note.title}]] in another note.</p>}
              </section>
            </div>)}
          {tab === 'graph' && (
            <div className="relative min-h-0 w-full">
              <Graph notes={notes} current={note.id} onOpen={(id) => { open(id); setTab('preview') }} />
              <p className="mono absolute bottom-3 left-4 text-[11px] text-[#6b8173]">{notes.length} notes. Bigger dot means more links. Click a note to open it.</p>
            </div>)}
        </div>
      </main>
      <div role="status" className={`fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-[#e8efe9] px-4 py-2 text-sm font-medium text-[#0f1713] transition ${toast ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>{toast}</div>
    </div>
  )
}
