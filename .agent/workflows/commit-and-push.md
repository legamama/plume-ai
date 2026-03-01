---
description: Commit and Push with Changelog Update
---

When the user asks you to "commit all new changes and push updates to github repo to be deployed with netlify and vercel", you MUST ALWAYS follow these steps:

1. Determine the changes you have made and summarize them.
2. Update the version number in `package.json` (e.g., increment patch version).
3. Update `src/lib/updateLogs.ts` by adding a new `UpdateLog` entry at the BEGINNING of the `UPDATE_LOGS` array. It must include:
    - `version`: The new version number.
    - `date`: The current date (YYYY-MM-DD format).
    - `time`: The current time (e.g. 04:30 PM).
    - `changes`: A list of strings concisely describing the new features or fixes.
4. Stage all changes: `git add .`
5. Commit the changes: `git commit -m "chore/feat/fix: <summary>" -m "<detailed description>"`
6. Push the changes to GitHub: `git push origin main`

These steps ensure the frontend settings page always displays the latest app version and changelog features for better tracking.
