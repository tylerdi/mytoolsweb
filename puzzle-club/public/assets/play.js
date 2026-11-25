(() => {
  const form = document.querySelector('[data-puzzle]');
  const key = 'three-minute-puzzles:v1:';
  const load = (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  };

  const questions = [...document.querySelectorAll('[data-question]')];
  if (questions.length) {
    const showProgress = () => {
      for (const link of questions) {
        link.querySelector('[data-done]').hidden = load(key + link.dataset.question) === null;
      }
    };
    showProgress();
    // Back navigation can restore the catalog without executing this script again.
    window.addEventListener('pageshow', showProgress);
  }

  if (!form) return;
  const puzzleKey = key + form.dataset.key;
  const save = (value) => {
    try {
      if (value === null) localStorage.removeItem(puzzleKey);
      else localStorage.setItem(puzzleKey, String(value));
    } catch {
      // All play controls still work without storage.
    }
  };

  const submit = form.querySelector('[data-submit]');
  const result = document.querySelector('[data-result]');
  const verdict = result.querySelector('[data-verdict]');
  const options = [...form.querySelectorAll('input[name="answer"]')];
  const answer = Number(form.dataset.answer);
  const evidence = form.dataset.evidence.split(',').filter(Boolean).map(Number);
  const picture = form.querySelector('[data-picture]');
  const hint = form.querySelector('[data-hint]');
  const pictureNote = form.querySelector('[data-picture-note]');
  const firstPicture = picture?.getAttribute('src');
  const firstCaption = picture?.alt;
  function reveal(selected, focus = true) {
    const correct = selected === answer;
    verdict.textContent = correct ? '猜对了' : '看看答案';
    result.dataset.correct = String(correct);
    for (const [index, input] of options.entries()) {
      input.checked = index === selected;
      input.disabled = true;
      const label = input.closest('label');
      label.classList.toggle('is-answer', index === answer);
      label.classList.toggle('is-evidence', index !== answer && evidence.includes(index));
      label.classList.toggle('is-wrong', index === selected && !correct);
    }
    result.hidden = false;
    submit.hidden = true;
    if (hint) hint.hidden = true;
    if (focus) verdict.focus();
  }

  function showPicture(expanded) {
    if (!picture) return;
    picture.src = expanded ? picture.dataset.widerSrc : firstPicture;
    picture.alt = expanded ? picture.dataset.widerAlt : firstCaption;
    pictureNote.textContent = picture.alt;
    hint.textContent = expanded ? '收回线索 ↖' : '多看一点 ↘';
    hint.setAttribute('aria-pressed', String(expanded));
  }

  submit.hidden = false;
  if (hint) {
    hint.hidden = false;
    hint.setAttribute('aria-pressed', 'false');
    hint.addEventListener('click', () => showPicture(hint.getAttribute('aria-pressed') !== 'true'));
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = options.findIndex((input) => input.checked);
    if (selected < 0 || !result.hidden) return;
    save(selected);
    reveal(selected);
  });

  result.querySelector('[data-retry]').addEventListener('click', () => {
    save(null);
    form.reset();
    for (const option of options) {
      option.disabled = false;
      option.closest('label').classList.remove('is-answer', 'is-evidence', 'is-wrong');
    }
    result.hidden = true;
    submit.hidden = false;
    if (hint) {
      hint.hidden = false;
      showPicture(false);
    }
    options[0].focus();
  });

  const saved = load(puzzleKey);
  const index = options.findIndex((option) => option.value === saved);
  if (index >= 0) reveal(index, false);

  const share = document.querySelector('[data-share]');
  const sharePanel = document.querySelector('[data-share-panel]');
  const shareStatus = document.querySelector('[data-share-status]');
  const shareUrl = document.getElementById('share-url');

  if (location.protocol === 'https:' || location.protocol === 'http:') {
    share.hidden = false;
    share.addEventListener('click', async () => {
      const url = new URL(location.href);
      url.search = '';
      url.hash = '';
      shareUrl.value = url.href;
      sharePanel.hidden = false;
      shareStatus.textContent = '';
      try {
        await navigator.clipboard.writeText(url.href);
        shareStatus.textContent = '已复制题目链接';
      } catch {
        shareUrl.focus();
        shareUrl.select();
      }
    });
  }
})();
