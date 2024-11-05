import { characterData } from "../main";
import { goToNextPage, goToPreviousPage, loadPdf, pageNum, renderAllPages, renderedPages, renderPage, setPage, totalPages } from "../util/pdf";
import Page from "./page";

export default class Handbook extends Page {
  active = false;
  unloaded = true;
  constructor() {
    super('handbook', 'open-handbook');

    document.addEventListener('keydown', (event) => {
      if (event.key === 'c') {
        characterData.scrollingHandbook = !characterData.scrollingHandbook;
        if (characterData.scrollingHandbook)
          this.loadScrollablePdf();
        else
          this.loadBookPdf();
      }
      if (!this.active || characterData.scrollingHandbook)
        return;
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'w')
        goToNextPage(event);
      else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 's')
        goToPreviousPage(event);
    });

    const pdfContainer = document.getElementById('pdf-container');
    pdfContainer.addEventListener('click', event => {
      if (characterData.scrollingHandbook)
        return;
      if (event.clientX - pdfContainer.getBoundingClientRect().left > pdfContainer.getBoundingClientRect().width / 2)
        goToNextPage(event);
      else
        goToPreviousPage(event);
    });
    pdfContainer.addEventListener('scroll', () => {
      if (!characterData.scrollingHandbook)
        return;
      setPage(Math.min(Math.max(Math.round(pdfContainer.scrollTop * totalPages / pdfContainer.scrollHeight * (renderedPages / totalPages)) + 1, 1), totalPages));
    })
  }
  show() {
    super.show();
    this.active = true;
    if (this.unloaded) {
      loadPdf();
      this.unloaded = undefined;
    }
  }
  hide() {
    super.hide();
    this.active = false;
  }
  loadScrollablePdf() {
    const pdfContainer = document.getElementById('pdf-container');
    pdfContainer.innerHTML = ``;
    pdfContainer.classList.remove('pc');
    pdfContainer.classList.add('pcs');
    renderAllPages();
  }
  loadBookPdf() {
    const pdfContainer = document.getElementById('pdf-container');
    pdfContainer.innerHTML = ``;
    pdfContainer.classList.remove('pcs');
    pdfContainer.classList.add('pc');
    renderPage(pageNum);
  }
}