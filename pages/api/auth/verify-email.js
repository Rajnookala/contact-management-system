import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token is required.' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      const userId = decoded.id;

      // Update the user's email_verified status
      await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [userId]);

      return res.status(200).json({ message: 'Email verified successfully!' });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
