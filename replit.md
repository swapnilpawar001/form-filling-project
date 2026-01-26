# FormAuto - Google Forms Automation

## Overview

FormAuto is a web-based automation application that submits responses to public Google Forms using data from Excel files or Google Sheets. The app analyzes third-party Google Forms (without requiring ownership or authentication), extracts form field information, and enables bulk submission of responses via HTTP requests.

**Key Capabilities:**
- Analyze any public Google Form URL to extract field IDs and question types
- Parse Excel/CSV files containing submission data
- Queue and process bulk form submissions
- Track job progress with real-time status updates

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight router)
- **State Management:** TanStack React Query for server state
- **Styling:** Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool:** Vite with custom path aliases (`@/` for client, `@shared/` for shared code)
- **File Parsing:** XLSX library for Excel/CSV processing in browser

The frontend uses a dashboard layout with a fixed sidebar navigation. Pages include Dashboard (overview/stats), Analyze (form analysis and job creation), and JobDetails (individual job monitoring).

### Backend Architecture
- **Framework:** Express.js with TypeScript
- **Runtime:** Node.js with tsx for development
- **API Design:** RESTful endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Web Scraping:** Cheerio + Axios for parsing Google Form HTML to extract field data

The server parses Google Forms by fetching the public form page and extracting the `FB_PUBLIC_LOAD_DATA_` JavaScript variable that contains form structure data.

### Data Storage
- **ORM:** Drizzle ORM with PostgreSQL
- **Schema Location:** `shared/schema.ts`
- **Tables:**
  - `forms` - Stores analyzed form metadata (URL, title, extracted fields as JSONB)
  - `jobs` - Bulk submission jobs with status tracking (pending/processing/completed)
  - `jobRows` - Individual row submissions with per-row status and results

### Build System
- Development: Vite dev server with HMR, proxied through Express
- Production: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Database migrations: `drizzle-kit push` for schema synchronization

### Key Design Decisions

**No Google API/Authentication:** The app works by scraping public form pages and submitting via HTTP POST to Google's form response endpoint. This avoids OAuth complexity and works with any public form.

**Shared Type Safety:** The `shared/` directory contains database schemas and API route definitions used by both frontend and backend, ensuring type consistency across the stack.

**Job Queue Pattern:** Submissions are queued as `jobRows` with individual status tracking, allowing for retry logic and detailed progress reporting.

## External Dependencies

### Database
- **PostgreSQL** - Required for persistent storage
- **Connection:** Via `DATABASE_URL` environment variable
- **Session Storage:** connect-pg-simple for Express sessions

### Third-Party Services
- **Google Forms** - Target for form analysis and submission (public access only, no API key needed)

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `axios` / `cheerio` - HTTP requests and HTML parsing for form scraping
- `xlsx` - Excel/CSV file parsing
- `zod` / `drizzle-zod` - Runtime validation and schema generation
- `@tanstack/react-query` - Async state management
- `@radix-ui/*` - Accessible UI primitives for shadcn components