import query from '../../../lib/db'; // Ensure this import is correct
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    keyGenerator: (req) => req.ip, // Use req.ip for identifying the IP address
});

// Define the login handler
export default async function handler(req, res) {
    // Check if the request method is POST
    if (req.method === 'POST') {
        // Apply rate limit
        await limiter(req, res, async () => {
            const { email, password } = req.body; // Extract email and password from request body
            try {
                // Fetch user from the database
                const result = await query('SELECT * FROM users WHERE email = $1', [email]);
                const user = result.rows[0]; // Get the user object

                // Check if user exists and password matches
                if (user && (await bcrypt.compare(password, user.password))) {
                    // Password is correct, generate token
                    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
                    return res.status(200).json({ token }); // Respond with the token
                } else {
                    return res.status(401).json({ message: 'Invalid credentials' }); // Invalid credentials response
                }
            } catch (error) {
                console.error('Error during login:', error);
                return res.status(500).json({ message: 'Internal server error' }); // Handle internal server error
            }
        });
    } else {
        // If the request method is not POST
        res.setHeader('Allow', ['POST']); // Set allowed methods
        res.status(405).end(`Method ${req.method} Not Allowed`); // Method not allowed response
    }
}
