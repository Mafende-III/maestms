# Mafende Estate Management System

This is the main application directory for the Mafende Estate Management System.

## Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Set up database:
```bash
pnpm db:push
pnpm db:seed
```

4. Start development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

- `src/app/` - Next.js 14 App Router pages and API routes
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations
- `public/` - Static assets

## Documentation

See the main project documentation in the `../docs/` directory:

- [System Requirements](../docs/00-system-requirements.md)
- [Development Guide](../docs/01-development-guide.md)
- [Task List](../docs/04-task-list.md)
- [Progress Tracker](../docs/03-progress-tracker.md)

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL, Prisma ORM
- **Authentication:** NextAuth.js
- **Caching:** Redis
- **Forms:** React Hook Form, Zod validation