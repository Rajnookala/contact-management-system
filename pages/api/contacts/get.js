import { query } from '../../../lib/db';
import moment from 'moment-timezone';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { user_id, start_date, end_date, timezone } = req.query;

    try {
      // Retrieve contacts created within a specific date range
      let contactsQuery = `SELECT * FROM contacts WHERE user_id = $1`;
      const queryParams = [user_id];

      if (start_date && end_date) {
        contactsQuery += ` AND created_at BETWEEN $2 AND $3`;
        queryParams.push(start_date, end_date);
      }

      const result = await query(contactsQuery, queryParams);

      let contacts = result.rows;

      // Convert timestamps to the user's timezone
      if (timezone) {
        contacts = contacts.map(contact => {
          contact.created_at = moment(contact.created_at).tz(timezone).format();
          contact.updated_at = moment(contact.updated_at).tz(timezone).format();
          return contact;
        });
      }

      res.status(200).json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

