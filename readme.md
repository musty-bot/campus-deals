# Campus Deals

A mobile‑first, anonymous classifieds site for students. Built with HTML, CSS, JavaScript, and Supabase.

## Features
- Post items without an account
- Admin approval to prevent spam
- Anonymous tracking (page views, post views, contact clicks)
- Admin dashboard with analytics

## Setup
1. Create a Supabase project.
2. Run the SQL from `schema.sql` (provided in the main answer).
3. Create a `post-images` storage bucket (public).
4. Add an admin user in Supabase Auth.
5. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.
6. Run `npm install` and `npm run dev` to start locally.

## Deployment
Deploy to Netlify/Vercel, set the environment variables, and you're live.