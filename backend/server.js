import 'dotenv/config';
import express from 'express';
import cors from 'cors'
import { connectDB } from './config/connectDB.js';
import apiMock from './routes/api.mock.js';

const PORT = process.env.PORT;
const server = express(); 

server.use(cors());
server.use(express.json());

server.get('/', (req, res) =>{
  res.send('test');
})

async function startServer(){
  try{
    await connectDB(); 
    server.use('/mock', apiMock);
    server.listen(PORT, ()=>{
      console.log(`Server running on PORT: ${PORT}`); 
    }); 

     
  }catch(error){
    console.log(error); 
  }
}
startServer(); 