import { createDatabase, createLocalDatabase } from "@tinacms/datalayer";
import { MongodbLevel } from "mongodb-level";
import { GitHubProvider } from "tinacms-gitprovider-github";
import dotenv from "dotenv";

dotenv.config();

// Special handling for build phase to allow builds without MongoDB
const isBuildPhase = process.env.TINA_BUILD_PHASE === "true";

if (!process.env.TINA_PUBLIC_IS_LOCAL) {
  console.warn("TINA_PUBLIC_IS_LOCAL is not defined")
}

// Support multiple common env var names for Mongo on hosting providers (e.g. Railway)
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.MONGO_URL;

// Only throw error if not in build phase and MongoDB URI is missing
if (!mongoUri && !isBuildPhase) {
  throw new Error("MongoDB connection string is required. Set MONGODB_URI (preferred) or MONGODB_URL/MONGO_URL.")
}

// For build phase without MongoDB, use a placeholder URI
const effectiveMongoUri = isBuildPhase && !mongoUri ? "mongodb://placeholder:27017/build-placeholder" : mongoUri;

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new GitHubProvider({
        branch,
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
      }),
      databaseAdapter: new MongodbLevel<string, Record<string, unknown>>({
        collectionName: 'tinacms',
        dbName: "tinacms-self-host",
        mongoUri: effectiveMongoUri,
      }),
      namespace: branch,
    });
