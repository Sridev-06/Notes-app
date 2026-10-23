# MyNotes — Personal Notes App

A beginner-friendly full-stack notes app. Users create an account, sign in, and manage private notes. The API verifies a JWT on every notes request and only returns or changes notes owned by that account.

## Features

- Register and sign in with email and password
- Passwords are hashed before being stored
- JWT-protected notes API and user-specific notes
- Create, read, edit, delete, search, and tag-filter notes
- Optionally add a checklist to a note and tick items off; regular notes need no checklist
- Pin and unpin notes; pinned notes appear first
- Automatic MongoDB creation and update timestamps
- Responsive React interface with loading, error, empty, and success states

## Stack and structure

- React, Vite, JavaScript, Axios, and CSS
- Node.js, Express, bcryptjs, and JSON Web Tokens
- MongoDB and Mongoose

```text
personal-notes-app/
├── client/src/main.jsx
├── client/src/style.css
├── client/.env.example
├── server/models/Note.js
├── server/models/User.js
├── server/middleware/authMiddleware.js
├── server/routes/authRoutes.js
├── server/routes/noteRoutes.js
├── server/.env.example
└── server/server.js
```

## Setup and run

Requirements: Node.js 18 or later and MongoDB Community Server or MongoDB Atlas.

1. Start MongoDB.
2. In `server`, copy `.env.example` to `.env`. Set `MONGO_URI` and replace `JWT_SECRET` with a long random secret. Keep `.env` private.
3. Start the API:

   ```bash
   cd server
   npm install
   npm run dev
   ```

   The API is available at `http://localhost:5000` once it reports a MongoDB connection.
4. In a second terminal, start the client:

   ```bash
   cd client
   npm install
   npm run dev
   ```

   Open the Vite URL, usually `http://localhost:5173`. Create an account or sign in.

Optional: copy `client/.env.example` to `client/.env` and change `VITE_API_URL` if the API is hosted elsewhere. Set `CLIENT_URL` to the frontend origin.

## Authentication API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account; requires `{ "email": "you@example.com", "password": "at-least-8-characters" }` |
| POST | `/api/auth/login` | Sign in with email and password |

Successful registration and login return `{ "message": "...", "token": "...", "user": { "id": "...", "email": "..." } }`. Passwords are never returned. The client keeps the token in local storage and sends it as `Authorization: Bearer <token>`. Tokens expire after seven days; sign in again when yours expires.

## Notes API

Every endpoint below requires a valid `Authorization: Bearer <token>` header. Notes are always scoped to the signed-in user; sending another note's ID does not grant access to it.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/notes` | List your notes; optional `search`, `tag`, and `pinned` query parameters |
| GET | `/api/notes/:id` | Retrieve one of your notes |
| POST | `/api/notes` | Create a note (201) |
| PUT | `/api/notes/:id` | Update one of your notes |
| DELETE | `/api/notes/:id` | Delete one of your notes |
| PATCH | `/api/notes/:id/pin` | Toggle your note's pinned status |

Example create body:

```json
{
  "title": "DBMS Revision",
  "content": "Revise SQL joins and normalization.",
  "tags": ["college", "DBMS"],
  "pinned": false
}
```

MongoDB adds `_id`, `createdAt`, and `updatedAt`. Search and tag filters can be combined, for example `GET /api/notes?search=DBMS&tag=college`. Errors are JSON; missing/invalid authentication returns 401, invalid input or IDs return 400, and missing or other users' notes return 404.

## Verify with Postman

1. POST `/api/auth/register` to create an account, then copy the returned token.
2. Add `Authorization: Bearer <token>` to protected requests.
3. POST `/api/notes` with the example body; GET `/api/notes` and GET `/api/notes/{id}`.
4. PUT `/api/notes/{id}`, PATCH `/api/notes/{id}/pin`, and DELETE `/api/notes/{id}`.
5. Try GET `/api/notes?search=DBMS&tag=college` and `/api/notes?pinned=true`.
6. Try a notes request without a token (401), invalid input (400), and an unknown ID (404).
7. Register a second account. Its notes list should not include the first account's notes. Attempting to access another user's note ID should return 404.

## Note model

`Note` has required trimmed `title` and `content`, optional string-array `tags`, `pinned` (default false), optional `checklistEnabled` (default false) and checklist items (`text`, `completed`), required `user` ownership, and automatic timestamps. `User` has a unique normalized email and a bcrypt-hashed password. No note ownership is accepted from the client request body.
