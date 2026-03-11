const aiService = require('../services/aiService');
const Assessment = require('../models/Assessment');

// Helper for logical duration
const calculateLogicalDuration = (questions) => {
    return questions.reduce((total, q) => {
        switch (q.type) {
            case 'mcq': return total + 1;
            case 'multiple_choice': return total + 2;
            case 'coding': return total + 15;
            case 'short_answer': return total + 3;
            case 'long_answer': return total + 10;
            default: return total + 1;
        }
    }, 0);
};

/**
 * @route POST /api/ai/generate
 * @desc Generate quiz questions dynamically
 */
exports.generateQuizQuestions = async (req, res) => {
    try {
        const { topic, difficulty, count, type, save, title, description, passingScore, subject } = req.body;

        // Fetch instructor's Gemini key
        const UserModel = require('../models/user');
        const instructor = await UserModel.getUserById(req.user.id, true);
        const customApiKey = instructor.geminiKey;

        const questions = await aiService.generateQuestions(
            topic,
            difficulty || 'intermediate',
            count || 5,
            type || 'mcq',
            title || '',
            description || '',
            customApiKey
        );

        let assessment = null;
        // In the new interactive flow, 'save' will be explicitly passed as false for preview
        const shouldSave = save === true;

        if (shouldSave) {
            const duration = calculateLogicalDuration(questions);
            assessment = await Assessment.createAssessment({
                title: title || `AI Generated: ${topic}`,
                description: description || `Automatically generated assessment about ${topic}`,
                subject: subject || topic,
                difficulty: difficulty || 'intermediate',
                type: type === 'coding' ? 'exam' : 'quiz',
                questions: questions,
                instructorId: req.user.id,
                instructorName: req.user.name,
                status: 'active',
                duration: Math.max(1, duration),
                passingScore: passingScore || 70,
                settings: {
                    aiEvaluation: true,
                    proctoring: true
                }
            });
        }

        res.json({
            success: true,
            data: questions,
            assessment: assessment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @route POST /api/ai/suggest-metadata
 * @desc Get AI suggestions for title and description
 */
exports.suggestMetadata = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }

        // Fetch instructor's Gemini key
        const UserModel = require('../models/user');
        const instructor = await UserModel.getUserById(req.user.id, true);
        const customApiKey = instructor.geminiKey;

        const suggestions = await aiService.suggestMetadata(topic, customApiKey);
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @route POST /api/ai/explain
 * @desc Explain incorrect answers
 */
exports.getExplanation = async (req, res) => {
    const { question, correctAnswer } = req.body;

    try {
        const explanation = await aiService.generateExplanation(question, correctAnswer);
        res.json({
            success: true,
            data: explanation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @route POST /api/ai/evaluate
 * @desc Auto-evaluate a student's answer using AI
 */
exports.autoEvaluate = async (req, res) => {
    const { question, answer, type, points } = req.body;

    try {
        const result = await aiService.evaluateResponse(question, answer, type, points);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
