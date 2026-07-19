import { signinClient } from '../services/authService.js'; 

async function testLogin(){
  console.log('testing login...'); 
  
  const result = await signinClient('jhanleurbalberan36@gmail.com', 'securepassword123'); 
  // const result = await signinClient('cedrickced820@gmail.com', 'samplepass123'); 

  console.log('Result:', result); 
}

testLogin(); 