import { hash } from 'bcrypt';
import { query } from '../../../lib/db';
import { authRateLimiter } from '../../../lib/rateLimiter';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET;

export default authRateLimiter (async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
      // Hash the password
      const hashedPassword = await hash(password, 10);

      // Save user to database, handle unique email constraint
      const result = await query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, hashedPassword]
      );

      const user = result.rows[0];

      // Create JWT token
      const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });

      return res.status(201).json({ message: 'User registered successfully!', token });
    } catch (error) {
      // Check for unique email violation (PostgreSQL error code 23505)
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Email already exists.' });
      }

      // Catch any other errors
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
});
