// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links){
    toggle.addEventListener('click', () => {
      const open = links.style.display === 'flex';
      links.style.display = open ? 'none' : 'flex';
      links.style.flexDirection = 'column';
      links.style.position = 'absolute';
      links.style.top = '78px';
      links.style.left = '0';
      links.style.right = '0';
      links.style.background = '#FDFCF9';
      links.style.padding = '24px 32px';
      links.style.borderBottom = '1px solid #CBD9D6';
      toggle.textContent = open ? 'Menu' : 'Close';
    });
  }

  // Filter chips (stays page)
  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('[data-region]');
  if (chips.length && cards.length){
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const region = chip.dataset.filter;
        cards.forEach(card => {
          if (region === 'all' || card.dataset.region === region){
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Simple contact form handling (no backend — demo confirmation)
  const forms = document.querySelectorAll('form[data-demo-form]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      if (note){
        note.textContent = "Thank you — we've received your message and will write back within a day.";
        note.style.color = '#6E8A65';
      }
      form.reset();
    });
  });
});
