import dotenv from "dotenv";

import { Message } from "node-telegram-bot-api";
import {
  addToPlaylist,
  extractSongInfoFromSpotifyLink,
  getAccessToken,
  searchSpotify,
} from "./spotify";

dotenv.config();

const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SPOTIFY_PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("message", async (msg: Message) => {
  const chatId = msg.chat.id;
  console.log("chatId ", chatId);
  const text = msg.text;

  if (!text?.includes("open.spotify.com/track/")) {
    return;
  }

  if (text) {
    await getAccessToken();
    const songInfo = await extractSongInfoFromSpotifyLink(text);

    if (songInfo) {
      try {
        const trackId = await searchSpotify(
          songInfo.song,
          songInfo.artist,
          songInfo.id
        );
        if (trackId) {
          await addToPlaylist(songInfo.id, SPOTIFY_PLAYLIST_ID);
          bot.sendMessage(
            chatId,
            `Added ${songInfo.song} by ${songInfo.artist} to the playlist!`
          );
        } else {
          bot.sendMessage(
            chatId,
            `Could not find ${songInfo.song} by ${songInfo.artist} on Spotify.`
          );
        }
      } catch (error) {
        bot.sendMessage(
          chatId,
          "An error occurred while adding the song to the playlist."
        );
      }
    } else {
      bot.sendMessage(chatId, "Could not extract song info.");
    }
  }
});
