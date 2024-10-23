import { compare } from 'bcrypt';
import { query } from '../../../lib/db';
import { authRateLimiter } from '../../../lib/rateLimiter';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET;

export default authRateLimiter (async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      // Find user by email
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const user = result.rows[0];

      // Compare the provided password with the hashed password in the database
      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });

      return res.status(200).json({ message: 'Login successful!', token });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
});
