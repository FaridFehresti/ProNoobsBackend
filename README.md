# ProNoobs Tournament API

Express and PostgreSQL API for managing Dota 2 tournaments, teams, player identities and MMR, rosters, and registrations. It is designed to be shared by the website and a future Discord bot.

## Requirements and setup

- Node.js 20 or later
- PostgreSQL

From this directory, create the database and apply the schema:

```bash
createdb pronoobs
psql -d pronoobs -f migrations/001_initial_schema.sql
npm install
```

Copy `.env.example` to `.env`. Set `DATABASE_URL`, create a long random `ADMIN_API_KEY`, and configure `CORS_ORIGINS` with the website's full origin(s), comma-separated. Start the API with `npm run dev` for development or `npm start` for production. It listens on port 3000 by default.

`GET /health` checks the API and database connection.

## Routes

Public read routes:

- `GET /api/tournaments` and `GET /api/tournaments/:id`
- `GET /api/teams` (includes roster members and MMR)
- `GET /api/tournaments/:id/registrations`

All write routes require `X-API-Key: <ADMIN_API_KEY>`:

- `POST /api/tournaments` — create a tournament. Use status `registration_open` to accept entries.
- `PATCH /api/tournaments/:id` — update tournament details, dates, team limit, or status.
- `POST /api/teams` — create a team with 1–10 members. Each member needs a `displayName` and non-negative integer `mmr`. Optional fields: `discordId`, `steamId`, `position`, and `isCaptain`. The first member becomes captain by default.
- `PATCH /api/players/:id` — update a player's display name, MMR, Discord ID, or Steam ID.
- `POST /api/tournaments/:id/registrations` with `{ "teamId": 1 }` — register an existing team while registration is open and capacity remains.
- `PATCH /api/registrations/:id` with `{ "status": "approved" }` — set registration status to `pending`, `approved`, `rejected`, or `withdrawn`.

Keep the API key on a trusted server or bot. Do not place it in browser code. Direct website writes need user authentication or a server-side form handler first.

## Data model

The initial SQL migration creates tournaments, teams, players, team memberships, and tournament registrations. Discord and Steam IDs are optional and unique when present. A player can belong to one team roster at a time; each team can have one captain. Registration capacity is checked transactionally.
