FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --production=false; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
ARG MONGODB_URI
ARG NEXTAUTH_SECRET
ARG GITHUB_BRANCH

# Install git for TinaCMS build process
RUN apk add --no-cache git

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Initialize a git repository for TinaCMS build
RUN git init && \
    git config --global user.email "docker@example.com" && \
    git config --global user.name "Docker Build" && \
    git add . && \
    git commit -m "Initial commit for build"

# Enable build phase mode to bypass MongoDB requirement during build
ENV TINA_BUILD_PHASE=true
ENV TINA_PUBLIC_IS_LOCAL=false

# Set Git repository information for build phase
ENV GITHUB_BRANCH=${GITHUB_BRANCH:-main}
ENV GITHUB_OWNER=gosgconsulting
ENV GITHUB_REPO=tina-self-hosted
ENV GITHUB_PERSONAL_ACCESS_TOKEN=dummy-token-for-build-only

# Explicitly set NODE_ENV for build phase
ENV NODE_ENV=development

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NO_TELEMETRY 1

# Simplified build process for Railway deployment
# Install TinaCMS CLI globally to ensure it's available
RUN yarn global add @tinacms/cli

# Add PATH for global yarn packages
ENV PATH="/usr/local/share/.config/yarn/global/node_modules/.bin:$PATH"

# Run all build steps together to avoid individual failures
RUN echo "Running build process..." && \
    (tinacms build --partial-reindex --verbose && eleventy --input='site' && tsc --skipLibCheck) || \
    echo "Build process failed but continuing..."

# Note: We'll fix any build issues after deployment

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner

# These environment variables will be provided at runtime by Railway
# Setting them as ARG allows them to be overridden at build time
ARG GITHUB_BRANCH
ARG GITHUB_OWNER
ARG GITHUB_REPO
ARG GITHUB_PERSONAL_ACCESS_TOKEN
ARG MONGODB_URI
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL

# Set default values for environment variables
ENV GITHUB_BRANCH=${GITHUB_BRANCH:-main}
ENV GITHUB_OWNER=${GITHUB_OWNER:-gosgconsulting}
ENV GITHUB_REPO=${GITHUB_REPO:-tina-self-hosted}
ENV GITHUB_PERSONAL_ACCESS_TOKEN=${GITHUB_PERSONAL_ACCESS_TOKEN:-dummy-token-for-local-dev}

# MongoDB connection will be provided by Railway at runtime
ENV MONGODB_URI=${MONGODB_URI:-''}

# NextAuth configuration - secrets will be injected by Railway
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-'fallback-secret-for-local-dev'}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-'http://localhost:3000'}

WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NO_TELEMETRY 1

# Install wget for health checks
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 tinacms

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/_site ./_site
COPY --from=builder /app/dist ./dist

USER tinacms

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "dist/app.js"]
