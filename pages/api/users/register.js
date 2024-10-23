// pages/api/users/register.js
import query from '../../../lib/db';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;

        // Validate request body
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        try {
            // Check if the user already exists
            const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(409).json({ message: 'User already exists' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert user into the database
            const result = await query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *', [email, hashedPassword]);

            const newUser = result.rows[0];
            return res.status(201).json({ message: 'User registered successfully', user: newUser });
        } catch (error) {
            console.error('Error occurred during user registration:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
