import 'dotenv/config';
import express from 'express';
import cors from 'cors'

import { userRouter } from './routes/user.router.js';

const PORT = process.env.PORT;
const server = express(); 

server.use(cors());
server.use(express.json());


async function startServer(){
  try{
    server.use('/api/v1/staffs', userRouter);


    server.listen(PORT, ()=>{
      console.log(`Server running on PORT: ${PORT}`); 
    }); 
  }catch(error){
    console.log(error); 
  }
}
startServer(); 