// A small Markdown renderer. Escapes HTML first, so the output is safe to inject.
export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const slug = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ')

export function wikiLinks(src) {
  const out = []
  const re = /\[\[([^\]\n]+)\]\]/g
  let m
  while ((m = re.exec(src))) out.push(m[1].split('|')[0].trim())
  return out
}

function inline(s, titles) {
  s = esc(s)
  const codes = []
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000` })
  s = s.replace(/\[\[([^\]]+)\]\]/g, (_, body) => {
    const [t, label] = body.split('|')
    const ok = titles.has(slug(t.replace(/&amp;/g, '&')))
    return `<a class="wiki${ok ? '' : ' missing'}" data-wiki="${t.trim()}" href="#" title="${ok ? 'Open note' : 'Create this note'}">${(label || t).trim()}</a>`
  })
  s = s.replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, '<img alt="$1" src="$2" style="max-width:100%;border-radius:8px" />')
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`)
}

export function render(src, titles) {
  const lines = src.split('\n')
  const html = []
  let i = 0
  while (i < lines.length) {
    const ln = lines[i]
    if (/^```/.test(ln)) {
      const buf = []; i++
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++])
      i++; html.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue
    }
    const h = ln.match(/^(#{1,3})\s+(.*)/)
    if (h) { html.push(`<h${h[1].length}>${inline(h[2], titles)}</h${h[1].length}>`); i++; continue }
    if (/^---+\s*$/.test(ln)) { html.push('<hr>'); i++; continue }
    if (/^>\s?/.test(ln)) {
      const buf = []
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''))
      html.push(`<blockquote>${inline(buf.join(' '), titles)}</blockquote>`); continue
    }
    if (/^\s*[-*]\s+/.test(ln)) {
      const items = []; let task = false
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const t = lines[i].replace(/^\s*[-*]\s+/, '')
        const c = t.match(/^\[( |x)\]\s+(.*)/i)
        if (c) { task = true; items.push(`<li><label><input type="checkbox" data-line="${i}" ${c[1] !== ' ' ? 'checked' : ''}>${inline(c[2], titles)}</label></li>`) }
        else items.push(`<li>${inline(t, titles)}</li>`)
        i++
      }
      html.push(`<ul${task ? ' class="tasks"' : ''}>${items.join('')}</ul>`); continue
    }
    if (/^\d+\.\s+/.test(ln)) {
      const items = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\d+\.\s+/, ''), titles)}</li>`)
      html.push(`<ol>${items.join('')}</ol>`); continue
    }
    if (!ln.trim()) { i++; continue }
    const buf = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|---+\s*$|\s*[-*]\s+|\d+\.\s+)/.test(lines[i])) buf.push(lines[i++])
    html.push(`<p>${inline(buf.join(' '), titles)}</p>`)
  }
  return html.join('\n')
}
