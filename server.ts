import express from "express";
import { spotifyApi } from "./spotify";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(__dirname, "tokens.json");

dotenv.config();

const app = express();
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

    saveTokensToFile(accessToken, refreshToken);

    res.send("Success! You can now close this tab.");
  } catch (err) {
    console.error("Error getting tokens:", err);
    res.send("Error getting tokens.");
  }
});

app.get("/tokens", (_req, res) => {
  loadTokensFromFile();
  if (accessToken && refreshToken) {
    res.json({ accessToken, refreshToken });
  } else {
    res.status(400).send("Tokens are not available.");
  }
});

app.get("/refresh_token", async (_req, res) => {
  try {
    const data = await spotifyApi.refreshAccessToken();
    accessToken = data.body["access_token"];
    refreshToken = data.body["refresh_token"] ?? refreshToken;
    spotifyApi.setAccessToken(accessToken);

    saveTokensToFile(accessToken, refreshToken);

    res.json({
      accessToken: data.body["access_token"],
      refreshToken: data.body["refresh_token"] ?? refreshToken,
    });
  } catch (err) {
    console.error("Could not refresh access token", err);
    res.status(500).send("Could not refresh access token.");
  }
});

// Function to save tokens to a secure storage (e.g., database, file, etc.)
export const saveTokensToFile = (accessToken: string, refreshToken: string) => {
  const tokenData = { accessToken, refreshToken };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData));
};

// Function to load tokens from secure storage
export const loadTokensFromFile = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokenData = fs.readFileSync(TOKEN_PATH, "utf8");
    const { accessToken: at, refreshToken: rt } = JSON.parse(tokenData);
    spotifyApi.setAccessToken(at);
    spotifyApi.setRefreshToken(rt); // Fixing this line
    accessToken = at;
    refreshToken = rt;
  }
};

// Load tokens on server start
loadTokensFromFile();

// Start the Express server on the correct port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
