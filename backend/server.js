import 'dotenv/config';
import express from 'express';
import cors from 'cors'

import { userRouter } from './routes/userRouter.js';

const PORT = process.env.PORT;
const server = express(); 

server.use(cors());
server.use(express.json());


async function startServer(){
  try{
    server.use('/api/v1/users', userRouter);

    // // catch all 
    // server.all('/api/v1/*splat', (req, res) => {
    //   res.status(404).json({
    //     status: 'fail',
    //     message: `API endpoint ${req.originalUrl} does not exist.`
    //   });
    // });

    server.listen(PORT, ()=>{
      console.log(`Server running on PORT: ${PORT}`); 
    }); 
  }catch(error){
    console.log(error); 
  }
}
startServer(); 