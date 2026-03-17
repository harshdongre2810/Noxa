import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';

const PORT = 3000;

// Initialize SQLite Database
const db = new Database('noxa.db');

// Database Migrations
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      public_key TEXT,
      recovery_hash TEXT,
      display_name TEXT,
      avatar_url TEXT,
      noxa_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_by TEXT,
      created_at INTEGER,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT,
      user_id TEXT,
      joined_at INTEGER,
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS pending_messages (
      id TEXT PRIMARY KEY,
      recipient_id TEXT,
      sender_id TEXT,
      data TEXT,
      timestamp INTEGER,
      expire_at INTEGER,
      is_view_once INTEGER DEFAULT 0,
      is_secret_chat INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      encrypted_file_url TEXT,
      encryption_key TEXT,
      uploaded_by TEXT,
      uploaded_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      message TEXT,
      ai_response TEXT,
      timestamp INTEGER
    );
  `);

  // Check if columns exist, if not add them (for existing databases)
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const columns = tableInfo.map(c => c.name);
  
  if (!columns.includes('display_name')) {
    db.exec("ALTER TABLE users ADD COLUMN display_name TEXT;");
    console.log("Added display_name column to users table");
  }
  if (!columns.includes('avatar_url')) {
    db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT;");
    console.log("Added avatar_url column to users table");
  }
  if (!columns.includes('noxa_id')) {
    db.exec("ALTER TABLE users ADD COLUMN noxa_id TEXT;");
    console.log("Added noxa_id column to users table");
  }

  // Migration for pending_messages
  const pendingMessagesInfo = db.prepare("PRAGMA table_info(pending_messages)").all() as any[];
  const pmColumns = pendingMessagesInfo.map(c => c.name);
  
  if (!pmColumns.includes('expire_at')) {
    db.exec("ALTER TABLE pending_messages ADD COLUMN expire_at INTEGER;");
    console.log("Added expire_at column to pending_messages table");
  }
  if (!pmColumns.includes('is_view_once')) {
    db.exec("ALTER TABLE pending_messages ADD COLUMN is_view_once INTEGER DEFAULT 0;");
    console.log("Added is_view_once column to pending_messages table");
  }
  if (!pmColumns.includes('is_secret_chat')) {
    db.exec("ALTER TABLE pending_messages ADD COLUMN is_secret_chat INTEGER DEFAULT 0;");
    console.log("Added is_secret_chat column to pending_messages table");
  }
} catch (error) {
  console.error('Database initialization error:', error);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.use(express.json());

  // AI Protection: Rate limiting and spam detection
  const messageRates = new Map<string, { count: number, lastTime: number }>();
  const SPAM_THRESHOLD = 15; // messages
  const SPAM_WINDOW = 10000; // 10 seconds

  const spamGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { senderId, text } = req.body;
    if (!senderId || !text) return next();

    const now = Date.now();
    const stats = messageRates.get(senderId) || { count: 0, lastTime: now };

    if (now - stats.lastTime < SPAM_WINDOW) {
      stats.count++;
    } else {
      stats.count = 1;
      stats.lastTime = now;
    }
    messageRates.set(senderId, stats);

    if (stats.count > SPAM_THRESHOLD) {
      return res.status(429).json({ error: 'Abnormal activity detected. Account flagged for review.' });
    }

    // Simple link detection for spam
    const linkPattern = /https?:\/\/[^\s]+/g;
    const links = text.match(linkPattern);
    if (links && links.length > 3) {
      return res.status(400).json({ error: 'Message contains too many links and was flagged as spam.' });
    }

    next();
  };

  app.get('/api/users/:username/key', (req, res) => {
    try {
      const { username } = req.params;
      const user = db.prepare('SELECT public_key FROM users WHERE LOWER(username) = LOWER(?)').get(username) as any;
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ publicKey: user.public_key });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch public key' });
    }
  });
  app.post('/api/register', async (req, res) => {
    try {
      const { username, password, publicKey, recoveryKey } = req.body;
      if (!username || !password || !publicKey || !recoveryKey) {
        return res.status(400).json({ error: 'Please fill in all required fields to create your identity.' });
      }

      // Case-insensitive uniqueness check
      const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username);
      if (existingUser) {
        return res.status(409).json({ error: 'This username is already taken. Please choose another one.' });
      }

      const id = crypto.randomUUID();
      const noxaId = `@${username.toLowerCase()}`;
      const passwordHash = await bcrypt.hash(password, 10);
      const recoveryHash = await bcrypt.hash(recoveryKey, 10);

      db.prepare('INSERT INTO users (id, username, password_hash, public_key, recovery_hash, display_name, noxa_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, username, passwordHash, publicKey, recoveryHash, username, noxaId);

      res.json({ success: true, id, username, publicKey, displayName: username, avatarUrl: null, noxaId });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password. Please check your credentials and try again.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password. Please check your credentials and try again.' });
      }

      res.json({ 
        success: true, 
        id: user.id, 
        username: user.username, 
        publicKey: user.public_key,
        displayName: user.display_name || user.username,
        avatarUrl: user.avatar_url,
        noxaId: user.noxa_id
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Something went wrong on our end. Please try again in a moment.' });
    }
  });

  app.get('/api/groups/:id', (req, res) => {
    try {
      const { id } = req.params;
      const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as any;
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      const members = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(id) as any[];
      res.json({
        ...group,
        members: members.map(m => m.user_id)
      });
    } catch (error) {
      console.error('Fetch group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users/check', (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        return res.json({ available: false });
      }
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      res.json({ available: !user });
    } catch (error) {
      console.error('Check username error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users/search', (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      const users = db.prepare('SELECT id, username, public_key, display_name, avatar_url FROM users WHERE username LIKE ? OR display_name LIKE ? LIMIT 20')
        .all(`%${q}%`, `%${q}%`);
      res.json(users.map((u: any) => ({
        ...u,
        displayName: u.display_name || u.username,
        avatarUrl: u.avatar_url
      })));
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users/by-username/:username', (req, res) => {
    try {
      const { username } = req.params;
      const user = db.prepare('SELECT id, username, public_key, display_name, avatar_url FROM users WHERE username = ?').get(username) as any;
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        ...user,
        displayName: user.display_name || user.username,
        avatarUrl: user.avatar_url
      });
    } catch (error) {
      console.error('Fetch user by username error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const user = db.prepare('SELECT id, username, public_key, display_name, avatar_url FROM users WHERE id = ?').get(id) as any;
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        ...user,
        displayName: user.display_name || user.username,
        avatarUrl: user.avatar_url
      });
    } catch (error) {
      console.error('Fetch user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/profile/update', (req, res) => {
    try {
      const { id, displayName, avatarUrl, noxaId } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing user ID' });

      db.prepare('UPDATE users SET display_name = ?, avatar_url = ?, noxa_id = ? WHERE id = ?')
        .run(displayName, avatarUrl, noxaId, id);

      res.json({ success: true });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/account/delete', async (req, res) => {
    try {
      const { id, password } = req.body;
      if (!id || !password) return res.status(400).json({ error: 'Missing required fields' });

      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid password' });

      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      db.prepare('DELETE FROM group_members WHERE user_id = ?').run(id);
      // We could also delete groups if they have no members left, but let's keep it simple
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/account/change-password', async (req, res) => {
    try {
      const { id, currentPassword, newPassword } = req.body;
      if (!id || !currentPassword || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });

      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid current password' });

      const newHash = await bcrypt.hash(newPassword, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id);

      res.json({ success: true });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/groups/create', (req, res) => {
    try {
      const { name, createdBy, members, avatarUrl } = req.body;
      if (!name || !createdBy || !members) return res.status(400).json({ error: 'Missing required fields' });

      const id = crypto.randomUUID();
      const createdAt = Date.now();

      const insertGroup = db.prepare('INSERT INTO groups (id, name, created_by, created_at, avatar_url) VALUES (?, ?, ?, ?, ?)');
      const insertMember = db.prepare('INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)');

      const transaction = db.transaction(() => {
        insertGroup.run(id, name, createdBy, createdAt, avatarUrl);
        // Add creator
        insertMember.run(id, createdBy, createdAt);
        // Add other members
        for (const memberId of members) {
          if (memberId !== createdBy) {
            insertMember.run(id, memberId, createdAt);
          }
        }
      });

      transaction();
      res.json({ success: true, id, name, createdAt });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users/:id/groups', (req, res) => {
    try {
      const { id } = req.params;
      const groups = db.prepare(`
        SELECT g.* FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
      `).all(id);
      res.json(groups);
    } catch (error) {
      console.error('Fetch user groups error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Assistant API (Storage only)
  app.post('/api/ai/save', async (req, res) => {
    try {
      const { userId, message, aiResponse } = req.body;
      db.prepare('INSERT INTO ai_conversations (id, user_id, message, ai_response, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(crypto.randomUUID(), userId, message, aiResponse, Date.now());
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/ai/history/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const history = db.prepare('SELECT message, ai_response, timestamp FROM ai_conversations WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20').all(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // File Upload
  const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

  app.post('/api/upload', upload.single('file'), (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      
      const fileId = crypto.randomUUID();
      // In a real app, we'd save to S3 or a dedicated file store.
      // For this demo, we'll store in memory or a temp folder.
      // But since we want to be "production-ready", let's use a simple buffer strategy.
      // We'll return a data URI or a temporary link.
      // For simplicity in this environment, we'll return the base64 data.
      const base64 = req.file.buffer.toString('base64');
      res.json({ 
        success: true, 
        fileId, 
        url: `data:${req.file.mimetype};base64,${base64}` 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Socket.io for real-time signaling and messaging
  const connectedUsers = new Map<string, string>(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', (userId: string) => {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} registered socket ${socket.id}`);
      io.emit('user_status', { userId, status: 'online' });

      // Deliver pending messages
      try {
        const pending = db.prepare('SELECT * FROM pending_messages WHERE recipient_id = ? ORDER BY timestamp ASC').all(userId) as any[];
        for (const msg of pending) {
          socket.emit('message', JSON.parse(msg.data));
          db.prepare('DELETE FROM pending_messages WHERE id = ?').run(msg.id);
        }
      } catch (error) {
        console.error('Pending messages delivery error:', error);
      }
    });

    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(connectedUsers.keys()));
    });

    socket.on('message', (data) => {
      // data: { id: string, to: string, from: string, text: string, timestamp: number, isViewOnce?: boolean, isSecretChat?: boolean, selfDestructTimer?: number, expiresAt?: number }
      
      const messageData = {
        ...data,
        expireAt: data.expireAt || data.expiresAt || (data.isSecretChat ? null : Date.now() + 24 * 60 * 60 * 1000)
      };

      if (data.isSecretChat) {
        // Secret chats are NOT stored on server even if recipient is offline
        // They are only delivered if recipient is online
        const recipientSocketId = connectedUsers.get(data.to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message', messageData);
        }
        return;
      }

      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message', messageData);
      } else {
        // Queue message for offline user
        try {
          const pendingId = data.id || crypto.randomUUID();
          db.prepare('INSERT INTO pending_messages (id, recipient_id, sender_id, data, timestamp, expire_at, is_view_once, is_secret_chat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(pendingId, data.to, data.from, JSON.stringify(messageData), Date.now(), messageData.expireAt, data.isViewOnce ? 1 : 0, 0);
        } catch (error) {
          console.error('Offline queuing error:', error);
        }
      }
    });

    socket.on('viewed', (data) => {
      // data: { id: string, from: string, to: string, isViewOnce?: boolean }
      const recipientSocketId = connectedUsers.get(data.from);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('viewed', data);
      }
      
      if (data.isViewOnce) {
        // Delete from database if it was a pending message
        try {
          db.prepare('DELETE FROM pending_messages WHERE id = ?').run(data.id);
          console.log(`View-once message ${data.id} deleted from server.`);
        } catch (error) {
          console.error('Error deleting view-once message:', error);
        }
      }
    });

    socket.on('screenshot', (data) => {
      // data: { from: string, to: string }
      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('screenshot_alert', { from: data.from });
      }
    });

    socket.on('typing', (data) => {
      if (data.isGroup) {
        const members = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(data.to) as any[];
        for (const member of members) {
          if (member.user_id !== data.from) {
            const recipientSocketId = connectedUsers.get(member.user_id);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('typing', { from: data.from, to: data.to, isGroup: true });
            }
          }
        }
      } else {
        const recipientSocketId = connectedUsers.get(data.to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('typing', { from: data.from });
        }
      }
    });

    socket.on('read', (data) => {
      if (data.isGroup) {
        const members = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(data.to) as any[];
        for (const member of members) {
          if (member.user_id !== data.from) {
            const recipientSocketId = connectedUsers.get(member.user_id);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('read', { from: data.from, to: data.to, isGroup: true });
            }
          }
        }
      } else {
        const recipientSocketId = connectedUsers.get(data.to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('read', { from: data.from });
        }
      }
    });

    socket.on('delivered', (data) => {
      if (data.isGroup) {
        const members = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(data.to) as any[];
        for (const member of members) {
          if (member.user_id !== data.from) {
            const recipientSocketId = connectedUsers.get(member.user_id);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('delivered', { from: data.from, to: data.to, isGroup: true });
            }
          }
        }
      } else {
        const recipientSocketId = connectedUsers.get(data.to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('delivered', { from: data.from });
        }
      }
    });

    socket.on('call:offer', (data) => {
      // data: { to: string, from: string, offer: RTCSessionDescriptionInit, callType: 'voice' | 'video' }
      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:offer', data);
      }
    });

    socket.on('call:answer', (data) => {
      // data: { to: string, from: string, answer: RTCSessionDescriptionInit }
      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:answer', data);
      }
    });

    socket.on('call:busy', (data) => {
      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:busy', data);
      }
    });

    socket.on('call:rejected', (data) => {
      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:rejected', data);
      }
    });

    socket.on('call:ice-candidate', (data) => {
      // data: { to: string, from: string, candidate: RTCIceCandidateInit }
      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:ice-candidate', data);
      }
    });

    socket.on('call:end', (data) => {
      // data: { to: string, from: string }
      const recipientSocketId = connectedUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:end', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      let disconnectedUserId: string | null = null;
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          connectedUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit('user_status', { userId: disconnectedUserId, status: 'offline' });
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  // Cleanup job for expired messages (every minute)
  setInterval(() => {
    try {
      const now = Date.now();
      const result = db.prepare('DELETE FROM pending_messages WHERE expire_at IS NOT NULL AND expire_at < ?').run(now);
      if (result.changes > 0) {
        console.log(`Cleaned up ${result.changes} expired messages`);
      }
    } catch (error) {
      console.error('Cleanup job error:', error);
    }
  }, 60000);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
