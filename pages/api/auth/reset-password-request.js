import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const secretKey = process.env.JWT_SECRET;

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'your_email@gmail.com', // Your email
    pass: 'your_email_password' // Your email password (use an app password if 2FA is enabled)
  }
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Create a password reset token
      const resetToken = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });
      const resetLink = `http://localhost:3000/api/auth/reset-password?token=${resetToken}`;

      // Send reset password email
      await transporter.sendMail({
        from: 'your_email@gmail.com',
        to: user.email,
        subject: 'Password Reset Request',
        html: `<h1>Password Reset</h1><p>Please click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`
      });

      return res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
