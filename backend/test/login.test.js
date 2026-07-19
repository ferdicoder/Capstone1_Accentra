import { signinClient } from '../services/authService.js'; 

async function testLogin(){
  console.log('testing login...'); 
  
  const result = await signinClient('jhanleurbalberan36@gmail.com', 'securepassword123'); 
  
  console.log('Result:', result); 
}

testLogin(); 