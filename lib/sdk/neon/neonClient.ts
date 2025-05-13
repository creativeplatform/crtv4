"use server";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    "DATABASE_URL is not set. Please define it in your .env.local file."
  );
const sql = neon(databaseUrl);

export default sql;
