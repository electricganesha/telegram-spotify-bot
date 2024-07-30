import express from "express";
import { spotifyApi } from "./spotify";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Use the PORT environment variable provided by Heroku or default to 8888
const port = process.env.PORT || 8888;

let accessToken: string | null = null;
let refreshToken: string | null = null;

app.get("/login", (_req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(
    ["playlist-modify-public", "playlist-modify-private"],
    "state"
  );
  res.redirect(authorizeURL);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    accessToken = data.body["access_token"];
    refreshToken = data.body["refresh_token"];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    res.send("Success! You can now close this tab.");
  } catch (err) {
    console.error("Error getting tokens:", err);
    res.send("Error getting tokens.");
  }
});

app.get("/token", (_req, res) => {
  if (accessToken && refreshToken) {
    res.json({ accessToken, refreshToken });
  } else {
    res.status(400).send("Access token not available.");
  }
});

// Start the Express server on the correct port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
