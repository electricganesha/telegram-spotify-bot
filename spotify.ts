import dotenv from "dotenv";

const SpotifyWebApi = require("spotify-web-api-node");

dotenv.config();

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const getIsUserAuthenticated = async () => {
  return Boolean(accessToken && refreshToken);
};

export const getAndSetTokens = async () => {
  try {
    const response = await fetch(`${process.env.SERVER_URL}/tokens`);
    const data = await response.json();

    if (data.accessToken && data.refreshToken) {
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(refreshToken);
    }
  } catch (error) {
    console.error("Error fetching access token:", error);
  }
};

export const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${process.env.SERVER_URL}/refresh_token`);
    const data = await response.json();

    if (data.accessToken) {
      accessToken = data.accessToken;
      spotifyApi.setAccessToken(accessToken);
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};

export const searchSpotify = async (
  song: string,
  artist: string,
  id: string
) => {
  await refreshAccessToken();
  const data = await spotifyApi.searchTracks(`id:${id}`);

  if (data.body.tracks.items.length > 0) {
    return data.body.tracks.items[0].id;
  }
  return null;
};

export const addToPlaylist = async (trackId: string, playlistId: string) => {
  await refreshAccessToken();

  await spotifyApi.addTracksToPlaylist(playlistId, [
    `spotify:track:${trackId}`,
  ]);
};

export const extractSongInfoFromSpotifyLink = async (link: string) => {
  await refreshAccessToken();

  const match = link.match(
    /https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/
  );
  if (match) {
    const trackId = match[1];
    try {
      const data = await spotifyApi.getTrack(trackId);

      const id = data.body.id;
      const song = data.body.name;
      const artist = data.body.artists.map((artist) => artist.name).join(", ");
      return { id, song, artist };
    } catch (error) {
      console.error("Error fetching track info from Spotify:", error);
      return null;
    }
  }
  return null;
};

export const extractTrackIdFromSpotifyLink = async (url: string) => {
  const match = url.match(
    /https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/
  );
  if (match) {
    return match[1];
  }
  return null;
};
