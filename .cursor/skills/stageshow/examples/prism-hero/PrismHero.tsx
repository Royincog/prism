import { Bar, Stage, Window, box, inset, type Act } from '../../kit'
import './look-prism.css'
import './prism-hero.css'

type S = {
  query: string
  focus: boolean
  highlight: boolean
  chip: boolean
}

const initial: S = { query: '', focus: false, highlight: false, chip: false }

const POSTER: S = { query: 'prism', focus: false, highlight: false, chip: true }

const REST = { wide: { x: 520, y: 280 }, compact: { x: 260, y: 340 } }

async function script(a: Act<S>) {
  await a.wait(700)
  await a.move('search')
  await a.click()
  await a.set({ focus: true })
  await a.type('query', 'prism')
  await a.wait(500)
  await a.move('project')
  await a.set({ highlight: true })
  await a.wait(350)
  await a.click()
  await a.set({ highlight: false, focus: false, chip: true })
  await a.wait(2200)
  await a.set({ ...initial })
  await a.move('rest')
  await a.wait(400)
}

export function PrismHero() {
  return (
    <Stage<S>
      width={720}
      height={340}
      compact={{ below: 600, width: 358, height: 400 }}
      theme="dark"
      className="ph look-prism"
      initial={initial}
      poster={POSTER}
      script={script}
      cursor={{ at: REST }}
    >
      {(s, rect, layout) => (
        <>
          <Window url="prism.dev/workspace" className="ph-win">
            <div className="ph-body">
              <header className="ph-head">
                <div className="ph-title" data-target="title">
                  Workspace
                </div>
                <div className="ph-search" data-target="search" data-cursor="ibeam" data-focus={s.focus || undefined}>
                  {s.query || 'Search projects…'}
                </div>
              </header>
              <div className="ph-list">
                <div className="ph-row" data-target="project" data-active={s.chip || undefined}>
                  <div>
                    <div className="ph-row-name">Prism EDS</div>
                    <div className="ph-row-meta">Edge Delivery · Portfolio</div>
                  </div>
                  <div className="ph-chip" data-show={s.chip || undefined} data-target="chip">
                    Open to work
                  </div>
                </div>
                {[
                  [140, 90],
                  [120, 70],
                ].map(([a, b], i) => (
                  <div key={i} className="ph-row">
                    <div>
                      <Bar w={a} h={8} r={4} tone={2} style={{ marginBottom: 6 }} />
                      <Bar w={b} h={6} r={3} tone={1} />
                    </div>
                    <Bar w={48} h={18} r={9} tone={1} />
                  </div>
                ))}
              </div>
            </div>
          </Window>
          <div className="ph-highlight" data-show={s.highlight || undefined} style={box(inset(rect('project'), 2))} />
          <span data-target="rest" style={{ position: 'absolute', left: REST[layout].x, top: REST[layout].y }} />
        </>
      )}
    </Stage>
  )
}
