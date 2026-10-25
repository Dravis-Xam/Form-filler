# Marriage Certificate Filler

A React, TypeScript, and Vite single-page app for completing a marriage certificate using the included PDF template.

## Deploy to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New Project** and import the repository.
3. Use these project settings (also defined in `vercel.json`):
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Deploy. No environment variables are required.

The Vercel rewrite sends app routes such as `/upload` and `/workspace/ceremony` to the SPA entry point, so direct links and browser refreshes work.

## Local checks

```sh
npm install
npm run lint
npm run build
npm run preview
```

Spreadsheet data is processed in the browser. Form drafts are saved in the browser's local storage.
