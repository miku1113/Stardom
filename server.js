const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'assets', 'uploads');

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory active sessions: token -> { username, expiresAt }
const sessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function readSiteData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading site data:', err);
  }
  return {
    company: {},
    hero: {},
    stats: [],
    projects: [],
    services: [],
    blogs: [],
    careers: [],
    inquiries: [],
    auth: { username: 'admin', password: 'stratum2026' }
  };
}

function writeSiteData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving site data:', err);
    return false;
  }
}

// Session Validation Helper
function getSessionToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // Also check cookie
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith('stratum_token=')) {
        return c.substring('stratum_token='.length);
      }
    }
  }
  return null;
}

function isAuthenticated(req) {
  const token = getSessionToken(req);
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protection against large payloads (max 20MB for images)
      if (body.length > 20 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const [reqUrl, queryStr] = req.url.split('?');

  // ==========================================
  // API ROUTING
  // ==========================================
  if (reqUrl.startsWith('/api/')) {
    
    // --- 1. AUTH: LOGIN ---
    if (reqUrl === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const data = readSiteData();
      const currentAuth = data.auth || { username: 'admin', password: 'stratum2026' };

      if (body.username === currentAuth.username && body.password === currentAuth.password) {
        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
        sessions.set(token, { username: body.username, expiresAt });

        res.setHeader('Set-Cookie', `stratum_token=${token}; Path=/; Max-Age=604800; SameSite=Lax`);
        return sendJson(res, 200, {
          success: true,
          message: 'Logged in successfully',
          token,
          user: { username: body.username }
        });
      } else {
        return sendJson(res, 401, { success: false, message: 'Invalid username or password' });
      }
    }

    // --- 2. AUTH: STATUS ---
    if (reqUrl === '/api/auth/status' && req.method === 'GET') {
      const authed = isAuthenticated(req);
      return sendJson(res, 200, { authenticated: authed });
    }

    // --- 3. AUTH: LOGOUT ---
    if (reqUrl === '/api/auth/logout' && req.method === 'POST') {
      const token = getSessionToken(req);
      if (token) sessions.delete(token);
      res.setHeader('Set-Cookie', 'stratum_token=; Path=/; Max-Age=0');
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    }

    // --- 4. AUTH: CHANGE PASSWORD (PROTECTED) ---
    if (reqUrl === '/api/auth/password' && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      if (!body.newPassword || body.newPassword.length < 6) {
        return sendJson(res, 400, { success: false, message: 'Password must be at least 6 characters' });
      }
      const data = readSiteData();
      data.auth = data.auth || {};
      if (body.currentPassword && body.currentPassword !== data.auth.password) {
        return sendJson(res, 400, { success: false, message: 'Current password incorrect' });
      }
      data.auth.password = body.newPassword;
      if (body.newUsername) data.auth.username = body.newUsername;
      writeSiteData(data);
      return sendJson(res, 200, { success: true, message: 'Credentials updated successfully' });
    }

    // --- 5. GET SITE DATA (PUBLIC & ADMIN) ---
    if (reqUrl === '/api/data' && req.method === 'GET') {
      const data = readSiteData();
      const sanitized = { ...data };
      delete sanitized.auth;
      if (!isAuthenticated(req)) {
        delete sanitized.inquiries;
      }
      res.setHeader('Cache-Control', 'no-store');
      return sendJson(res, 200, sanitized);
    }

    // --- 6. UPDATE GENERAL SITE CONTENT (PROTECTED) ---
    if (reqUrl === '/api/data' && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      const data = readSiteData();

      if (body.company) data.company = { ...data.company, ...body.company };
      if (body.hero) data.hero = { ...data.hero, ...body.hero };
      if (body.stats) data.stats = body.stats;

      writeSiteData(data);
      return sendJson(res, 200, { success: true, message: 'Site settings updated', data });
    }

    // --- 7. PROJECTS CRUD ---
    if (reqUrl === '/api/projects' && req.method === 'GET') {
      const data = readSiteData();
      return sendJson(res, 200, data.projects || []);
    }

    if (reqUrl === '/api/projects' && req.method === 'POST') {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const body = await parseJsonBody(req);
      const data = readSiteData();
      data.projects = data.projects || [];

      const newProject = {
        id: 'proj-' + Date.now(),
        title: body.title || 'Untitled Project',
        category: body.category || 'commercial',
        sector: body.sector || '',
        location: body.location || '',
        area: body.area || '',
        image: body.image || 'assets/project-commercial.jpg',
        description: body.description || '',
        tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map(s => s.trim()) : []),
        featured: Boolean(body.featured),
        completionYear: body.completionYear || new Date().getFullYear().toString()
      };

      data.projects.unshift(newProject);
      writeSiteData(data);
      return sendJson(res, 201, { success: true, project: newProject });
    }

    if (reqUrl.startsWith('/api/projects/') && (req.method === 'PUT' || req.method === 'DELETE')) {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const id = reqUrl.replace('/api/projects/', '').trim();
      const data = readSiteData();
      data.projects = data.projects || [];
      const index = data.projects.findIndex(p => p.id === id);

      if (index === -1) {
        return sendJson(res, 404, { success: false, message: 'Project not found' });
      }

      if (req.method === 'DELETE') {
        const deleted = data.projects.splice(index, 1);
        writeSiteData(data);
        return sendJson(res, 200, { success: true, message: 'Project deleted', project: deleted[0] });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        data.projects[index] = {
          ...data.projects[index],
          ...body,
          tags: Array.isArray(body.tags) ? body.tags : (typeof body.tags === 'string' ? body.tags.split(',').map(s => s.trim()) : data.projects[index].tags)
        };
        writeSiteData(data);
        return sendJson(res, 200, { success: true, project: data.projects[index] });
      }
    }

    // --- 8. SERVICES CRUD ---
    if (reqUrl === '/api/services' && req.method === 'GET') {
      const data = readSiteData();
      return sendJson(res, 200, data.services || []);
    }

    if (reqUrl === '/api/services' && req.method === 'POST') {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const body = await parseJsonBody(req);
      const data = readSiteData();
      data.services = data.services || [];

      const newService = {
        id: body.id || 'serv-' + Date.now(),
        title: body.title || 'New Service',
        category: body.category || 'OTHER SERVICES',
        categorySlug: body.categorySlug || 'other',
        anchor: body.anchor || ('serv-' + Date.now()),
        url: body.url || 'services.html',
        summary: body.summary || '',
        scope: body.scope || '',
        deliverables: Array.isArray(body.deliverables) ? body.deliverables : (body.deliverables ? body.deliverables.split(',').map(s => s.trim()) : []),
        standards: body.standards || '',
        tools: body.tools || ''
      };

      data.services.push(newService);
      writeSiteData(data);
      return sendJson(res, 201, { success: true, service: newService });
    }

    if (reqUrl.startsWith('/api/services/') && (req.method === 'PUT' || req.method === 'DELETE')) {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const id = reqUrl.replace('/api/services/', '').trim();
      const data = readSiteData();
      data.services = data.services || [];
      const index = data.services.findIndex(s => s.id === id);

      if (index === -1) {
        return sendJson(res, 404, { success: false, message: 'Service not found' });
      }

      if (req.method === 'DELETE') {
        const deleted = data.services.splice(index, 1);
        writeSiteData(data);
        return sendJson(res, 200, { success: true, message: 'Service deleted', service: deleted[0] });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        data.services[index] = {
          ...data.services[index],
          ...body,
          deliverables: Array.isArray(body.deliverables) ? body.deliverables : (typeof body.deliverables === 'string' ? body.deliverables.split(',').map(s => s.trim()) : data.services[index].deliverables)
        };
        writeSiteData(data);
        return sendJson(res, 200, { success: true, service: data.services[index] });
      }
    }

    // --- 9. BLOGS CRUD ---
    if (reqUrl === '/api/blogs' && req.method === 'GET') {
      const data = readSiteData();
      return sendJson(res, 200, data.blogs || []);
    }

    if (reqUrl === '/api/blogs' && req.method === 'POST') {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const body = await parseJsonBody(req);
      const data = readSiteData();
      data.blogs = data.blogs || [];

      const newBlog = {
        id: 'blog-' + Date.now(),
        title: body.title || 'Untitled Post',
        category: body.category || 'Engineering',
        date: body.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        author: body.author || 'Stratum Engineering Squad',
        readTime: body.readTime || '5 min read',
        image: body.image || 'assets/services-mep-thumb.jpg',
        summary: body.summary || '',
        content: body.content || ''
      };

      data.blogs.unshift(newBlog);
      writeSiteData(data);
      return sendJson(res, 201, { success: true, blog: newBlog });
    }

    if (reqUrl.startsWith('/api/blogs/') && (req.method === 'PUT' || req.method === 'DELETE')) {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const id = reqUrl.replace('/api/blogs/', '').trim();
      const data = readSiteData();
      data.blogs = data.blogs || [];
      const index = data.blogs.findIndex(b => b.id === id);

      if (index === -1) return sendJson(res, 404, { success: false, message: 'Post not found' });

      if (req.method === 'DELETE') {
        const deleted = data.blogs.splice(index, 1);
        writeSiteData(data);
        return sendJson(res, 200, { success: true, message: 'Post deleted', blog: deleted[0] });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        data.blogs[index] = { ...data.blogs[index], ...body };
        writeSiteData(data);
        return sendJson(res, 200, { success: true, blog: data.blogs[index] });
      }
    }

    // --- 10. CAREERS CRUD ---
    if (reqUrl === '/api/careers' && req.method === 'GET') {
      const data = readSiteData();
      return sendJson(res, 200, data.careers || []);
    }

    if (reqUrl === '/api/careers' && req.method === 'POST') {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const body = await parseJsonBody(req);
      const data = readSiteData();
      data.careers = data.careers || [];

      const newJob = {
        id: 'job-' + Date.now(),
        title: body.title || 'Engineering Role',
        department: body.department || 'Engineering',
        location: body.location || 'Gurugram HQ',
        type: body.type || 'Full-time',
        experience: body.experience || '3+ Years',
        description: body.description || '',
        tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map(s => s.trim()) : []),
        active: body.active !== undefined ? Boolean(body.active) : true
      };

      data.careers.unshift(newJob);
      writeSiteData(data);
      return sendJson(res, 201, { success: true, career: newJob });
    }

    if (reqUrl.startsWith('/api/careers/') && (req.method === 'PUT' || req.method === 'DELETE')) {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const id = reqUrl.replace('/api/careers/', '').trim();
      const data = readSiteData();
      data.careers = data.careers || [];
      const index = data.careers.findIndex(c => c.id === id);

      if (index === -1) return sendJson(res, 404, { success: false, message: 'Opening not found' });

      if (req.method === 'DELETE') {
        const deleted = data.careers.splice(index, 1);
        writeSiteData(data);
        return sendJson(res, 200, { success: true, message: 'Job opening deleted', career: deleted[0] });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        data.careers[index] = {
          ...data.careers[index],
          ...body,
          tags: Array.isArray(body.tags) ? body.tags : (typeof body.tags === 'string' ? body.tags.split(',').map(s => s.trim()) : data.careers[index].tags)
        };
        writeSiteData(data);
        return sendJson(res, 200, { success: true, career: data.careers[index] });
      }
    }

    // --- 11. INQUIRIES & LEADS ---
    if (reqUrl === '/api/inquiries' && req.method === 'HEAD') {
      res.writeHead(204, { 'Cache-Control': 'no-store' });
      res.end();
      return;
    }

    // Public: website visitors submitting consultation modal or contact form
    if (reqUrl === '/api/inquiries' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const data = readSiteData();
      data.inquiries = data.inquiries || [];

      const newInquiry = {
        id: 'inq-' + Date.now(),
        date: new Date().toISOString(),
        name: body.name || 'Anonymous',
        email: body.email || '',
        firm: body.firm || '',
        phone: body.phone || '',
        details: body.details || '',
        type: body.type || 'Consultation',
        status: 'New'
      };

      data.inquiries.unshift(newInquiry);
      if (!writeSiteData(data)) {
        return sendJson(res, 500, { success: false, message: 'Could not save inquiry' });
      }
      return sendJson(res, 201, { success: true, message: 'Inquiry received successfully', inquiry: newInquiry });
    }

    // Admin: list inquiries
    if (reqUrl === '/api/inquiries' && req.method === 'GET') {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const data = readSiteData();
      return sendJson(res, 200, data.inquiries || []);
    }

    // Admin: update inquiry status or delete
    if (reqUrl.startsWith('/api/inquiries/') && (req.method === 'PUT' || req.method === 'DELETE')) {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const id = reqUrl.replace('/api/inquiries/', '').trim();
      const data = readSiteData();
      data.inquiries = data.inquiries || [];
      const index = data.inquiries.findIndex(i => i.id === id);

      if (index === -1) return sendJson(res, 404, { success: false, message: 'Inquiry not found' });

      if (req.method === 'DELETE') {
        const deleted = data.inquiries.splice(index, 1);
        writeSiteData(data);
        return sendJson(res, 200, { success: true, message: 'Inquiry deleted', inquiry: deleted[0] });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        data.inquiries[index] = { ...data.inquiries[index], ...body };
        writeSiteData(data);
        return sendJson(res, 200, { success: true, inquiry: data.inquiries[index] });
      }
    }

    // --- 12. IMAGE / ASSET UPLOAD ENDPOINT ---
    if (reqUrl === '/api/upload' && req.method === 'POST') {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      const body = await parseJsonBody(req);

      if (!body.data || !body.name) {
        return sendJson(res, 400, { success: false, message: 'Image data and name required' });
      }

      try {
        // Strip data:image/...;base64, header if present
        let base64Data = body.data;
        let ext = path.extname(body.name) || '.jpg';
        if (base64Data.includes(',')) {
          const parts = base64Data.split(',');
          base64Data = parts[1];
          const match = parts[0].match(/:(.*?);/);
          if (match && match[1]) {
            const mime = match[1];
            if (mime === 'image/png') ext = '.png';
            else if (mime === 'image/webp') ext = '.webp';
            else if (mime === 'image/svg+xml') ext = '.svg';
          }
        }

        const safeFilename = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
        const targetPath = path.join(UPLOADS_DIR, safeFilename);

        fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
        const publicUrl = 'assets/uploads/' + safeFilename;

        return sendJson(res, 200, {
          success: true,
          url: publicUrl,
          filename: safeFilename
        });
      } catch (err) {
        console.error('Upload error:', err);
        return sendJson(res, 500, { success: false, message: 'Failed to save uploaded file' });
      }
    }

    // --- 13. RESTORE DEFAULT DATA ---
    if (reqUrl === '/api/reset-data' && req.method === 'POST') {
      if (!isAuthenticated(req)) return sendJson(res, 401, { success: false, message: 'Unauthorized' });
      // Reset action
      return sendJson(res, 200, { success: true, message: 'Reset not required' });
    }

    // Fallthrough for unmatched /api
    return sendJson(res, 404, { success: false, message: 'API endpoint not found' });
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let reqPath = reqUrl;
  if (reqPath === '/' || reqPath === '') {
    reqPath = 'index.html';
  } else if (reqPath === '/admin' || reqPath === '/admin/') {
    reqPath = 'admin.html';
  }

  // Normalize path and remove leading slash
  if (reqPath.startsWith('/')) {
    reqPath = reqPath.substring(1);
  }

  let filePath = path.join(PUBLIC_DIR, reqPath);

  // Directory traversal defense
  const topLevel = path.relative(PUBLIC_DIR, filePath).split(path.sep)[0].toLowerCase();
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) || topLevel === path.basename(DATA_DIR)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Check if it was a directory with index.html
      if (!path.extname(filePath)) {
        const potentialIndex = path.join(filePath, 'index.html');
        if (fs.existsSync(potentialIndex)) {
          filePath = potentialIndex;
        } else if (fs.existsSync(filePath + '.html')) {
          filePath = filePath + '.html';
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Stratum Server running at http://localhost:${PORT}/`);
  console.log(`Admin Panel available at http://localhost:${PORT}/admin`);
});
