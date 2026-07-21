import { registerClient } from "../services/authService.js";

async function testRegister(){
  console.log("Starting registration test...");
  
  const result = await registerClient(
    "jhanleurbalberan36@gmail.com", 
    "securepassword123", 
    { 
      email: "jhanleurbalberan36@gmail.com",
      first_name: "Jhan", 
      last_name: "Leur"
    }
  );

  console.log("Result:", result);
}

testRegister(); 