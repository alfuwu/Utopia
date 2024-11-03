import { DiscordSDK, DiscordSDKMock } from "@discord/embedded-app-sdk";
import { game, characterData, pages } from "../main";
import EventSocket from './EventSocket';

let auth;

let discordSdk;

const queryParams = new URLSearchParams(window.location.search);
const isEmbedded = queryParams.get("frame_id") != null;

/**
 * @type {EventSocket}
 */
let socket;
export let serverless = false;

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
      return await {
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

export default async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      'identify',
      'guilds',
      'guilds.members.read'
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
  let access_token;
  try {   
    access_token = await response.json().then(j => j.access_token);
  } catch {
    serverless = true;
  }
  
  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({ access_token });

  if (auth == null)
    throw new Error("Authentication failed");
  if (auth.user)
    sessionStorage.setItem("auth", JSON.stringify(auth));

  const guildMember = await fetch(`https://discord.com/api/users/@me/guilds/${discordSdk.guildId}/member`, {
    method: 'get',
    headers: { Authorization: `Bearer ${access_token}` },
  }).then(j => j.json()).catch(() => null);

  let uidRes;
  let uuid = new Promise(r => uidRes = r);
  socket = new EventSocket(`/.proxy/api/ws`);
  socket.on("clientId", function (data) {
    uidRes(data);
  });
  socket.on("ping", () => socket.emit("pong"));
  const signals = Object.create(null);
  const userData = Object.create(null);
  socket.on("resUserData", data => {
    console.log(data);
    signals[data.userId](data);
    userData[data.userId] = data;
  });
  socket.on("gameData", data => {
    delete game.speciesStats[""];
    Object.assign(game, data);
    pages.characterSheet.generateSpeciesOptions();
    pages.characterSheet.updateAvailableLanguages();
    pages.gm.language.generateLanguages();
  });
  socket.on("species", data => {
    delete game.speciesStats[""];
    Object.assign(game.speciesStats, data);
    pages.characterSheet.generateSpeciesOptions();
  });
  socket.on("talents", data => {
    Object.assign(game.talents, data);
  });
  socket.on("language", data => {
    Object.assign(game.languages, data);
    pages.gm.language.generateLanguages();
    pages.language.generateWordsList();
  })
  socket.on("resSelfData", data => {
    Object.assign(characterData, data);
    pages.characterSheet.calculateTraits();
    pages.characterSheet.calculateSpeciesStats();
    pages.characterSheet.calculateXp();
    pages.characterSheet.calculatePoints();
  });
  uuid = await uuid;

  let gameName = "Channel";

  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({ channel_id: discordSdk.channelId });
    if (channel.name != null)
      gameName = channel.name;
  }

  const data = {
    gameName,
    channelId: discordSdk.channelId,
    userId: auth.user.id,
    name: getUserDisplayName({ guildMember, user: auth.user }),
    username: auth.user.username,
    avatar: getUserAvatarUrl({ guildMember, user: auth.user }),
    uuid
  }
  socket.emit("userData", data);
}

export function emit(event, data) {
  data.channelId = discordSdk.channelId;
  data.userId = auth.user.id;
  data.username = auth.user.username;
  socket.emit(event, data);
}

function getUserAvatarUrl({ guildMember, user, cdn = `https://cdn.discordapp.com`, size = 256 }) {
  if (guildMember?.avatar != null && discordSdk.guildId != null)
    return `${cdn}/guilds/${discordSdk.guildId}/users/${user.id}/avatars/${guildMember.avatar}.png?size=${size}`;
  if (user.avatar != null)
    return `${cdn}/avatars/${user.id}/${user.avatar}.png?size=${size}`;

  const defaultAvatarIndex = Math.abs(Number(user.id) >> 22) % 6;
  return `${cdn}/embed/avatars/${defaultAvatarIndex}.png?size=${size}`;
}

function getUserDisplayName({ guildMember, user }) {
  if (guildMember?.nick != null && guildMember.nick !== "")
    return guildMember.nick;

  if (user.discriminator !== "0")
    return `${user.username}#${user.discriminator}`;

  if (user.global_name != null && user.global_name !== "")
    return user.global_name;

  return user.username;
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