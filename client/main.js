import { DiscordSDK, DiscordSDKMock } from "@discord/embedded-app-sdk";

import './style.css'
import { setupPage } from './lazy';
import { speciesStats } from './constants';

let auth;
let pageNum = 1;
let pdf = null;
let totalPages = 0;
let renderingTwoPages = false;
export let level = 10;

const queryParams = new URLSearchParams(window.location.search);
const isEmbedded = queryParams.get("frame_id") != null;

let discordSdk;
if (isEmbedded) {
  discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
} else {
  const mockUserId = getOverrideOrRandomSessionValue("user_id");
  const mockGuildId = getOverrideOrRandomSessionValue("guild_id");
  const mockChannelId = getOverrideOrRandomSessionValue("channel_id");

  discordSdk = new DiscordSDKMock(
      import.meta.env.VITE_DISCORD_CLIENT_ID,
      mockGuildId,
      mockChannelId
  );
  const discriminator = String(mockUserId.charCodeAt(0) % 5);

  discordSdk._updateCommandMocks({
      authenticate: async () => {
          return {
              access_token: "mock_token",
              user: {
                  username: mockUserId,
                  discriminator,
                  id: mockUserId,
                  avatar: null,
                  public_flags: 1,
              },
              scopes: [],
              expires: new Date(2112, 1, 1).toString(),
              application: {
                  description: "mock_app_description",
                  icon: "mock_app_icon",
                  id: "mock_app_id",
                  name: "mock_app_name",
              },
          };
      },
  });
}

import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';

setupDiscordSdk().then(() => {
  console.log("done");
});

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
			'guilds',
			"guilds.members.read"
    ]
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
    throw new Error("Authentication failed");

  const guildMember = await fetch(
		`https://discord.com/api/users/@me/guilds/${discordSdk.guildId}/member`,
		{
			method: 'get',
			headers: { Authorization: `Bearer ${access_token}` },
		},
	)
		.then((j) => j.json())
		.catch(() => {
			return null;
		});

	// Done with discord-specific setup

	const authState = {
		...authResponse,
		user: {
			...authResponse.user,
			id:
				new URLSearchParams(window.location.search).get('user_id') ??
				authResponse.user.id,
		},
		guildMember,
	};
}

async function loadPdf() {
  if (pdf === null)
    return;
  const loadingIndicator = document.getElementById('loading');
  loadingIndicator.style.display = 'block'; // Show loading

  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  progressContainer.style.display = 'block'; // Show progress bar

  const url = '/handbook.pdf';//'/.proxy/handbook.pdf';
  const pdfTask = pdfjsLib.getDocument({url, disableAutoFetch: true, disableStream: true});

  pdfTask.onProgress = ({
    loaded, total
  }) => {
    progressBar.value = ((loaded/total) * 100).toFixed(0);
  }

  pdf = await pdfTask.promise;
  totalPages = pdf.numPages; // Store total number of pages

  await renderPage(pageNum); // Render the first page

  loadingIndicator.style.display = 'none'; // Hide loading
  progressContainer.style.display = 'none'; // Hide progress bar
}

async function renderPage(p, fromResize = false) {
  if (pdf === null)
    return;
  const originalPageNum = p;
  const page1 = await pdf.getPage(p);
  let viewport = page1.getViewport({ scale: 1 })
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;
  const widthScale = containerWidth / viewport.width;
  const heightScale = containerHeight / viewport.height;
  const scale = Math.min(widthScale, heightScale) * 0.9; // use 0.9 to add a bit of padding
  renderingTwoPages = (containerWidth / 2) >= viewport.width * scale / 0.9; // all pages in the handbook are the same size, so we can just check if half the screen is greater than or equal to a single page in size
  viewport = page1.getViewport({ scale });

  const pdfContainer = document.getElementById('pdf-container');
  const page2 = (p < totalPages && renderingTwoPages) ? await pdf.getPage(p + 1) : null;

  const canvas1 = document.createElement('canvas', { id: 'page1' });
  const canvas2 = document.createElement('canvas', { id: 'page2' });
  const context1 = canvas1.getContext('2d');
  const context2 = canvas2.getContext('2d');
  canvas1.width = viewport.width;
  canvas1.height = viewport.height;
  if (page2) {
    canvas2.width = viewport.width;
    canvas2.height = viewport.height;
  }
  
  // render pages
  if (pageNum === originalPageNum) {
    // append canvases to the container
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.display = 'flex'; // flex to align canvases side by side
    canvasWrapper.appendChild(canvas1);
    if (page2) canvasWrapper.appendChild(canvas2);
    if (pageNum === originalPageNum && !fromResize) { // aaaaa duplicate code
      pdfContainer.innerHTML = '';
      pdfContainer.appendChild(canvasWrapper);
    }
    context1.fillStyle = "white";
    context1.fillRect(0, 0, canvas1.width, canvas1.height);
    if (page2) {
      context2.fillStyle = "white";
      context2.fillRect(0, 0, canvas2.width, canvas2.height);
    }
    page1.render({ canvasContext: context1, viewport: viewport });
    if (page2)
      page2.render({ canvasContext: context2, viewport: viewport });
    if (pageNum === originalPageNum && fromResize) {
      pdfContainer.innerHTML = '';
      pdfContainer.appendChild(canvasWrapper);
    }
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

function getOverrideOrRandomSessionValue(queryParam) {
  const overrideValue = queryParams.get(queryParam);
  if (overrideValue != null)
      return overrideValue;

  const currentStoredValue = sessionStorage.getItem(queryParam);
  if (currentStoredValue != null)
      return currentStoredValue;

  // Set queryParam to a random 8-character string
  const randomString = Math.random().toString(36).slice(2, 10);
  sessionStorage.setItem(queryParam, randomString);
  return randomString;
}

window.addEventListener('resize', () => {
  renderPage(pageNum, true);
});

setupPage();

//loadPdf();