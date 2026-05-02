// Comprehensive standalone offline medical chatbot logic
export const generateLocalBotResponse = async (chatHistory) => {
    const userMessages = chatHistory.filter(m => m.role === 'user');
    
    let step = 0;
    let botFeedback = null;
    const firstUserMsg = userMessages.length > 0 ? userMessages[0].text.toLowerCase() : "";

    for (let i = 0; i < userMessages.length; i++) {
        const msg = userMessages[i].text.toLowerCase().trim();
        const isLastMsg = i === userMessages.length - 1;

        if (step < 9) {
            step++;
        } else if (step === 9) {
            if (msg && !msg.includes("prefer not") && !msg.includes("skip")) {
                step++;
            } else if (isLastMsg) {
                botFeedback = "Invalid Name. It cannot be skipped.";
            }
        } else if (step === 10) {
            if (msg && !msg.includes("prefer not") && !msg.includes("skip") && /\d/.test(msg)) {
                step++;
            } else if (isLastMsg) {
                botFeedback = "Invalid Age. Please provide an actual age (e.g. 25).";
            }
        } else if (step === 11) {
            if (msg && !msg.includes("prefer not") && !msg.includes("skip")) {
                step++;
            } else if (isLastMsg) {
                botFeedback = "Invalid Gender. It cannot be skipped.";
            }
        } else if (step === 12) {
            if (msg && !msg.includes("prefer not") && !msg.includes("skip") && !msg.includes("don't know")) {
                step++;
            } else if (isLastMsg) {
                botFeedback = "Invalid Blood Group. It cannot be skipped.";
            }
        } else if (step >= 13) {
            step++;
        }
    }

    
    let responseMsg = "Could you please describe your main medical problem or symptoms?";
    let quickReplies = ["I have a fever", "I am in pain", "Breathing issues", "Skin rash or allergy"];
    let conclusion = false;

    if (step === 1) {
        if (firstUserMsg.includes("fever") || firstUserMsg.includes("hot")) {
            responseMsg = "To better understand the fever, what is your highest recorded temperature today, and exactly how many days has it lasted?";
            quickReplies = ["100-101°F (1-2 days)", "Over 102°F (3+ days)", "I haven't measured it"];
        } else if (firstUserMsg.includes("pain") || firstUserMsg.includes("ache")) {
            responseMsg = "Pain can have many causes. Please describe the exact location, whether it is sharp or dull, and rate its severity from 1 (mild) to 10 (unbearable).";
            quickReplies = ["Head (Dull, 5/10)", "Stomach (Sharp, 8/10)", "Chest (Severe)"];
        } else if (firstUserMsg.includes("breathe") || firstUserMsg.includes("chest") || firstUserMsg.includes("asthma")) {
            responseMsg = "<strong>Priority:</strong> Breathing issues can be serious. Is the difficulty breathing constant, or does it happen only when you exert yourself? Do you feel any chest tightness?";
            quickReplies = ["Constant tightness", "Only when moving", "I have a history of asthma"];
        } else if (firstUserMsg.includes("skin") || firstUserMsg.includes("rash") || firstUserMsg.includes("itch")) {
            responseMsg = "For skin issues, is the rash spreading, oozing, or extremely itchy? Have you recently changed soaps, detergents, or eaten anything unusual?";
            quickReplies = ["Yes, it's spreading and itchy", "No, just a small spot", "I ate something new"];
        } else {
            responseMsg = "I understand. Could you describe how exactly this problem started? Was it sudden, or has it been getting worse gradually over time?";
            quickReplies = ["It started very suddenly", "It has been getting worse for weeks"];
        }
    } else if (step === 2) {
        if (firstUserMsg.includes("fever") || firstUserMsg.includes("hot")) {
            responseMsg = "Are you experiencing any associated symptoms like severe chills, sweating, persistent cough, or body aches?";
            quickReplies = ["Yes, chills and body ache", "Dry cough", "No other symptoms"];
        } else if (firstUserMsg.includes("pain") || firstUserMsg.includes("ache")) {
            responseMsg = "Does the pain radiate to any other part of your body? For example, does chest pain travel to your arm, or back pain travel down your leg?";
            quickReplies = ["Yes, it radiates", "No, it stays in one spot"];
        } else {
            responseMsg = "Are you experiencing any other generalized symptoms like unusual fatigue, dizziness, nausea, or loss of appetite?";
            quickReplies = ["Dizziness and fatigue", "Nausea", "None of these"];
        }
    } else if (step === 3) {
        responseMsg = "<strong>Required Medical History:</strong> Do you have any pre-existing medical conditions that the doctor should know about? (e.g., Diabetes, Hypertension, Thyroid issues, Heart disease)";
        quickReplies = ["No pre-existing conditions", "Diabetes", "High Blood Pressure", "Asthma / Heart condition"];
    } else if (step === 4) {
        responseMsg = "Have you had any major surgeries in the past, or have you been admitted to the hospital for any reason in the last 12 months?";
        quickReplies = ["No prior surgeries or admissions", "Yes, a surgery in the past", "Admitted recently"];
    } else if (step === 5) {
        responseMsg = "<strong>Required Safety Check:</strong> Do you have any known allergies to specific medications (like Penicillin), foods, or environmental factors (like dust or pollen)?";
        quickReplies = ["No known allergies", "Allergic to Penicillin / antibiotics", "Food/Dust allergy"];
    } else if (step === 6) {
        responseMsg = "<strong>Medication History:</strong> Are you currently taking any daily prescription medications? Also, have you taken any over-the-counter drugs (like Paracetamol or Ibuprofen) today for your current symptoms?";
        quickReplies = ["No medications at all", "Only daily prescriptions", "Took painkillers today"];
    } else if (step === 7) {
        responseMsg = "Almost done. Do you happen to know your current Blood Pressure?";
        quickReplies = ["Normal (120/80)", "High", "Low", "I don't know"];
    } else if (step === 8) {
        responseMsg = "What is your current Oxygen (SpO2) level? Also, do you smoke or consume alcohol regularly?";
        quickReplies = ["Normal (95-100%), no smoking/alcohol", "Normal, but I smoke/drink", "I don't know"];
    } else if (step === 9) {
        responseMsg = "To complete your triage report, please provide the patient's Name.";
        if (botFeedback) responseMsg = `<strong>${botFeedback}</strong><br><br>${responseMsg}`;
        quickReplies = ["John Doe", "Jane Doe"];
    } else if (step === 10) {
        responseMsg = "Please provide the patient's Age.";
        if (botFeedback) responseMsg = `<strong>${botFeedback}</strong><br><br>${responseMsg}`;
        quickReplies = ["18-30", "31-50", "51+"];
    } else if (step === 11) {
        responseMsg = "Please provide the patient's Gender.";
        if (botFeedback) responseMsg = `<strong>${botFeedback}</strong><br><br>${responseMsg}`;
        quickReplies = ["Male", "Female", "Other"];
    } else if (step === 12) {
        responseMsg = "Please provide the patient's Blood Group.";
        if (botFeedback) responseMsg = `<strong>${botFeedback}</strong><br><br>${responseMsg}`;
        quickReplies = ["A+", "O+", "B+", "AB+"];
    } else if (step >= 13) {
        responseMsg = "Thank you for providing this comprehensive information. <br><br><strong>Triage Summary Generated:</strong><br>- Symptoms & Severity noted.<br>- Medical & Surgical history recorded.<br>- Allergies and Medications logged.<br>- Patient Demographics saved.<br><br>All details have been securely prepared for the doctor to review before your treatment. Please proceed to the clinic desk or wait for your consultation.";
        quickReplies = [];
        conclusion = true;
    }

    // Simulate network delay for natural feel
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                message: responseMsg,
                quick_replies: quickReplies,
                conclusion_reached: conclusion
            });
        }, 800);
    });
};
