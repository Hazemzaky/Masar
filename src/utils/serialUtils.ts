import { Model } from 'mongoose';

/**
 * Generate a serial number for a document.
 * @param docCode Document type code (e.g., IN, PO, SI, etc.)
 * @param department Department code (e.g., HS, PR, etc.)
 * @param model Mongoose model to count existing documents
 * @returns Serial number string
 */
export async function generateSerial(
  docCode: string,
  department: string,
  model: Model<any>
): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;
  const regex = new RegExp(`^${docCode}-${department}-${dateStr}-`);
  const count = await model.countDocuments({ serial: { $regex: regex } });
  const seq = String(count + 1).padStart(3, '0');
  return `${docCode}-${department}-${dateStr}-${seq}`;
} 