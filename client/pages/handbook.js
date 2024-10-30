import { goToNextPage, goToPreviousPage, loadPdf } from "../util/pdf";
import Page from "./page";

export default class Handbook extends Page {
  active = false;
  constructor() {
    super('handbook', 'open-handbook');
    loadPdf();

    document.addEventListener('keydown', (event) => {
      if (!this.active)
        return;
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'w')
        goToNextPage(event);
      else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 's')
        goToPreviousPage(event);
    });

    document.getElementById('pdf-container').addEventListener('click', (event) => {
      const pdfContainer = document.getElementById('pdf-container');
      const clickX = event.clientX;
      const containerWidth = pdfContainer.offsetWidth;
      // if click is on the right side of the container, go to the next page
      if (clickX - pdfContainer.offsetLeft > containerWidth / 2)
        goToNextPage(event);
      else // if click is on the left side, go to the previous page
        goToPreviousPage(event);
    });
  }

  show() {
    super.show();
    this.active = true;
  }

  hide() {
    super.hide();
    this.active = false;
  }
}