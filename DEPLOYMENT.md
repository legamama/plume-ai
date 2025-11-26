# Deployment Guide

## 1. Push to GitHub

1.  Create a new repository on GitHub (e.g., `plume-ai`).
2.  Run the following commands in your terminal to push your local code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/plume-ai.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Netlify

1.  Log in to [Netlify](https://app.netlify.com/).
2.  Click **"Add new site"** > **"Import an existing project"**.
3.  Select **GitHub**.
4.  Authorize Netlify to access your GitHub repositories.
5.  Search for and select your `plume-ai` repository.
6.  **Build Settings:**
    *   **Build command:** `npm run build`
    *   **Publish directory:** `.next`
    *   (These should be auto-detected thanks to `netlify.toml`)

7.  **Environment Variables:**
    *   Click **"Add environment variables"**.
    *   Add the following variables from your `.env.local` file:
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `GEMINI_API_KEY`

8.  Click **"Deploy plume-ai"**.

## 3. Post-Deployment

*   Once deployed, Netlify will give you a live URL (e.g., `https://plume-ai-xyz.netlify.app`).
*   **Important:** Go to your **Supabase Dashboard** > **Authentication** > **URL Configuration**.
*   Add your Netlify URL to the **Site URL** and **Redirect URLs** to ensure authentication works correctly in production.
