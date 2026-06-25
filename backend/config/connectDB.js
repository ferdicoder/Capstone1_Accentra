import { Pool } from 'pg';
import 'dotenv/config';


// host: process.env.PGHOST,
//   port: process.env.PGPORT,
//   database: process.env.PGDATABASE,
//   password: process.env.PGPASSWORD,
//   ssl: { rejectUnauthorized: false }

const pool = new Pool({ connectionString: process.env.DATABASE_URI}); 
  
const connectDB = async () =>{
  const connect = await pool.query('SELECT NOW()');
  console.log(`Database Connected, ${connect.rows[0].now}`); 
}



export { 
  pool,
  connectDB
}