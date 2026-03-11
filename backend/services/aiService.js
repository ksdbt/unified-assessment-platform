const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const generateWithGeminiRaw = async (prompt, isJson = true, customApiKey = null) => {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

    // 2026-era model identifiers
    const variations = [
        { ver: 'v1beta', model: 'gemini-3.1-flash-lite-preview' },
        { ver: 'v1beta', model: 'gemini-3.1-flash-preview' },
        { ver: 'v1', model: 'gemini-2.5-flash' },
        { ver: 'v1beta', model: 'gemini-1.5-flash' }
    ];

    let lastError = null;

    for (const v of variations) {
        try {
            const url = `https://generativelanguage.googleapis.com/${v.ver}/models/${v.model}:generateContent?key=${apiKey}`;

            const body = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9, // Higher temp for more variety/creativity
                    topP: 0.95,
                    topK: 40
                }
            };

            if (isJson) {
                body.generationConfig.responseMimeType = "application/json";
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data.error ? data.error.message : response.statusText;
                throw new Error(`[${response.status}] ${msg}`);
            }

            if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) {
                throw new Error("Invalid response format");
            }

            let text = data.candidates[0].content.parts[0].text;

            if (isJson) {
                text = text.replace(/```json\n?|```/g, '').trim();
            }

            console.log(`[AI-Service] SUCCESS with ${v.model} (${v.ver})`);
            return text;
        } catch (error) {
            console.warn(`[AI-Service] ${v.model} failed: ${error.message}`);
            lastError = error;
            // Immediate stop for key issues
            if (error.message.includes('401') || error.message.includes('key')) break;
        }
    }
    throw lastError;
};
exports.generateQuestions = async (topic, difficulty, count = 5, type = 'mcq', title = '', description = '', customApiKey = null) => {
    // Subject-Aware Role Selection
    const isTech = /computer|programming|coding|software|data|python|java|react|js|node|javascript/i.test(topic + title);
    const role = isTech ? 'Computer Science Academic Lead' : 'Professional Academic Examiner';
    const persona = topic.toLowerCase().includes('english') ? 'English Language & Linguistics Professor' : role;

    const typePrompt = type === 'coding'
        ? `Generate ${count} coding challenges. JSON structure: { questions: [{question, initialCode, points, difficulty, type: "coding", testCases: [{input, expectedOutput}]}] }`
        : `Generate ${count} MCQs. JSON structure: { questions: [{question, options: [string, string, string, string], correctAnswer, points, difficulty, type: "mcq"}] }`;

    const techWarning = !isTech && type === 'coding' ? " WARNING: The subject is non-technical. Only generate coding challenges if they represent a logical way to test this subject (e.g., text processing in English). Otherwise, focus on the subject's core concepts." : '';
    const context = title ? ` The assessment is titled "${title}" and described as "${description}".` : '';

    // Diversity/Variability Seed
    const seed = Date.now();
    const diversityStr = ` Ensure the questions are highly varied, creative, and NOT generic. Use diverse examples and scenarios. Random Seed: ${seed}.`;

    const prompt = `Role: ${persona}. Topic: ${topic}.${context} Difficulty: ${difficulty}. ${typePrompt}.${techWarning}${diversityStr} Ensure 'points' is an integer. Ensure 'difficulty' is one of: beginner, intermediate, advanced. Ensure each question has a 'type' field matching the requested type. Return ONLY valid JSON.`;

    try {
        const text = await generateWithGeminiRaw(prompt, true, customApiKey);
        const data = JSON.parse(text);
        return data.questions || (Array.isArray(data) ? data : []);
    } catch (error) {
        console.error('[AI-Service] generateQuestions:', error.message);
        throw new Error(`AI Generation failed: ${error.message}`);
    }
};

exports.evaluateResponse = async (question, studentAnswer, type = 'long_answer', maxPoints = 10, customApiKey = null) => {
    const prompt = `Question: "${question}". Student: "${studentAnswer}". Type: ${type}. Max Points: ${maxPoints}. Return JSON: {points, feedback, isCorrect}. Seed: ${Date.now()}`;
    try {
        const text = await generateWithGeminiRaw(prompt, true, customApiKey);
        return JSON.parse(text);
    } catch (error) {
        console.error('[AI-Service] evaluateResponse:', error.message);
        return { points: 0, feedback: "AI evaluation unavailable.", isCorrect: false };
    }
};

exports.generateExplanation = async (question, correctAnswer, customApiKey = null) => {
    const prompt = `Explain why "${correctAnswer}" is correct for "${question}". Max 2 sentences. Seed: ${Date.now()}`;
    try {
        return await generateWithGeminiRaw(prompt, false, customApiKey);
    } catch (error) {
        console.error('[AI-Service] generateExplanation:', error.message);
        return "Explanation unavailable.";
    }
};

exports.suggestMetadata = async (topic, customApiKey = null) => {
    const diversityStr = " Suggest a uniquely named, catchy Title (avoid names like 'CS Mastery' or generic 'Subject X Quiz') and a professional Description (max 150 chars). Be creative yet academic.";
    const prompt = `${diversityStr} about "${topic}". Respond in JSON: {title, description}. Randomness context: ${Date.now()}`;
    try {
        const text = await generateWithGeminiRaw(prompt, true, customApiKey);
        const data = JSON.parse(text);
        return {
            title: data.title || `Assessment: ${topic}`,
            description: data.description || `A comprehensive test on ${topic}.`
        };
    } catch (error) {
        console.error('[AI-Service] suggestMetadata:', error.message);
        return { title: `Assessment: ${topic}`, description: `A comprehensive test on ${topic}.` };
    }
};
