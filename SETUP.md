# Form Filling Project - Local Setup

## Prerequisites
1. Install Node.js (version 18 or higher) from https://nodejs.org/
2. Restart your terminal/command prompt after installation

## Quick Setup
1. Run `setup.bat` (Windows) or follow manual steps below
2. Run `npm run dev` to start the development server
3. Open http://localhost:5000 in your browser

## Manual Setup Steps
```bash
# Install dependencies
npm install

# Setup SQLite database
npm run db:push

# Start development server
npm run dev
```

## Changes Made for Local Development
- Switched from PostgreSQL to SQLite (no external database needed)
- Updated scripts to work on Windows
- Database file will be created as `local.db` in the project root

## Usage
1. **Analyze Forms**: Go to /analyze to analyze Google Forms
2. **Dashboard**: View all jobs and their status
3. **Job Details**: Click on any job to see detailed progress

The app will automatically create the SQLite database file when you first run it.