# TrakFlow

This is a Next.js (full stack) app designed to help construction teams track tools and materials, reduce shrinkage, and save money.

## Table of Contents

- [Getting Started](#getting-started)
- [Required Software](#required-software)
- [About the env file](#about-the-env-file)
- [Connecting to Supabase](#connecting-to-the-supabase)
- [API Routes](#api-routes)
- [Storage](#storage)
- [Useful Commands](#useful-commands)

## Getting Started

### Local Development

This app is designed to run locally for development. You’ll need Node.js and a Supabase project.

## Required Software

1. Node.js (v20 or higher recommended)
   Download from https://nodejs.org/
   Verify installation:

```bash
node -v
```

2. Supabase Account
   Sign up at [https://supabase.com/](https://supabase.com/) and create a project.

## About The env File

You must create your own `.env.local` file based on the provided `.env.example`.

The `.env.local` file contains sensitive configuration values that **must never be committed or pushed to any repository** under any circumstances.

Set the following variables in `.env.local`:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these from your Supabase project dashboard.

## Connecting to Supabase

- `SUPABASE_URL` should match your Supabase project’s API URL.
- `SUPABASE_ANON_KEY` is your project’s anon/public key.

## API Routes

This app uses Next.js API routes for backend logic.
You can add new endpoints under the `app/api/` directory.

## Useful Commands

All commands are run from the project root.

- Install dependencies:

```bash
npm install
```

- Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

- Build for production:

```bash
npm run build
```

- Start production server:

```bash
npm run start
```

- Lint the code:

```bash
npm run lint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
