import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Contact ID is required.' });
    }

    try {
      await query('UPDATE contacts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      return res.status(200).json({ message: 'Contact soft deleted successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
