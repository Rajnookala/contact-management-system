import { query } from '../../../lib/db';
import { body, validationResult } from 'express-validator';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { id, name, email, phone, address, timezone } = req.body;

    await body('id').notEmpty().withMessage('Contact ID is required').run(req);
    await body('name').optional().notEmpty().withMessage('Name is required').run(req);
    await body('email').optional().isEmail().withMessage('Email is invalid').run(req);
    await body('phone').optional().isMobilePhone().withMessage('Phone number is invalid').run(req);
    await body('address').optional().notEmpty().withMessage('Address is required').run(req);
    await body('timezone').optional().notEmpty().withMessage('Timezone is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await query(
        'UPDATE contacts SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), address = COALESCE($4, address), timezone = COALESCE($5, timezone), updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7',
        [name, email, phone, address, timezone, id, req.user.id]
      );

      return res.status(200).json({ message: 'Contact updated successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
