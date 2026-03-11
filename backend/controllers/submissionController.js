const SubmissionModel = require('../models/Submission');
const Assessment = require('../models/Assessment');
const auditLogger = require('../services/auditLogger');
const AnomalyEngine = require('../services/AnomalyEngine');
const behavioralAnalysisService = require('../services/BehavioralAnalysisService');

// @route POST /api/submissions
exports.submitAssessment = async (req, res) => {
  try {
    const { assessmentId, answers, timeTaken } = req.body;
    console.log(`[Submission] Attempting for Assessment: ${assessmentId}, User: ${req.user.id}`);

    let assessment = null;
    if (assessmentId) {
      assessment = await Assessment.getAssessmentById(assessmentId);
    }

    // Use provided questions (for AI sessions) or assessment questions
    const sourceQuestions = req.body.questions || (assessment ? assessment.questions : []);

    if (!assessment && (!sourceQuestions || sourceQuestions.length === 0)) {
      console.error(`[Submission] FAILED: Assessment ${assessmentId} not found and no questions provided.`);
      return res.status(404).json({ success: false, message: 'Assessment or Questions not found' });
    }

    // Auto-evaluate MCQ answers
    let totalScore = 0;
    let maxScore = 0;
    const aiService = require('../services/aiService');
    const aiEnabled = assessment?.settings?.aiEvaluation !== false;

    const evaluatedAnswers = await Promise.all((sourceQuestions || []).map(async (question) => {
      maxScore += question.points;
      const qId = question.id || question._id || question.questionId;
      const userAnswer = answers[qId] || answers[String(qId)] || '';
      let isCorrect = null;
      let points = 0;
      let feedback = null;

      if (question.type === 'mcq') {
        isCorrect = userAnswer === question.correctAnswer;
        points = isCorrect ? question.points : 0;
        totalScore += points;
        feedback = isCorrect ? 'Correct!' : 'Incorrect';
      } else if (question.type === 'multiple_choice') {
        const sortedUser = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
        const sortedCorrect = [...(question.correctAnswers || [])].sort();
        isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
        points = isCorrect ? question.points : 0;
        totalScore += points;
        feedback = isCorrect ? 'Correct!' : 'Incorrect';
      } else if (aiEnabled && (question.type === 'coding' || question.type === 'short_answer' || question.type === 'long_answer')) {
        // AI Evaluation will now be manually triggered by the instructor on the evaluation page.
        isCorrect = null;
        points = 0;
        feedback = '';
      }

      return {
        questionId: qId,
        questionText: question.question,
        type: question.type,
        answer: userAnswer,
        correctAnswer: question.correctAnswer || question.correctAnswers,
        isCorrect,
        points,
        feedback
      };
    }));

    const hasWrittenOrCoding = (sourceQuestions || []).some(q =>
      ['coding', 'short_answer', 'long_answer'].includes(q.type)
    );

    // Smart Question Difficulty Learning
    if (assessment && assessment.questions) {
      const questionTimes = (req.body.anomalyMetrics && req.body.anomalyMetrics.questionTimes) || {};
      const durationSeconds = (assessment.duration || 30) * 60;

      assessment.questions.forEach(q => {
        const qId = q._id || q.id;
        const result = evaluatedAnswers.find(a => String(a.questionId) === String(qId));

        if (result) {
          q.totalAttempts = (q.totalAttempts || 0) + 1;
          if (result.isCorrect) q.correctCount = (q.correctCount || 0) + 1;

          // Time Factor (relative to allotted time per question)
          const timeSpent = questionTimes[qId] || 0;
          const questionsCount = assessment.questions.length || 1;
          const avgAllottedTime = durationSeconds / questionsCount;
          const timeFactor = Math.min(timeSpent / (avgAllottedTime * 2), 1); // Cap at 2x avg allotted

          // Difficulty Formula:
          // AdjustedDifficulty = (1 - CorrectRate) * 0.7 + (TimeFactor) * 0.3
          const correctRate = q.correctCount / q.totalAttempts;
          const newDifficulty = ((1 - correctRate) * 0.7) + (timeFactor * 0.3);

          q.difficultyIndex = Math.max(0, Math.min(1, newDifficulty));
        }
      });
      await assessment.save();
      console.log(`[Smart-Learning] Re-calculated difficulty for Assessment: ${assessmentId}`);
    }

    // Exam DNA Fingerprint Generator
    const crypto = require('crypto');
    const generateDNA = (data, user, timing) => {
      const signals = [
        user.id,
        data.tabSwitches || 0,
        data.copyPastes || 0,
        timing || 0,
        data.fingerprint || 'unknown'
      ];
      return crypto.createHash('sha256').update(signals.join('|')).digest('hex');
    };

    const examDNA = generateDNA(
      req.body.anomalyData || req.body.anomalyMetrics || {},
      req.user,
      timeTaken
    );

    const submission = await SubmissionModel.createSubmission({
      assessmentId,
      studentId: req.user.id,
      studentName: req.user.name,
      status: 'pending', // Always require instructor review before finalizing
      totalScore: totalScore, // Auto-score baseline for instructor to review
      maxScore: maxScore || (assessment ? assessment.totalMarks : 0),
      percentage: Math.round((totalScore / (maxScore || (assessment ? assessment.totalMarks : 1))) * 100),
      timeTaken,
      answers: evaluatedAnswers,
      submittedAt: new Date().toISOString(),
      behaviorLogs: req.body.behaviorLogs || [],
      anomalyMetrics: req.body.anomalyMetrics || {},
      examDNA // Save the DNA
    });

    // Full Behavioral Anomaly Scoring
    // Process new anomalyData from the enhanced frontend telemetry
    const anomalyData = req.body.anomalyData || req.body.anomalyMetrics || {};
    const tabSwitches = anomalyData.tabSwitches || 0;
    const copyPastes = anomalyData.copyPastes || 0;
    const questionTimes = anomalyData.questionTimes || {};
    const kd = anomalyData.keystrokeDynamics || null;

    // Innovation Phase 2: Advanced Behavioral Biometrics
    const behaviorRisk = await behavioralAnalysisService.aggregateRisk(
      anomalyData,
      submission,
      SubmissionModel.Submission
    );

    // Question Time Deviation Analysis (Z-score)
    let perQuestionRisk = 0;
    let fastAnswerCount = 0;

    if (assessment && assessment.questions && Object.keys(questionTimes).length > 0) {
      assessment.questions.forEach(q => {
        const qId = q._id.toString();
        const studentTime = questionTimes[qId];
        if (studentTime && q.avgTime > 0 && q.stdDev > 0) {
          const zScore = (q.avgTime - studentTime) / q.stdDev;
          if (zScore > 1.5) fastAnswerCount++;
        } else if (studentTime && studentTime < 3) {
          // Fallback for new questions
          fastAnswerCount++;
        }
      });
      // Formula: TimeRisk = fastAnswerCount * 3 
      perQuestionRisk = fastAnswerCount * 3;
    }

    const totalRiskScore = Math.min(100, behaviorRisk.totalRisk + perQuestionRisk);

    await AnomalyEngine.calculateRiskScore(submission.id, {
      tabSwitches,
      copyPastes,
      ipMismatch: false,
      timeTaken,
      fastAnswerCount,
      keystrokeDynamics: kd,
      behavioralFindings: behaviorRisk.findings,
      fingerprint: anomalyData.fingerprint
    });

    // Update submission with extended behavioral data
    await SubmissionModel.updateSubmission(submission.id, {
      anomalyMetrics: {
        tabSwitches,
        copyPastes,
        questionTimes,
        keystrokeDynamics: kd,
        fingerprint: anomalyData.fingerprint,
        perQuestionRisk,
        behavioralRisk: behaviorRisk.totalRisk,
        behavioralFindings: behaviorRisk.findings,
        totalRiskScore,
        warnings: anomalyData.warnings || []
      }
    });

    await auditLogger.logActivity(
      req,
      'ASSESSMENT_SUBMITTED',
      `Submitted assessment: ${assessment ? assessment.title : 'AI Quiz'}`,
      {
        assessmentId,
        totalScore,
        maxScore,
        riskScore: totalRiskScore,
        findingsCount: behaviorRisk.findings.length
      },
      submission.id
    );

    // Notify Instructor
    const Notification = require('../models/Notification');
    if (assessment && assessment.instructorId) {
      await Notification.createNotification({
        recipient: assessment.instructorId,
        message: `New submission from ${req.user.name} for: ${assessment.title}`,
        type: 'info',
        onModel: 'Submission',
        relatedId: submission.id
      });
    }

    // Trigger background AI evaluation for subjective questions
    if (aiEnabled && hasWrittenOrCoding) {
      console.log(`[Submission] Triggering background AI evaluation for Submission: ${submission.id}`);
      performAiEvaluation(submission.id, assessment, req).catch(err =>
        console.error(`[AI-Background-Evaluation] FAILED for ${submission.id}:`, err.message)
      );
    }

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/submissions/student
exports.getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await SubmissionModel.listSubmissions({ studentId: req.user.id });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/submissions/pending
exports.getPendingSubmissions = async (req, res) => {
  try {
    const instructorAssessments = await Assessment.listAssessments({ instructorId: req.user.id });
    const assessmentIds = instructorAssessments.map(a => a.id);

    if (assessmentIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const submissions = await SubmissionModel.listSubmissions({
      assessmentIds,
      status: 'pending'
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/submissions/assessment/:id
exports.getSubmissionsByAssessment = async (req, res) => {
  try {
    const submissions = await SubmissionModel.listSubmissions({ assessmentId: req.params.id });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/submissions/all
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await SubmissionModel.listSubmissions({});
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/submissions/:id/evaluate
exports.evaluateSubmission = async (req, res) => {
  try {
    const { manualAnswers, feedback } = req.body;
    console.log('[Evaluation] Received for ID:', req.params.id);
    console.log('[Evaluation] Manual Answers:', JSON.stringify(manualAnswers));

    const submission = await SubmissionModel.getSubmissionById(req.params.id);

    if (!submission) {
      console.error('[Evaluation] Submission not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Calculate auto-graded score safely
    const autoScore = (submission.answers || [])
      .filter(a => a.isCorrect === true)
      .reduce((acc, a) => {
        const p = Number(a.points) || Number(a.marksObtained) || 0;
        return acc + p;
      }, 0);

    // Apply manual grades
    let manualScore = 0;
    console.log('[Evaluation] Processing answers, count:', submission.answers?.length);

    const updatedAnswers = (submission.answers || []).map((answer) => {
      const ansObj = typeof answer.toObject === 'function' ? answer.toObject() : answer;

      const manual = Array.isArray(manualAnswers)
        ? manualAnswers.find(m => m.questionId === String(ansObj.questionId))
        : null;

      if (manual) {
        console.log(`[Evaluation] Applying manual grade for Q:${ansObj.questionId}, Points:${manual.points}`);
        const p = Number(manual.points) || 0;
        manualScore += p;
        return {
          ...ansObj,
          points: p,
          feedback: manual.feedback || '',
          isCorrect: p > 0
        };
      }
      return ansObj;
    });

    const totalScore = autoScore + manualScore;

    // Better maxScore fallback
    let maxScore = Number(submission.maxScore);
    if (!maxScore || maxScore === 0) {
      const assessment = await Assessment.getAssessmentById(submission.assessmentId);
      maxScore = assessment ? (assessment.totalMarks || assessment.calculatedTotalMarks) : 100;
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    console.log('[Evaluation] Final Scores - Auto:', autoScore, 'Manual:', manualScore, 'Total:', totalScore, 'Max:', maxScore, 'Percentage:', percentage);

    const updated = await SubmissionModel.updateSubmission(req.params.id, {
      status: 'evaluated',
      totalScore,
      percentage,
      instructorFeedback: feedback,
      evaluatedBy: req.user.id,
      evaluatedAt: new Date().toISOString(),
      answers: updatedAnswers
    });

    console.log('[Evaluation] Submission updated successfully');

    try {
      await auditLogger.logActivity(
        req,
        'ASSESSMENT_EVALUATED',
        `Evaluated submission by ${submission.studentName}`,
        { submissionId: submission.id, totalScore, percentage },
        submission.id
      );
    } catch (auditErr) {
      console.error('[Evaluation] Audit Logging Failed (Non-blocking):', auditErr.message);
    }

    // Notify Student
    const Notification = require('../models/Notification');
    const recipientId = submission.studentId._id || submission.studentId;
    console.log('[Evaluation] Sending Notification to:', recipientId);

    try {
      await Notification.createNotification({
        recipient: recipientId,
        message: `Your assessment "${submission.assessmentId?.title || 'Assessment'}" has been evaluated. Score: ${percentage}%`,
        type: 'success',
        onModel: 'Submission',
        relatedId: submission.id
      });
      console.log('[Evaluation] Notification sent');
    } catch (notifErr) {
      console.error('[Evaluation] Notification Failed (Non-blocking):', notifErr.message);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Evaluation] CRITICAL ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route GET /api/submissions/student/stats
 * @desc Get aggregated stats for student dashboard
 */
exports.getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;

    // 1. Basic Stats
    const submissions = await SubmissionModel.listSubmissions({ studentId });

    if (submissions.length === 0) {
      return res.json({
        success: true,
        data: {
          totalQuizzes: 0,
          avgScore: 0,
          bestScore: 0,
          categoryStats: [],
          trends: []
        }
      });
    }

    const totalQuizzes = submissions.length;
    const completed = submissions.filter(s => s.status === 'evaluated');
    const totalScore = completed.reduce((acc, s) => acc + (s.percentage || 0), 0);
    const avgScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0;
    const bestScore = completed.length > 0 ? Math.max(...completed.map(s => s.percentage || 0)) : 0;

    // 2. Category Stats (Using a simplified approach since Category is linked via Assessment)
    // We'll populate assessment info to group by subject for now
    const populatedSubmissions = await SubmissionModel.Submission.find({ studentId })
      .populate('assessmentId', 'subject category')
      .sort('-submittedAt');

    const catMap = {};
    populatedSubmissions.forEach(s => {
      const cat = s.assessmentId?.subject || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const categoryStats = Object.keys(catMap).map(name => ({
      name,
      value: catMap[name]
    }));

    // 3. Trends (Last 7 submissions)
    const trends = populatedSubmissions
      .filter(s => s.status === 'evaluated')
      .slice(0, 7)
      .reverse()
      .map(s => ({
        date: new Date(s.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: s.percentage
      }));

    res.json({
      success: true,
      data: {
        totalQuizzes,
        avgScore,
        bestScore,
        categoryStats,
        trends
      }
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Background function to perform AI evaluation for subjective answers
 * This updates the submission with AI suggestions for instructor review.
 */
async function performAiEvaluation(submissionId, assessment, req) {
  try {
    const SubmissionModel = require('../models/Submission');
    const aiService = require('../services/aiService');
    const UserModel = require('../models/user');

    const submission = await SubmissionModel.getSubmissionById(submissionId);
    if (!submission) return;

    // Get instructor's Gemini key
    const instructor = await UserModel.getUserById(assessment.instructorId, true);
    const customApiKey = instructor?.geminiKey;

    let manualScore = 0;
    const updatedAnswers = await Promise.all(submission.answers.map(async (answer) => {
      // Find matching question in the assessment
      const question = assessment.questions.find(q => String(q._id) === String(answer.questionId));

      if (question && ['coding', 'short_answer', 'long_answer'].includes(question.type)) {
        try {
          const res = await aiService.evaluateResponse(
            question.question,
            answer.answer,
            question.type,
            question.points || 10,
            customApiKey
          );

          manualScore += (res.points || 0);
          return {
            ...answer.toObject(),
            points: res.points || 0,
            feedback: `[AI Suggestion] ${res.feedback || 'Evaluated by AI.'}`,
            isCorrect: (res.points || 0) > 0
          };
        } catch (err) {
          console.error(`[AI-Background] Failed to grade Q:${answer.questionId}`, err.message);
        }
      }
      return answer.toObject();
    }));

    // Recalculate tentative score
    const autoScore = submission.answers
      .filter(a => ['mcq', 'multiple_choice'].includes(a.type) && (a.isCorrect === true || a.points > 0))
      .reduce((acc, a) => acc + (a.points || 0), 0);

    // Actually we only want to add manualScore to the existing autoScore
    const existingAutoScore = (submission.answers || [])
      .filter(a => ['mcq', 'multiple_choice'].includes(a.type) && a.isCorrect === true)
      .reduce((acc, a) => acc + (a.points || 0), 0);

    const totalScore = existingAutoScore + manualScore;
    const maxScore = submission.maxScore || 100;
    const percentage = Math.round((totalScore / maxScore) * 100);

    await SubmissionModel.updateSubmission(submissionId, {
      answers: updatedAnswers,
      totalScore: totalScore,
      percentage: percentage
    });

    console.log(`[AI-Background] COMPLETED for Submission: ${submissionId}. Tentative Score: ${percentage}%`);
  } catch (error) {
    console.error('[AI-Background-Evaluation] Critical Error:', error.message);
  }
}