const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
import dotenv from "dotenv";
import fs from "fs";
import { Api } from "telegram";
import {
  addToPlaylist,
  existsInPlaylist,
  extractTrackIdFromSpotifyLink,
} from "./spotify";

dotenv.config();

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(
  process.env.TELEGRAM_STRING_SESSION || ""
);

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("number ?"),
    password: async () => await input.text("password?"),
    phoneCode: async () => await input.text("Code ?"),
    onError: (err) => console.log(err),
  });

  console.log("You should now be connected.");
  console.log(
    "Save this string to avoid logging in again:",
    client.session.save()
  );

  const chatId = -Number(process.env.TELEGRAM_CHAT_ID);
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
  const messagesFilePath = "messages.json";
  const seenTracks: Set<string> = new Set();

  const processMessages = async (messages: string[]) => {
    for (const message of messages) {
      if (!message?.includes("open.spotify.com/track/")) {
        continue;
      }

      if (message) {
        const trackLink = await extractTrackIdFromSpotifyLink(message);

        if (trackLink) {
          console.log(`Found Spotify link: ${trackLink}`);
          const exists = await existsInPlaylist(trackLink, playlistId);
          if (seenTracks.has(trackLink) || exists) {
            console.log(
              `Track ${trackLink} has already been added to the playlist.`
            );
            continue;
          }

          await addToPlaylist(trackLink, playlistId);
          seenTracks.add(trackLink);
        }
      }
    }
  };

  if (fs.existsSync(messagesFilePath)) {
    const fileData = fs.readFileSync(messagesFilePath, "utf-8");
    const savedMessages = JSON.parse(fileData).map(
      (m: Api.Message) => m.message
    );
    await processMessages(savedMessages.reverse());
  } else {
    console.log("Fetching messages from Telegram...");
    const allMessages: Api.Message[] = [];
    for await (const message of client.iterMessages(chatId)) {
      allMessages.push(message);
    }
    console.log("Messages have been fetched", allMessages.length);

    fs.writeFileSync(messagesFilePath, JSON.stringify(allMessages, null, 2));
    console.log("Messages have been saved to messages.json");
    const reversedMessages = allMessages.map((m) => m.message).reverse();
    await processMessages(reversedMessages);
  }

  console.log("Processing complete.");
})();
