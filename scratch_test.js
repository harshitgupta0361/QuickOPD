import { generateLocalBotResponse } from './src/utils/botLogic.js';

async function test() {
    let history = [];
    // User sends 9 messages to reach step 9
    for (let i = 0; i < 9; i++) {
        history.push({ role: 'user', text: `Message ${i}` });
    }
    
    let response = await generateLocalBotResponse(history);
    console.log("Step 9 Response:", response.message);
    
    // User replies with Name
    history.push({ role: 'user', text: "John" });
    response = await generateLocalBotResponse(history);
    console.log("Step 10 Response:", response.message);
}

test();
