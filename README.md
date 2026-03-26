# music ranking

A personal music ranking app for tracking and ranking your favorite artists and albums.

## Features

- Add artists and their albums, then rank songs within each album
- Build an overall ranked discography for each artist across all albums
- Per-user profiles with customizable themes (Lover, Reputation, Love Sux, and more)
- View other members' rankings alongside your own
- Drag-and-drop song ordering

## Tech Stack

- Vue 3 + Vuex + Vue Router
- Firebase (Auth + Firestore)
- Bootstrap 5

## Setup

1. Clone the repo and run `npm install`
2. Create a `.env` file with your Firebase project config:
   ```
   VUE_APP_FIREBASE_API_KEY=...
   VUE_APP_FIREBASE_AUTH_DOMAIN=...
   VUE_APP_FIREBASE_PROJECT_ID=...
   VUE_APP_FIREBASE_STORAGE_BUCKET=...
   VUE_APP_FIREBASE_MESSAGING_SENDER_ID=...
   VUE_APP_FIREBASE_APP_ID=...
   ```
3. Run `npm run serve` to start the dev server

## Deploy

Deployed on Netlify. The `netlify.toml` includes a redirect rule for SPA routing.
