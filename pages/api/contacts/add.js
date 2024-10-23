import { query } from '../../../lib/db';
import { validationResult } from 'express-validator';
import { body } from 'express-validator';
import moment from 'moment-timezone';

export const validate = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('timezone').notEmpty().withMessage('Timezone is required')
];

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, name, email, phone, address, timezone } = req.body;

    try {
      // Get the current UTC time
      const createdAt = moment.utc().format();

      // Save the contact to the database
      const result = await query(
        `INSERT INTO contacts (user_id, name, email, phone, address, timezone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *`,
        [user_id, name, email, phone, address, timezone, createdAt]
      );

      const contact = result.rows[0];
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error adding contact:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
