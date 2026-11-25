// Filtro de projetos Power BI
const filterButtons = document.querySelectorAll('.filter-btn');
const biCards = document.querySelectorAll('.bi-card');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove('is-active'));
    button.classList.add('is-active');

    biCards.forEach((card) => {
      const matches = category === 'all' || card.dataset.category === category;
      card.classList.toggle('is-hidden', !matches);
    });
  });
});

// Lightbox <dialog closedby="any"> para prints do Clube Gringas
const printDialog = document.getElementById('print-dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogImg = document.getElementById('dialog-img');
const dialogDesc = document.getElementById('dialog-desc');

document.querySelectorAll('.print-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const frame = trigger.querySelector('.print-frame');
    if (frame && frame.classList.contains('is-placeholder')) {
      return;
    }

    dialogTitle.textContent = trigger.dataset.printTitle || 'Print do Projeto';
    dialogImg.src = trigger.dataset.printSrc || '';
    dialogImg.alt = trigger.dataset.printTitle || 'Captura de tela do Clube Gringas';
    dialogDesc.textContent = trigger.dataset.printDesc || '';
    printDialog.showModal();
  });
});

// Fallback obrigatório de light-dismiss para navegadores sem suporte a closedby (ex.: Safari)
if (printDialog && !('closedBy' in HTMLDialogElement.prototype)) {
  printDialog.addEventListener('click', (event) => {
    if (event.target !== printDialog) return;

    const rect = printDialog.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (isDialogContent) return;
    printDialog.close();
  });
}
