import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8081;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
  '.apk': 'application/vnd.android.package-archive',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !reqPath) reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Dedicated share landing page for iOS & APK downloads
  if (reqPath === '/share' || reqPath === '/share.html') {
    const publicSharePath = path.join(__dirname, 'public_share.html');
    if (fs.existsSync(publicSharePath)) {
      filePath = publicSharePath;
    }
  } else if (reqPath.startsWith('/downloads/')) {
    const downloadsPath = path.join(__dirname, reqPath);
    if (fs.existsSync(downloadsPath)) {
      filePath = downloadsPath;
    }
  } else if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // Single Page Application fallback to index.html
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 - Internal Server Error');
    } else {
      let finalContent = content;
      if (ext === '.html') {
        let htmlStr = content.toString('utf8');
        if (!htmlStr.includes('apple-mobile-web-app-capable')) {
          htmlStr = htmlStr.replace(
            '<head>',
            '<head>\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n    <meta name="apple-mobile-web-app-title" content="MaxGain" />'
          );
          finalContent = Buffer.from(htmlStr, 'utf8');
        }
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
      });
      res.end(finalContent);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ MaxGain Production Server running on port ${PORT}`);
});
