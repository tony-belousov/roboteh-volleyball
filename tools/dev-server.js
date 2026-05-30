const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = process.cwd();
const port = Number(process.env.PORT || 4173);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    send(res, 403, 'Доступ запрещён');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, 'Не найдено');
      return;
    }

    send(res, 200, data, types[path.extname(filePath)] || 'application/octet-stream');
  });
});

server.listen(port, () => {
  console.log(`Сетка доступна: http://localhost:${port}`);
});

// В скрытой Windows-сессии stdin может закрыться раньше, чем нужно локальному серверу.
setInterval(() => {}, 2147483647);
