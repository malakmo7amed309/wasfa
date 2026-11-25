// Tiny force layout: repulsion between all nodes, springs along links, pull to centre.
export function layout(nodes, edges, W, H, iters = 260) {
  const n = nodes.length
  const pos = nodes.map((_, i) => ({ x: W / 2 + Math.cos((i / n) * 6.283) * 120, y: H / 2 + Math.sin((i / n) * 6.283) * 90, vx: 0, vy: 0 }))
  const idx = new Map(nodes.map((nd, i) => [nd.id, i]))
  const E = edges.map(([a, b]) => [idx.get(a), idx.get(b)]).filter(([a, b]) => a !== undefined && b !== undefined && a !== b)
  for (let k = 0; k < iters; k++) {
    const cool = 1 - k / iters
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y
      let d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2)
      const f = 5200 / d2
      dx /= d; dy /= d
      pos[i].vx += dx * f; pos[i].vy += dy * f; pos[j].vx -= dx * f; pos[j].vy -= dy * f
    }
    for (const [a, b] of E) {
      const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y, d = Math.sqrt(dx * dx + dy * dy) + 0.01
      const f = (d - 130) * 0.04
      pos[a].vx += (dx / d) * f; pos[a].vy += (dy / d) * f; pos[b].vx -= (dx / d) * f; pos[b].vy -= (dy / d) * f
    }
    for (const p of pos) {
      p.vx += (W / 2 - p.x) * 0.012; p.vy += (H / 2 - p.y) * 0.012
      p.x += Math.max(-12, Math.min(12, p.vx)) * cool; p.y += Math.max(-12, Math.min(12, p.vy)) * cool
      p.vx *= 0.6; p.vy *= 0.6
      p.x = Math.max(60, Math.min(W - 60, p.x)); p.y = Math.max(30, Math.min(H - 30, p.y))
    }
  }
  return pos
}
