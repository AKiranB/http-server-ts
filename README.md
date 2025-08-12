## http-server-ts

A handcrafted HTTP server written in TypeScript — built for exploring the guts of HTTP.
This project dives into the raw details of the HTTP protocol:

Manual header parsing

Handling persistent (keep-alive) connections

Implementing compression (gzip/deflate)

Status codes, routing, and more

✨ Features
From scratch: no Express, no Koa — just net/http modules and TypeScript

Custom header parsing — learn exactly how requests are interpreted

Keep-Alive support — persistent TCP connections for multiple requests

Compression — gzip and deflate encodings implemented manually

Basic routing — enough to serve different endpoints

Logging — simple request/response logging for debugging

📦 Requirements
Node.js 18+

npm, pnpm, yarn, or bun

🚀 Getting Started
bash
Copy
Edit
# 1. Clone the repo
git clone https://github.com/AKiranB/http-server-ts.git
cd http-server-ts

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev

# 4. Build & run in production
npm run build
npm start
🔍 Example Usage
bash
Copy
Edit
# Default GET request
curl -i http://localhost:3000/

# With gzip compression
curl -i --compressed http://localhost:3000/

# Keep-alive demonstration
curl -i -H "Connection: keep-alive" http://localhost:3000/
🗂 Project Structure
plaintext
Copy
Edit
.
├── src/
│   ├── server.ts           # Entry point
│   ├── parser/             # Header & request parsing
│   ├── compression/        # gzip/deflate logic
│   ├── routing/            # Simple router
│   └── utils/              # Helper functions
├── package.json
├── tsconfig.json
└── README.md
🛠 Extending
Some ideas for further development:

HTTP/2 support

Chunked transfer encoding

Cookie parsing & sessions

HTTPS/TLS

Static file serving

📜 License
MIT — Have fun hacking!



