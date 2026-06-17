import express from 'express';
import 'dotenv/config';

const PORT = process.env.PORT || 7000;
const server = express(); 

server.get('/', (req, res) =>{
  res.send('test');
})

server.listen(PORT, ()=>{
  console.log(`Server running on PORT: ${PORT}`); 
})