import { DiscordSDK } from "@discord/embedded-app-sdk";
import { patchUrlMappings } from '@discord/embedded-app-sdk';

import './style.css'
import rocketLogo from '/rocket.png'

import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';

let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
  console.log("Discord SDK is ready");
});

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready 2");

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify"]
  });

  // Retrieve an access_token from your activity's server
  // Note: We need to prefix our backend `/api/token` route with `/.proxy` to stay compliant with the CSP.
  // Read more about constructing a full URL and using external resources at
  // https://discord.com/developers/docs/activities/development-guides#construct-a-full-url
  const response = await fetch("/.proxy/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({access_token});

  if (auth == null)
    throw new Error("Authenticate command failed");

  loadPdf();
}

async function loadPdf() {
  const loadingIndicator = document.getElementById('loading');
  loadingIndicator.style.display = 'block'; // Show loading

  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  progressContainer.style.display = 'block'; // Show progress bar

  const url = '/.proxy/handbook.pdf';
  const pdf = await pdfjsLib.getDocument({url, disableAutoFetch: true, disableStream: true}).promise;

  let pageNum = 1;

  const page = await pdf.getPage(pageNum);
  const scale = 1.5; // Adjust scale for size
  const viewport = page.getViewport({ scale });

  // Create a canvas element to render the PDF page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Append the canvas to the container
  document.getElementById('pdf-container').appendChild(canvas);

  // Render the page into the canvas context
  await page.render({ canvasContext: context, viewport }).promise;

  // Update progress
  const progress = ((pageNum / pdf.numPages) * 100).toFixed(0);
  progressBar.value = progress;

  loadingIndicator.style.display = 'none'; // Hide loading
  progressContainer.style.display = 'none'; // Hide progress bar
}

document.querySelector('#app').innerHTML = `
  <div>
    <img src="${rocketLogo}" class="logo" alt="Discord" />
    <h1>Utopia TTRPG</h1>
    <div id="loading" style="display: none;">Loading PDF...</div>
    <div id="progress-container" style="display: none;">
      <progress id="progress-bar" value="0" max="100"></progress>
    </div>
    <div id="pdf-container"></div>
  </div>
`;