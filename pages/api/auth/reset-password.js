import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { hash } from 'bcrypt';

const secretKey = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      const userId = decoded.id;

      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);

      // Update the user's password
      await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

      return res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
