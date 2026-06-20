import 'dotenv/config';

import express from 'express';
import { connectDB } from './config/connectDB.js';

const PORT = process.env.PORT;
const server = express(); 

server.get('/', (req, res) =>{
  res.send('test');
})

async function startServer(){
  try{
    await connectDB(); 
    server.listen(PORT, ()=>{
      console.log(`Server running on PORT: ${PORT}`); 
    }); 
  }catch(error){
    console.log(error); 
  }
}
startServer(); 