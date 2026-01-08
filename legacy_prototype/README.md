# Social Media Starter (HTML + API scaffold)

This repo is a clean, professional starting point that includes:
- `client/` static site (your provided HTML is placed in `client/public/index.html`)
- `server/` Node/Express API scaffold (auth/users/posts/media placeholders)
- local upload folder (`server/uploads/`) using multer (dev only)

## Structure
```
.
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── app.js
│       └── styles.css
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   │   └── env.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── error.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── users.js
│   │       ├── posts.js
│   │       └── media.js
│   ├── uploads/
│   │   └── .gitkeep
│   └── package.json
├── package.json
└── docker-compose.yml
```

## Quick start (local)
1) Install dependencies
```bash
npm install
```

2) Run both client + server (two terminals)
```bash
npm run dev:server
npm run dev:client
```

- Client: http://localhost:5173
- Server: http://localhost:8080
- API health: http://localhost:8080/api/health

## Notes
- The HTML you provided appears to be a Wix viewer document and references Wix/Parastorage assets. It is included as-is so you can version it and iterate, but you may want to replace it with your own UI as you build features.
- For production media storage, wire `server/src/routes/media.js` to S3/R2/GCS and store metadata in a database (Postgres recommended).
