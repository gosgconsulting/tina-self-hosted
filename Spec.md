# Spec.md — Project Specification

## 1. Purpose
A self-hosted TinaCMS implementation with 11ty static site generator, designed to be deployed on Railway for content management.

## 2. Core Functionality
- Content management system using TinaCMS
- Static site generation with 11ty
- Authentication using AuthJS
- MongoDB database for content storage
- GitHub integration for content version control

## 3. Architecture Overview
- **Frontend**: 11ty-generated static site
- **Backend**: Express.js Node.js server
- **CMS**: TinaCMS with MongoDB adapter
- **Authentication**: AuthJS
- **Git Provider**: GitHub
- **Deployment Target**: Railway (migrating from Google Cloud)

## 4. Input / Output Contracts
| Input | Format | Source |
|-------|--------|--------|
| Content edits | JSON | TinaCMS UI |
| Authentication | OAuth | GitHub |

| Output | Format | Destination |
|--------|--------|------------|
| Static site | HTML/CSS/JS | Railway hosting |
| Content data | JSON | MongoDB |

## 5. Constraints / Edge Cases
- Requires MongoDB connection
- Requires GitHub personal access token
- Environment variables must be properly configured
- Authentication must be properly set up for production

## 6. File Map
- `app.ts`: Main Express server setup
- `tina/config.tsx`: TinaCMS configuration
- `tina/database.ts`: Database adapter setup
- `site/`: Static site source files
- `_site/`: Generated static site (not in repo)
- `Dockerfile`: Container configuration

## 7. Action Items for Railway Deployment

### 1. Set Up Railway Project
- Create a new Railway project
- Link to GitHub repository
- Configure Railway to use the existing Dockerfile

### 2. Configure Environment Variables
Set the following environment variables in Railway:
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Random string for session encryption
- `GITHUB_BRANCH`: Main branch of your repository (e.g., "main")
- `GITHUB_OWNER`: GitHub username or organization
- `GITHUB_REPO`: Repository name
- `GITHUB_PERSONAL_ACCESS_TOKEN`: GitHub PAT with repo access
- `NEXTAUTH_URL`: Your Railway app URL (will be available after first deployment)
- `PORT`: 3000 (Railway sets this automatically)

### 3. Database Setup
- Create MongoDB Atlas cluster or use Railway's MongoDB plugin
- Get connection string and add to environment variables
- Ensure network access is configured properly

### 4. Deployment Process
- Push code to GitHub repository
- Railway will automatically detect the Dockerfile and build the application
- First deployment will create the app URL
- Update `NEXTAUTH_URL` with the deployed URL

### 5. Post-Deployment Configuration
- Test authentication flow
- Verify content editing capabilities
- Set up custom domain if needed
- Configure SSL if using custom domain

### 6. Monitoring and Maintenance
- Set up logging
- Configure resource scaling as needed
- Set up monitoring alerts

## 8. Open Questions
- [ ] Will we need to adjust the MongoDB connection for Railway's networking?
- [ ] Do we need to modify the Dockerfile for Railway compatibility?
- [ ] Will we need to adjust the authentication callback URLs?
- [ ] What resource tier is appropriate for our expected traffic?

## 9. Last Updated
2025-08-21 by Cascade
