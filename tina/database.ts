import { createDatabase, createLocalDatabase } from "@tinacms/datalayer";
import { MongodbLevel } from "mongodb-level";
import { GitHubProvider } from "tinacms-gitprovider-github";
import dotenv from "dotenv";

dotenv.config();

// Special handling for build phase to allow builds without MongoDB
const isBuildPhase = process.env.TINA_BUILD_PHASE === "true";
// Runtime flag to determine if we're running in production
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.TINA_PUBLIC_IS_LOCAL) {
  console.warn("TINA_PUBLIC_IS_LOCAL is not defined")
}

// Support multiple common env var names for Mongo on hosting providers (e.g. Railway)
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.MONGO_URL;

// Only throw error if not in build phase and MongoDB URI is missing in production
if (!mongoUri && !isBuildPhase && isProduction) {
  throw new Error("MongoDB connection string is required. Set MONGODB_URI (preferred) or MONGODB_URL/MONGO_URL.")
}

// For non-build phase, use actual MongoDB URI or fall back to local database
let databaseAdapter = null;
if (mongoUri) {
  databaseAdapter = new MongodbLevel<string, Record<string, unknown>>({
    collectionName: 'tinacms',
    dbName: "tinacms-self-host",
    mongoUri: mongoUri,
  });
}

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

// Create the appropriate database based on environment
const database = (isLocal || !mongoUri) 
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new GitHubProvider({
        branch,
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
      }),
      databaseAdapter: databaseAdapter!,
      namespace: branch,
    });

export default database;
