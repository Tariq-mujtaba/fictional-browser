# Fictional Web

Fictional Web is a local full-stack browser for a made-up `.zz` internet. It supports linked pages, full-text search, per-person history, and publishing sanitized HTML.

## Quick start

Requires Node.js 24.x, npm, and a running Docker Engine. Local defaults are built in, so no environment files are needed.

```sh
npm --prefix backend ci
npm --prefix frontend ci
docker compose up -d mongo
npm --prefix backend run seed
```

Start the API and web app in separate terminals:

```sh
npm --prefix backend run start:dev
```

```sh
npm --prefix frontend run dev
```

Open [http://localhost:3000](http://localhost:3000).
