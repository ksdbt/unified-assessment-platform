const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AQI Engine (Automated Question Inspector)
 * Pedagogical Integrity Audit
 * 
 * Uses LLM to audit question quality, bias, and technical accuracy.
 */
class AQIEngine {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (this.apiKey) {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
        }
    }

    /**
     * Inspects a single question or a set of questions for quality.
     */
    async inspectQuestions(questions, subject = 'General') {
        if (!this.genAI) return { score: 100, feedback: 'AI Inspection skipped (No Key)' };

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                Perform a Pedagogical Audit on the following assessment questions for the subject: ${subject}.
                Evaluate each question for:
                1. Clarity and Ambiguity
                2. Technical Accuracy
                3. Possible Bias
                4. Distractor Quality (for MCQs)

                Questions:
                ${JSON.stringify(questions)}

                Return a JSON response with:
                - qualityScore (0-100)
                - feedback (Array of strings)
                - recommendedChanges (Array of strings)
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Basic JSON extraction from AI response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return { score: 85, feedback: ['AI could not parse response format'], raw: text };
        } catch (error) {
            console.error('AQI Audit Error:', error);
            return { score: 100, error: 'Audit Failed' };
        }
    }
}

module.exports = new AQIEngine();
