import { Pool } from 'pg';
import 'dotenv/config';



const pool = new Pool({ 
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
 }); 
  
const connectDB = async () =>{
  console.log(`Database Connected, running on PORT: ${process.env.PGPORT}`); 
}



export { 
  pool,
  connectDB
}