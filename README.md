<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1h2NVMN1Kj8VkoWwByhLeN5mPMFhGln5M

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

The dev command now launches both the Vite frontend (http://localhost:3000) and a lightweight Express backend that stores generated media under the local `generated/` folder. Your gallery history persists across browsers because files and metadata are written to disk.
