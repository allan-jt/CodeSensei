const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const envContent = `window.env = {
  CLIENT_ID: "${process.env.CLIENT_ID}",
  AUTHORITY: "${process.env.AUTHORITY}",
  REDIRECT_URL: "${process.env.REDIRECT_URL}",
  SOCKET_URL: "${process.env.SOCKET_URL}",
  HTTP_URL: "${process.env.HTTP_URL}"
};`;

const outputPath = path.join(__dirname, "lib/react-app/dist/env.js");
fs.writeFileSync(outputPath, envContent, "utf8");
