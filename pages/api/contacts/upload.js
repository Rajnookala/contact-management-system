import multer from 'multer';
import { query } from '../../../lib/db';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

export const config = {
  api: {
    bodyParser: false, // Disallow Next.js parsing of the request body
  },
};

const uploadHandler = upload.single('file');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    uploadHandler(req, res, async (err) => {
      if (err) return res.status(500).json({ message: 'File upload failed.' });

      const filePath = req.file.path;

      // Determine file type and parse accordingly
      const fileType = req.file.mimetype;
      const contacts = [];

      try {
        if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          // For Excel files
          const workbook = xlsx.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = xlsx.utils.sheet_to_json(sheet);

          data.forEach(contact => {
            contacts.push({
              name: contact.Name,
              email: contact.Email,
              phone: contact.Phone,
              address: contact.Address,
              timezone: contact.Timezone,
            });
          });
        } else if (fileType === 'text/csv') {
          // For CSV files
          fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
              contacts.push(row);
            })
            .on('end', async () => {
              await Promise.all(contacts.map(contact =>
                query('INSERT INTO contacts (user_id, name, email, phone, address, timezone) VALUES ($1, $2, $3, $4, $5, $6)', [req.user.id, contact.name, contact.email, contact.phone, contact.address, contact.timezone])
              ));
              return res.status(200).json({ message: 'Contacts uploaded successfully!' });
            });
        } else {
          return res.status(400).json({ message: 'Unsupported file type.' });
        }
      } catch (error) {
        return res.status(500).json({ message: 'Error processing file.' });
      } finally {
        fs.unlinkSync(filePath); // Clean up the uploaded file
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
