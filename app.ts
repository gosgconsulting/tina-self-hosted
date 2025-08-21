import express, { RequestHandler } from "express";
import {
  TinaNodeBackend,
  LocalBackendAuthProvider,
} from "@tinacms/datalayer";
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from "tinacms-authjs";
import cookieParser from "cookie-parser";

import cors from "cors";
import dotenv from "dotenv";

// Import the database client
import database from "./tina/database";

dotenv.config();

// Set NEXTAUTH_URL automatically if using Railway
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  process.env.NEXTAUTH_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  console.log(`Setting NEXTAUTH_URL to ${process.env.NEXTAUTH_URL} from RAILWAY_PUBLIC_DOMAIN`);
} else if (!process.env.NEXTAUTH_URL) {
  // Default to localhost for local development
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  console.log(`Setting NEXTAUTH_URL to default: ${process.env.NEXTAUTH_URL}`);
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be defined")
}

if (!process.env.GITHUB_OWNER) {
  throw new Error("GITHUB_OWNER must be defined")
}

if (!process.env.GITHUB_REPO) {
  throw new Error("GITHUB_REPO must be defined")
}

if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN must be defined")
}

const port = process.env.PORT || 3000;

const app = express();
app.use(express.static("_site"));

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const handler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient: database,
          secret: process.env.NEXTAUTH_SECRET!,
        }),
      }),
  databaseClient: database,
});

const handleTina: RequestHandler = async (req, res) => {
  req.query = {
    ...(req.query || {}),
    routes: req.params[0].split("/"),
  };

  await handler(req, res);
};

app.all("/api/tina/*", async (req, res, next) => {
  // Modify request if needed
  await handleTina(req, res, next);
});

app.listen(port, () => {
  console.log(`express backend listing on port ${port}`);
});
