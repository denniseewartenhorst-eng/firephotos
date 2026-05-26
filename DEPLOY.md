# FirePhotos — Deployment Guide (No coding required)

Follow these steps in order. Total time: ~20 minutes.

---

## STEP 1 — Set up Supabase database

You already created the Supabase project. Now you need to set up the tables and storage.

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Open the file `supabase-schema.sql` from this folder, copy ALL of it, paste into the editor
5. Click **Run** (bottom right)
6. You should see "Success. No rows returned."

✅ Database is set up.

---

## STEP 2 — Create the photos storage bucket (if not already done)

1. In Supabase, click **Storage** in the left sidebar
2. If you don't see a bucket called `photos`, click **New bucket**
3. Name: `photos`
4. Toggle **Public bucket** to ON
5. Click **Create bucket**

✅ Storage is set up.

---

## STEP 3 — Put the code on GitHub

GitHub is where Vercel will pull the code from. Even though you don't code, you need a free GitHub account to host the files.

1. Go to https://github.com and sign up (free, no card needed)
2. Once logged in, click the **+** in the top right → **New repository**
3. Repository name: `firephotos`
4. Set it to **Public** (private also works on free tier but public is simpler)
5. ⚠️ DO NOT check "Add a README file"
6. Click **Create repository**

You'll see a page with instructions. Ignore them — we'll upload files differently.

7. On that empty repo page, click the link **"uploading an existing file"** (in the middle of the page)
8. Open the `firephotos` folder on your computer (where these files are)
9. Select EVERY file and folder (Ctrl+A on Windows, Cmd+A on Mac) inside the firephotos folder
   - Include: `src`, `public`, `package.json`, `next.config.js`, etc.
   - ⚠️ DO NOT include `node_modules` (it shouldn't be there yet anyway)
   - DO NOT include `.env.local` if it exists
10. Drag them all onto the GitHub page
11. Wait for upload to complete (the sticker PNGs are the biggest, ~100KB each)
12. Scroll down, click **Commit changes**

✅ Code is on GitHub.

---

## STEP 4 — Deploy to Vercel

1. Go to https://vercel.com and sign up using **"Continue with GitHub"**
2. After signing up, click **Add New...** → **Project**
3. You'll see a list of your GitHub repos. Find `firephotos` and click **Import**
4. On the configuration screen:
   - Framework Preset: should auto-detect as **Next.js** ✓
   - Leave everything else default
5. Click the **Environment Variables** section to expand it
6. Add these THREE variables one at a time:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://zsitvrpxifbggnbzhody.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (paste your full anon key — the long `eyJ...` string) |
   | `NEXT_PUBLIC_DEV_MODE` | `true` |

7. Click **Deploy**
8. Wait ~2 minutes for the build

✅ App is live! Vercel will give you a URL like `https://firephotos-xyz.vercel.app`

---

## STEP 5 — Test it

1. Open the Vercel URL on your phone
2. Sign in with a test name + password (this creates the account)
3. Go to **DEV** tab and click "Skip Day" — this runs a cycle with no data, just to verify it works
4. Upload a few test photos
5. Click "Skip Day" again — now those photos should appear in **Yesterday's Photos**
6. Try voting (double-tap), the sticker editor (give yourself crown first via Dev tab), and history

---

## STEP 6 — Share with your group

Once you're happy with how it works:
1. Send the Vercel URL to your 14 friends
2. Each person opens it, picks a name + password, starts uploading
3. The cycle runs automatically the first time anyone opens the app after 07:00 Amsterdam

---

## STEP 7 — Turn off DEV mode before sharing publicly

When you're ready to "go live" with the group:
1. Go to Vercel → your project → **Settings** → **Environment Variables**
2. Change `NEXT_PUBLIC_DEV_MODE` from `true` to `false`
3. Click **Save**
4. Go to the **Deployments** tab, find the latest deployment, click the three dots → **Redeploy**

This hides the Dev tab and prevents anyone in the group from using the day-skip / crown-force / reset buttons.

---

## TROUBLESHOOTING

**"Cannot connect to Supabase"** — Double-check the `NEXT_PUBLIC_SUPABASE_URL` env var has no trailing slash and no `/rest/v1/` at the end. Should be exactly `https://zsitvrpxifbggnbzhody.supabase.co`.

**Uploads fail** — Check that the `photos` bucket exists in Supabase Storage and is set to public.

**Login says "Invalid name or password" the first time** — That actually means a user with that name already exists. Use a different name or the correct password.

**Photos look squashed or cropped wrong** — That's the browser's default. Pull-to-refresh.

**Sticker won't apply** — Only the crown holder can apply stickers. Go to Dev tab → "Make me crown holder" first.

**Day cycle didn't auto-run at 07:00** — The cycle runs the first time anyone opens the app after 07:00, not exactly at 07:00. If no one opens it for hours, that's fine — it'll catch up.

---

## DELETING EVERYTHING AFTER 7 DAYS

After the event:
1. **Vercel**: project → Settings → scroll to bottom → Delete Project
2. **Supabase**: project → Settings → scroll to bottom → Delete project
3. **GitHub**: repo → Settings → scroll to bottom → Delete repository

All gone. No charges, no leftovers.
