/* eslint-disable no-await-in-loop */
const QUERY = 'prism';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rect(el, stage) {
  const s = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    x: r.left - s.left + r.width / 2,
    y: r.top - s.top + r.height / 2,
    width: r.width,
    height: r.height,
    top: r.top - s.top,
    left: r.left - s.left,
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function moveCursor(cursor, x, y) {
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
}

function setHighlight(highlight, target, stage, on) {
  if (!on) {
    highlight.classList.remove('is-visible');
    return;
  }
  const r = rect(target, stage);
  highlight.style.left = `${r.left - 2}px`;
  highlight.style.top = `${r.top - 2}px`;
  highlight.style.width = `${r.width + 4}px`;
  highlight.style.height = `${r.height + 4}px`;
  highlight.classList.add('is-visible');
}

async function runLoop(stage) {
  const search = stage.querySelector('[data-target="search"]');
  const searchText = stage.querySelector('[data-target="search-text"]');
  const project = stage.querySelector('[data-target="project"]');
  const chip = stage.querySelector('[data-target="chip"]');
  const highlight = stage.querySelector('[data-target="highlight"]');
  const cursor = stage.querySelector('[data-target="cursor"]');

  const reset = () => {
    search.classList.remove('is-focus');
    searchText.textContent = 'Search projects…';
    project.classList.remove('is-active');
    chip.classList.remove('is-visible');
    setHighlight(highlight, project, stage, false);
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    reset();
    await wait(700);
    cursor.classList.add('is-visible');
    const s = rect(search, stage);
    moveCursor(cursor, s.x, s.y);
    await wait(400);
    search.classList.add('is-focus');
    searchText.textContent = '';
    for (let i = 0; i < QUERY.length; i += 1) {
      searchText.textContent += QUERY[i];
      // eslint-disable-next-line no-await-in-loop
      await wait(90);
    }
    await wait(400);
    const p = rect(project, stage);
    moveCursor(cursor, p.x, p.y);
    setHighlight(highlight, project, stage, true);
    await wait(350);
    project.classList.add('is-active');
    setHighlight(highlight, project, stage, false);
    search.classList.remove('is-focus');
    chip.classList.add('is-visible');
    await wait(2200);
    cursor.classList.remove('is-visible');
    await wait(400);
  }
}

export default async function decorate(block) {
  if (prefersReducedMotion()) {
    block.classList.add('is-reduced');
    const searchText = block.querySelector('[data-target="search-text"]');
    const project = block.querySelector('[data-target="project"]');
    const chip = block.querySelector('[data-target="chip"]');
    if (searchText) searchText.textContent = QUERY;
    project?.classList.add('is-active');
    chip?.classList.add('is-visible');
    return;
  }

  runLoop(block);
}
