const t = Date.now()
export const SEED = [
  { id: 's1', updated: t - 0*60000, title: 'Welcome', body: `# Welcome to Wasfa

Wasfa is a notebook where **notes link to each other**. Type \`[[\` and a note title to connect ideas, like [[Interview prep]] or [[Project ideas]].

- Links turn amber. A red link points to a note that does not exist yet. Click it to create it.
- Every note shows its **backlinks** underneath.
- Open the **Graph** tab to see the whole web of notes.

> Notes are saved in this browser. Use Export to keep a copy.

See [[Markdown cheatsheet]] for the formatting you can use.` },
  { id: 's2', updated: t - 3*60000, title: 'Markdown cheatsheet', body: `# Markdown cheatsheet

## Text
**bold**, *italic*, ~~strike~~, \`inline code\` and [a link](https://developer.mozilla.org).

## Lists
1. Ordered
2. Lists

- [x] Task lists you can tick in the preview
- [ ] This one is still open

## Code
\`\`\`
const hello = () => 'world'
\`\`\`

Back to [[Welcome]].` },
  { id: 's3', updated: t - 26*60000, title: 'Interview prep', body: `# Interview prep

## Questions I should be ready for
- Explain the virtual DOM in your own words
- Walk through [[Project ideas]] I built and why
- What would you improve about your last project?

## Checklist
- [x] Update the portfolio
- [ ] Practice the "tell me about yourself" answer
- [ ] Read about [[React hooks]]

> Keep answers under two minutes.` },
  { id: 's4', updated: t - 50*60000, title: 'Project ideas', body: `# Project ideas

1. A trains app with real timetables
2. A WCAG checker that outlines problems on the page
3. A gallery of CSS animations

Each one goes in the portfolio. Notes for the interview are in [[Interview prep]].

Related: [[React hooks]]` },
  { id: 's5', updated: t - 200*60000, title: 'React hooks', body: `# React hooks

- \`useState\` keeps local state
- \`useEffect\` runs side effects after render
- \`useMemo\` caches an expensive result

Used in most of my [[Project ideas]]. Also listed in [[Interview prep]].` },
]
