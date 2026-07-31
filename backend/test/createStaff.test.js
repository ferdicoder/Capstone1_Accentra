import { createStaff } from "../../../backend/services/authService.js";

async function testCreateStaff(){
  console.log('Invitation Staff testing...')
  const result = await createStaff(
    "cedrickced820@gmail.com", 
    "samplepass123", 
    { 
      email: "cedrickced820@gmail.com",
      first_name: "ced", 
      last_name: "gelito"
    }
  )
}
testCreateStaff(); 