const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.warn('Firebase Admin initialization skipped or failed:', error.message);
  }
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Authentication Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token', error);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running securely!' });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    // In a production app with a DB, we would fetch the user from Firestore here
    // e.g., const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    // For now, we will default to the email domain logic or standard "user" role.
    
    let role = 'user';
    // Simple logic: if email contains 'admin', make them an admin.
    if (req.user.email && req.user.email.includes('admin')) {
      role = 'admin';
    } else if (req.user.email && req.user.email.includes('teacher')) {
      role = 'teacher';
    }

    res.json({
      message: 'Authentication successful',
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        role: role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error fetching user data' });
  }
});

// Admin-only Route Example
router.post('/admin/data', authenticate, (req, res) => {
  // Add role check if needed
  res.json({
    message: 'Admin data processed successfully',
    receivedData: req.body
  });
});

// Mount the router on the /api path so that it maps cleanly when accessed via /.netlify/functions/api or /api
app.use('/api', router);

module.exports.handler = serverless(app);
