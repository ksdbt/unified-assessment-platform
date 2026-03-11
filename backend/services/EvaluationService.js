const Submission = require('../models/Submission');
const Assessment = require('../models/Assessment');
const aiService = require('./aiService');

/**
 * Automate evaluation for MCQ and Coding questions
 */
class EvaluationService {

    async evaluateSubmission(submissionId) {
        try {
            const submission = await Submission.getSubmissionById(submissionId);
            const assessment = await Assessment.getAssessmentById(submission.assessmentId);

            if (!submission || !assessment) {
                throw new Error('Submission or Assessment not found');
            }

            let totalScore = 0;
            const evaluatedAnswers = [];

            for (const answer of submission.answers) {
                const question = assessment.questions.id(answer.questionId);

                if (!question) continue;

                let isCorrect = false;
                let marksObtained = 0;
                let feedback = '';

                if (question.type === 'mcq' || question.type === 'multiple_choice') {
                    if (question.type === 'mcq') {
                        isCorrect = (String(answer.answer) === String(question.correctAnswer));
                    } else {
                        // For Multiple Choice, check if all correct answers are selected
                        const correctSet = new Set(question.correctAnswers);
                        const answerSet = new Set(answer.answer);
                        isCorrect = correctSet.size === answerSet.size && [...correctSet].every(item => answerSet.has(item));
                    }
                    marksObtained = isCorrect ? question.marks : 0;
                    feedback = isCorrect ? 'Correct!' : `Incorrect. Correct answer: ${question.correctAnswer || question.correctAnswers.join(', ')}`;
                }
                else if (question.type === 'coding' || question.type === 'short_answer' || question.type === 'long_answer') {
                    // Use AI for evaluation of non-MCQ questions
                    const aiResult = await aiService.evaluateResponse(
                        question.question,
                        answer.answer,
                        question.type,
                        question.marks
                    );
                    isCorrect = aiResult.isCorrect;
                    marksObtained = aiResult.points;
                    feedback = aiResult.feedback;
                }

                totalScore += marksObtained;
                evaluatedAnswers.push({
                    ...answer,
                    isCorrect,
                    marksObtained,
                    feedback
                });
            }

            const maxScore = assessment.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
            const percentage = (totalScore / (maxScore || 1)) * 100;

            return await Submission.updateSubmission(submissionId, {
                status: 'evaluated',
                answers: evaluatedAnswers,
                totalScore,
                maxScore,
                percentage,
                evaluatedAt: new Date()
            });

        } catch (error) {
            console.error('Evaluation Error:', error);
            throw error;
        }
    }
}

module.exports = new EvaluationService();
