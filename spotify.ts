import dotenv from "dotenv";

const SpotifyWebApi = require("spotify-web-api-node");

dotenv.config();

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

let refreshToken: string | null = null;

export const getAccessToken = async () => {
  // create token
  try {
    await fetch(`${process.env.SERVER_URL}/login`);
  } catch (error) {
    console.error("Error logging in:", error);
  }
  try {
    const response = await fetch(`${process.env.SERVER_URL}/token`);
    const data = await response.json();

    spotifyApi.setRefreshToken(data.refreshToken);
    spotifyApi.setAccessToken(data.accessToken);
  } catch (error) {
    console.error("Error fetching access token:", error);
  }
};

export const getRefreshToken = async () => {
  const response = await fetch(
    `${
      process.env.SERVER_URL
    }/refresh_token?accessToken=${spotifyApi.getAccessToken()}&refreshToken=${spotifyApi.getRefreshToken()}`
  );

  const data = await response.json();

  spotifyApi.setAccessToken(data.accessToken);
  spotifyApi.setRefreshToken(data.refreshToken);
};

export const setTokens = () => {
  spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
  spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
};

export const searchSpotify = async (
  song: string,
  artist: string,
  id: string
) => {
  const data = await spotifyApi.searchTracks(`id:${id}`);

  if (data.body.tracks.items.length > 0) {
    return data.body.tracks.items[0].id;
  }
  return null;
};

export const addToPlaylist = async (trackId: string, playlistId: string) => {
  getRefreshToken();
  const data = await spotifyApi.refreshAccessToken();
  spotifyApi.setAccessToken(data.body["access_token"]);

  await spotifyApi.addTracksToPlaylist(playlistId, [
    `spotify:track:${trackId}`,
  ]);
};

export const extractSongInfoFromSpotifyLink = async (link: string) => {
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
