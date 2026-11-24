(() => {
  const preview = document.querySelector('#landingPage .cl-preview');
  if (!preview) return;
  const tablist = preview.querySelector('.cl-preview-tabs');
  const tabs = [...tablist.querySelectorAll('button[data-preview]')];
  const panels = tabs.map(tab => document.getElementById('preview-' + tab.dataset.preview));
  if (!tabs.length || panels.some(panel => !panel)) return;

  tablist.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].tabIndex = 0;
  });

  function select(index, focus = false) {
    tabs.forEach((tab, position) => {
      const active = position === index;
      tab.tabIndex = active ? 0 : -1;
      tab.setAttribute('aria-selected', String(active));
      panels[position].hidden = !active;
    });
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => tab.addEventListener('click', () => select(index)));
  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const moves = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1};
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select((next + tabs.length) % tabs.length, true);
  });
  select(0);
})();
