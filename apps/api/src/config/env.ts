import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

export const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
};
