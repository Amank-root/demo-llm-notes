// Middleware to check for Admin role
import admin from "../config/firebase";
import { Request, Response, NextFunction } from 'express';


export const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const idToken = req.headers['authorization']?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    if (decodedToken.role === 'admin') {
      next();
    } else {
      res.status(403).send('Forbidden: Requires Admin role');
    }
  } catch (error) {
    res.status(401).send('Invalid Token');
  }
};

// Example of a protected route
// app.get('/admin-data', checkAdmin, (req, res) => {
//   res.send('This is sensitive admin data.');
// });