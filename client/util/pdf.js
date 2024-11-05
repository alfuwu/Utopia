import * as pdfjsLib from "pdfjs-dist";
import { serverless } from "./discord";
import { characterData } from "../main";
pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';

export let pageNum = 1;
export let totalPages = 0;
export let renderedPages = 0;
let pdf = null;
let renderingTwoPages = false;

export async function loadPdf() {
  const loadingIndicator = document.getElementById('loading-handbook');
  loadingIndicator.style.display = 'block';

  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  progressContainer.style.display = 'block';

  const url = serverless ? '/handbook.pdf' : '/.proxy/handbook.pdf';
  const pdfTask = pdfjsLib.getDocument({url, disableAutoFetch: true, disableStream: true});

  pdfTask.onProgress = ({
    loaded, total
  }) => {
    progressBar.value = ((loaded/total) * 100).toFixed(0);
  }

  pdf = await pdfTask.promise;
  totalPages = pdf.numPages;

  await renderPage(pageNum);

  loadingIndicator.style.display = 'none'; // Hide loading
  progressContainer.style.display = 'none'; // Hide progress bar

  window.addEventListener('resize', () => {
    if (!characterData.scrollingHandbook)
      renderPage(pageNum, true);
  });
}

export function setPage(p) {
  pageNum = p;
}

function appendChild(parent, child1, child2) {
  parent.innerHTML = ``;
  parent.appendChild(child1);
  if (child2) parent.appendChild(child2);
}

export async function renderPage(p, fromResize=false, book=true) {
  if (pdf === null)
    return;
  const originalPageNum = p;
  const page1 = await pdf.getPage(p);
  let viewport = page1.getViewport({ scale: 1 })
  const pdfContainer = document.getElementById('pdf-container');
  const containerWidth = pdfContainer.clientWidth;
  const containerHeight = pdfContainer.clientHeight;
  const widthScale = containerWidth / viewport.width;
  const heightScale = containerHeight / viewport.height;
  const scale = book ? Math.min(widthScale, heightScale) * 0.9 : widthScale / 4; // use 0.9 to add a bit of padding
  renderingTwoPages = containerWidth / 2 >= viewport.width * scale / 0.9 && book; // all pages in the handbook are the same size, so we can just check if half the screen is greater than or equal to a single page in size
  viewport = page1.getViewport({ scale: scale * 4 });

  const page2 = p < totalPages && renderingTwoPages ? await pdf.getPage(p + 1) : null;

  const canvas1 = document.createElement('canvas');
  const canvas2 = page2 ? document.createElement('canvas') : undefined;
  const context1 = canvas1.getContext('2d');
  const context2 = canvas2 ? canvas2.getContext('2d') : undefined;
  canvas1.width = viewport.width;
  canvas1.height = viewport.height;
  if (canvas2) {
    canvas2.width = viewport.width;
    canvas2.height = viewport.height;
  }
  if (!book) {
    canvas1.className = 'pdf-page';
  } else {
    canvas1.className = `pdf-book-page${pdfContainer.offsetWidth / 0.8 > pdfContainer.offsetHeight ? 'h' : canvas2 ? 'w2' : 'w1'}`;
    if (canvas2)
      canvas2.className = canvas1.className;
  }

  // render pages
  if (pageNum === originalPageNum || !book) {
    // append canvases to the container
    if (pageNum === originalPageNum && !fromResize && book)
      appendChild(pdfContainer, canvas1, canvas2);
    context1.fillStyle = "white";
    context1.fillRect(0, 0, canvas1.width, canvas1.height);
    if (canvas2) {
      context2.fillStyle = "white";
      context2.fillRect(0, 0, canvas2.width, canvas2.height);
    }
    await page1.render({ canvasContext: context1, viewport: viewport });
    if (page2)
      await page2.render({ canvasContext: context2, viewport: viewport });
    if (pageNum === originalPageNum && fromResize && book)
      appendChild(pdfContainer, canvas1, canvas2);
  }
  return canvas1; // scuffed hardcode
}

export async function renderAllPages() {
  const pdfContainer = document.getElementById('pdf-container');
  for (renderedPages = 0; renderedPages < totalPages; renderedPages++) {
    const page = await renderPage(renderedPages + 1, false, false);
    if (characterData.scrollingHandbook)
      pdfContainer.appendChild(page);
    else
      return;
    if (renderedPages + 1 === pageNum && pdfContainer.scrollTop < 50)
      page.scrollIntoView();
  }
}

export function goToNextPage(event) {
  if (pageNum < totalPages) {
    if (renderingTwoPages && pageNum < totalPages - 1)
      pageNum += 2;
    else
      pageNum++;
    renderPage(pageNum);
    event.stopPropagation();
  }
}

export function goToPreviousPage(event) {
  if (pageNum > 1) {
    if (renderingTwoPages && pageNum > 2)
      pageNum -= 2;
    else
      pageNum--;
    renderPage(pageNum);
    event.stopPropagation();
  }
}