import { generateLocalBotResponse } from './src/utils/botLogic.js';

async function fuzzTest() {
    // Let's try all combinations of lengths up to 12
    for (let len = 0; len <= 12; len++) {
        let history = [];
        for (let i = 0; i < len; i++) {
            history.push({ role: 'user', text: `Message ${i}` });
        }
        let response = await generateLocalBotResponse(history);
        if (response.message.includes("Invalid Age") && response.message.includes("Name")) {
            console.log("FOUND BUG AT LENGTH", len);
            console.log(response.message);
        }
    }
}
fuzzTest();
