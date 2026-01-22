import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Radio, Checkbox, Progress, Modal, Space, Typography } from 'antd';
import { ClockCircleOutlined, LeftOutlined, RightOutlined, SaveOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getAssessmentById } from '../../data/assessments';
import { addSubmission } from '../../data/submissions';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

const AssessmentInterface = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const assessmentData = getAssessmentById(parseInt(id));
    if (assessmentData) {
      setAssessment(assessmentData);
      setTimeLeft(assessmentData.duration * 60); // Convert minutes to seconds
      // Initialize answers object
      const initialAnswers = {};
      assessmentData.questions.forEach(q => {
        initialAnswers[q.id] = q.type === 'multiple_choice' ? [] : '';
      });
      setAnswers(initialAnswers);
    }
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && assessment) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, assessment]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, value, isMultiple = false) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: isMultiple ? value : value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleAutoSave = () => {
    // Simulate auto-save
    toast.info('Assessment auto-saved');
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate score (simplified)
      let totalScore = 0;
      let maxScore = 0;

      const answersWithDetails = assessment.questions.map(question => {
        maxScore += question.points;
        const userAnswer = answers[question.id];
        let isCorrect = false;
        let points = 0;

        if (question.type === 'mcq') {
          isCorrect = userAnswer === question.correctAnswer;
          points = isCorrect ? question.points : 0;
        } else if (question.type === 'multiple_choice') {
          isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswers.sort());
          points = isCorrect ? question.points : 0;
        } else {
          // For written answers, we'll assume they need manual grading
          isCorrect = null;
          points = 0;
        }

        totalScore += points;

        return {
          questionId: question.id,
          type: question.type,
          answer: userAnswer,
          isCorrect,
          points,
          feedback: question.correctAnswer ? (isCorrect ? 'Correct!' : 'Incorrect') : null
        };
      });

      // Create submission
      const submission = {
        assessmentId: assessment.id,
        studentId: user.id,
        studentName: user.name,
        submittedAt: new Date().toISOString(),
        status: 'pending', // Will be evaluated later for written answers
        totalScore,
        maxScore,
        percentage: Math.round((totalScore / maxScore) * 100),
        timeTaken: assessment.duration * 60 - timeLeft,
        answers: answersWithDetails,
        instructorFeedback: null,
        evaluatedBy: null,
        evaluatedAt: null
      };

      addSubmission(submission);

      toast.success(autoSubmit ? 'Time expired! Assessment submitted automatically.' : 'Assessment submitted successfully!');

      // Redirect to submissions page
      navigate('/submissions');
    } catch (error) {
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (!assessment) {
    return <div className="p-6">Loading assessment...</div>;
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {assessment.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {assessment.questions.length}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClockCircleOutlined className="text-red-500" />
              <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button
              onClick={handleAutoSave}
              icon={<SaveOutlined />}
              size="small"
            >
              Save
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Progress percent={progress} showInfo={false} />
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <Card className="mb-6">
            <div className="space-y-6">
              {/* Question */}
              <div>
                <Title level={4} className="mb-4">
                  {currentQuestion.question}
                </Title>

                {/* Question Content */}
                {currentQuestion.type === 'mcq' && (
                  <Radio.Group
                    value={answers[currentQuestion.id]}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full"
                  >
                    <Space direction="vertical" className="w-full">
                      {currentQuestion.options.map((option, index) => (
                        <Card
                          key={index}
                          className={`cursor-pointer transition-colors ${
                            answers[currentQuestion.id] === option ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => handleAnswerChange(currentQuestion.id, option)}
                        >
                          <Radio value={option} className="w-full">
                            {option}
                          </Radio>
                        </Card>
                      ))}
                    </Space>
                  </Radio.Group>
                )}

                {currentQuestion.type === 'multiple_choice' && (
                  <Checkbox.Group
                    value={answers[currentQuestion.id] || []}
                    onChange={(values) => handleAnswerChange(currentQuestion.id, values, true)}
                    className="w-full"
                  >
                    <Space direction="vertical" className="w-full">
                      {currentQuestion.options.map((option, index) => (
                        <Card
                          key={index}
                          className={`cursor-pointer transition-colors ${
                            (answers[currentQuestion.id] || []).includes(option) ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            const currentAnswers = answers[currentQuestion.id] || [];
                            const newAnswers = currentAnswers.includes(option)
                              ? currentAnswers.filter(a => a !== option)
                              : [...currentAnswers, option];
                            handleAnswerChange(currentQuestion.id, newAnswers, true);
                          }}
                        >
                          <Checkbox value={option} className="w-full">
                            {option}
                          </Checkbox>
                        </Card>
                      ))}
                    </Space>
                  </Checkbox.Group>
                )}

                {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'long_answer') && (
                  <ReactQuill
                    theme="snow"
                    value={answers[currentQuestion.id]}
                    onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    placeholder="Type your answer here..."
                    className="bg-white"
                  />
                )}
              </div>

              {/* Points */}
              <div className="text-right">
                <Text type="secondary">
                  Points: {currentQuestion.points}
                </Text>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              icon={<LeftOutlined />}
            >
              Previous
            </Button>

            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button
                type="primary"
                onClick={() => setShowSubmitModal(true)}
                loading={isSubmitting}
              >
                Submit Assessment
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleNext}
                icon={<RightOutlined />}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigation Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l p-4">
          <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {assessment.questions.map((question, index) => (
              <Button
                key={question.id}
                type={currentQuestionIndex === index ? 'primary' : 'default'}
                shape="circle"
                className={`${
                  answers[question.id] && answers[question.id] !== '' && answers[question.id].length !== 0
                    ? 'bg-green-500 hover:bg-green-600'
                    : ''
                }`}
                onClick={() => handleQuestionNavigation(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm">Not Answered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        title="Submit Assessment"
        open={showSubmitModal}
        onOk={() => handleSubmit()}
        onCancel={() => setShowSubmitModal(false)}
        okText="Submit"
        cancelText="Cancel"
        confirmLoading={isSubmitting}
      >
        <div className="space-y-4">
          <p>Are you sure you want to submit this assessment?</p>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <p><strong>Assessment:</strong> {assessment.title}</p>
            <p><strong>Questions Answered:</strong> {Object.values(answers).filter(a => a !== '' && a.length !== 0).length} / {assessment.questions.length}</p>
            <p><strong>Time Remaining:</strong> {formatTime(timeLeft)}</p>
          </div>
          <p className="text-red-600">
            Once submitted, you cannot change your answers.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentInterface;
