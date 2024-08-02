import dotenv from "dotenv";
import { Message } from "node-telegram-bot-api";
import {
  addToPlaylist,
  extractSongInfoFromSpotifyLink,
  getAndSetTokens,
  getIsUserAuthenticated,
  extractTrackIdFromSpotifyLink,
  existsInPlaylist,
} from "./spotify";

dotenv.config();

const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SPOTIFY_PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/sayhello/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Howdy! 👋 I'm SJGBot, thanks for adding me on this group - while I'm active on this channel, every Spotify track that you post here should be added to the shared playlist SJGMusica - https://open.spotify.com/playlist/2oDuWypQijN5ivUbTgopWp?si=1b4841f4dbcb4c40 - I've also populated the playlist with all the songs you've added to the channel so far! Enjoy your music! 🎧"
  );
});

bot.onText(/\/version/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "SJGMusic Bot -> v1.0.0");
});

bot.onText(/\/playlist/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "The shared playlist for SJGMusica can be found at: https://open.spotify.com/playlist/2oDuWypQijN5ivUbTgopWp?si=1b4841f4dbcb4c40 - Enjoy your music! 🎧"
  );
});

bot.on("message", async (msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text?.includes("open.spotify.com/track/")) {
    return;
  }

  const isUserAuthenticated = await getIsUserAuthenticated();

  if (!isUserAuthenticated) {
    await getAndSetTokens();
  }

  if (text) {
    const trackId = await extractTrackIdFromSpotifyLink(text);
    const songInfo = await extractSongInfoFromSpotifyLink(text);

    if (songInfo) {
      try {
        const exists = await existsInPlaylist(trackId, SPOTIFY_PLAYLIST_ID);

        if (exists) {
          botSendMessageAndLog(
            chatId,
            `Track ${songInfo.song} by ${songInfo.artist} has already been added to the playlist.`
          );
          return;
        }

        if (trackId) {
          await addToPlaylist(songInfo.id, SPOTIFY_PLAYLIST_ID);
          botSendMessageAndLog(
            chatId,
            `Added ${songInfo.song} by ${songInfo.artist} to the playlist!`
          );
        } else {
          botSendMessageAndLog(
            chatId,
            `Could not find ${songInfo.song} by ${songInfo.artist} on Spotify.`
          );
        }
      } catch (error) {
        botSendMessageAndLog(
          chatId,
          "An error occurred while adding the song to the playlist."
        );
      }
    } else {
      bot.sendMessage(chatId, "Could not extract song info.");
    }
  }
});

const botSendMessageAndLog = async (chatId: number, message: string) => {
  console.log(message);
  bot.sendMessage(chatId, message);
};
