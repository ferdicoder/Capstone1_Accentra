import 'dotenv/config';
import express from 'express';
import cors from 'cors'

import { userRouter } from './routes/user.router.js';
import { serviceRouter } from './routes/service.router.js';
import templateRouter from './routes/templateDocument.router.js';
import engagementDocumentRouter from './routes/engagementDocument.router.js';

const PORT = process.env.PORT || 3000;
const server = express(); 

server.use(cors());
server.use(express.json());


async function startServer(){
  try{
    server.use('/api/v1/staffs', userRouter);
    server.use('/api/v1/services', serviceRouter);
    server.use('/api/v1/documents', templateRouter); 
    server.use('/api/v1/documents', engagementDocumentRouter);

    server.use((err, req, res, next) => {
      console.error(err);
      res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
    });

    server.listen(PORT, ()=>{
      console.log(`Server running on PORT: ${PORT}`); 
    }); 
  }catch(error){
    console.log(error); 
  }
}
startServer(); 