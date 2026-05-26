# 🔥 FirePhotos

A private daily-photo group app for a small trusted crew. Built with Next.js + Supabase.

## How it works

- 14 people, each uploads up to 3 photos per day
- Nobody sees anyone else's uploads until **07:00 Amsterdam** the next morning
- At 07:00, yesterday's photos reveal in a TikTok-style feed
- Everyone gets **2 fire emojis** to vote with each day
- Top voted photo = **Photo of the Day**, saved permanently
- Most all-time wins = **crown holder**, unlocks daily sticker tool
- Day before yesterday's photos move to **History**

## Setup

**Read `DEPLOY.md` for step-by-step instructions.**

Quick summary:
1. Run `supabase-schema.sql` in your Supabase SQL editor
2. Push this folder to a GitHub repo
3. Import the repo in Vercel
4. Add the 3 environment variables
5. Deploy → share the URL

## Stack

- **Next.js 14** (Pages Router) — hosted on Vercel free tier
- **Supabase** — database + storage + auth
- **Tailwind CSS** — styling
- **bcryptjs** — password hashing
- **browser-image-compression** — client-side photo compression to ~1MB

## Dev mode

When `NEXT_PUBLIC_DEV_MODE=true`, a Dev tab appears with:
- Skip Day (force the 07:00 cycle to run now)
- Make me crown holder
- Reset all data

All dev endpoints are gated by this env var. Setting it to `false` and redeploying is enough to disable everything dev-related.
