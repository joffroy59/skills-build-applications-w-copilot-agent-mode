# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use React 19 pages and shared fetch logic for each capability, with accessible loading, empty, and error states. The UI should consume the API contract without business logic; it only renders state from `/api/*` responses and keeps route-based navigation simple.
- Logic tier decision: Keep Express endpoints thin and push validation/business behavior into explicit service helpers. Use deliberate 4xx responses for invalid IDs and missing records, and keep all `/api` routes under a single router that returns consistent JSON shapes.
- Data tier decision: Model validation stays in Mongoose schemas, while seed and membership reconciliation stay in database setup logic. Use stable upserts and do not wipe collections; when a seeded demo user moves teams, remove them from the prior team membership before adding them to the new team.
- Activity tracking approach: Store user, team, type, minutes, points, and occurredAt, using a computed points value derived from minutes and the activity type. Reject invalid user or team references with 4xx and never leak Mongo cast errors as 500s.
- Team management approach: Teams require a name and mascot, and members default to an empty array. Accept member IDs as strings, normalize them to ObjectIds, and expose them in list responses.
- Leaderboard approach: Aggregate activity points by team, order descending by totalPoints, and assign a 1-based rank to each row. The leaderboard should be derived from persisted activity records rather than from in-memory state.
- Workout suggestions approach: Suggest workouts by matching a user’s goals and recent activity pattern (for example, endurance or strength), using the seeded user email as the lookup key. Unknown users should return a 4xx and the first suggestion should explain why it matches the user.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Failing contract: the Mongoose schema assertions show the data layer has not yet enforced required fields for users, teams, activities, and workouts.
  - This is the first fix point because API and UI expectations rely on the model contract being valid.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Failing contract: invalid POST requests return 501 instead of deliberate 4xx, leaderboard aggregation is empty, and workout suggestions are not matching user activity patterns.
  - This confirms the route/service layer must be implemented after the models are correct.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Failing contract: the UI does not render fetched data or accessible states, which means the presentation layer still needs to read API responses and display loading, empty, success, and error states correctly.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Used to catch TypeScript and Express compilation issues after the data and API contracts are aligned.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Used to catch React/Vite compile issues after the UI is wired to the correct API contract.
