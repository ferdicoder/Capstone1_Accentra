import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URI}); 
  
const connectDB = async () =>{
  const connect = await pool.query('SELECT NOW()');
  console.log(`Database Connected, ${connect.rows[0].now}`); 
}



export { 
  pool,
  connectDB
}