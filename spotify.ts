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
  try {
    const response = await fetch("http://localhost:8888/token");
    const data = await response.json();
    spotifyApi.setRefreshToken(data.refreshToken);
    spotifyApi.setAccessToken(data.accessToken);
  } catch (error) {
    console.error("Error fetching access token:", error);
  }
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
