import 'dotenv/config';
import express from 'express';
import cors from 'cors'
import { connectDB } from './config/connectDB.js';

const PORT = process.env.PORT;
const server = express(); 

server.use(cors());
server.use(express.json());


async function startServer(){
  try{

    // catch all 
    server.all('/api/v1/*', (req, res) => {
      res.status(404).json({
        status: 'fail',
        message: `API endpoint ${req.originalUrl} does not exist.`
      });
    });

    await connectDB(); 
    server.listen(PORT, ()=>{
      console.log(`Server running on PORT: ${PORT}`); 
    }); 
  }catch(error){
    console.log(error); 
  }
}
startServer(); 