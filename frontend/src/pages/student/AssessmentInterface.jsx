import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Radio, Checkbox, Progress, Modal, Space, Typography, Spin } from 'antd';
import { ClockCircleOutlined, LeftOutlined, RightOutlined, SaveOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { assessmentAPI, submissionAPI } from '../../services/api';
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
  const [loading, setLoading] = useState(true);
  const submitCalledRef = useRef(false);

  useEffect(() => {
    assessmentAPI.getById(id)
      .then(res => {
        setAssessment(res.data);
        setTimeLeft(res.data.duration * 60);
        const init = {};
        res.data.questions.forEach(q => { init[q._id] = q.type === 'multiple_choice' ? [] : ''; });
        setAnswers(init);
      })
      .catch(() => toast.error('Failed to load assessment'))
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (assessment) toast.info('Auto-saved', { autoClose: 1500 });
    }, 30000);
    return () => clearInterval(interval);
  }, [assessment]);

  useEffect(() => {
    if (timeLeft > 0 && assessment) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handleSubmit(true); return 0; }
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

  const handleSubmit = async (autoSubmit = false) => {
    if (isSubmitting || submitCalledRef.current) return;
    submitCalledRef.current = true;
    setIsSubmitting(true);
    try {
      await submissionAPI.submit({
        assessmentId: assessment._id,
        answers,
        timeTaken: assessment.duration * 60 - timeLeft
      });
      toast.success(autoSubmit ? 'Time expired! Submitted automatically.' : 'Assessment submitted successfully!');
      navigate('/submissions');
    } catch (error) {
      toast.error(error.message || 'Failed to submit assessment');
      submitCalledRef.current = false;
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (!assessment) return <div className="p-6">Assessment not found</div>;

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const answeredCount = Object.values(answers).filter(a => a !== '' && (Array.isArray(a) ? a.length > 0 : true)).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{assessment.title}</h1>
            <p className="text-gray-600">Question {currentQuestionIndex + 1} of {assessment.questions.length}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClockCircleOutlined className="text-red-500" />
              <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button icon={<SaveOutlined />} size="small" onClick={() => toast.info('Saved!')}>Save</Button>
          </div>
        </div>
        <div className="mt-4"><Progress percent={progress} showInfo={false} /></div>
      </div>

      <div className="flex">
        <div className="flex-1 p-6">
          <Card className="mb-6">
            <div className="space-y-6">
              <Title level={4}>{currentQuestion.question}</Title>

              {currentQuestion.type === 'mcq' && (
                <Radio.Group value={answers[currentQuestion._id]} onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: e.target.value }))} className="w-full">
                  <Space direction="vertical" className="w-full">
                    {currentQuestion.options.map((option, index) => (
                      <Card key={index} className={`cursor-pointer ${answers[currentQuestion._id] === option ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion._id]: option }))}>
                        <Radio value={option} className="w-full">{option}</Radio>
                      </Card>
                    ))}
                  </Space>
                </Radio.Group>
              )}

              {currentQuestion.type === 'multiple_choice' && (
                <Checkbox.Group value={answers[currentQuestion._id] || []} onChange={(vals) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: vals }))} className="w-full">
                  <Space direction="vertical" className="w-full">
                    {currentQuestion.options.map((option, index) => (
                      <Card key={index} className={`cursor-pointer ${(answers[currentQuestion._id] || []).includes(option) ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <Checkbox value={option} className="w-full">{option}</Checkbox>
                      </Card>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}

              {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'long_answer') && (
                <ReactQuill theme="snow" value={answers[currentQuestion._id] || ''} onChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: val }))} placeholder="Type your answer here..." className="bg-white" />
              )}

              <div className="text-right"><Text type="secondary">Points: {currentQuestion.points}</Text></div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0} icon={<LeftOutlined />}>Previous</Button>
            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button type="primary" onClick={() => setShowSubmitModal(true)} loading={isSubmitting}>Submit Assessment</Button>
            ) : (
              <Button type="primary" onClick={() => setCurrentQuestionIndex(p => p + 1)} icon={<RightOutlined />}>Next</Button>
            )}
          </div>
        </div>

        <div className="w-72 bg-white dark:bg-gray-800 border-l p-4">
          <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {assessment.questions.map((q, index) => {
              const answered = answers[q._id] !== '' && !(Array.isArray(answers[q._id]) && answers[q._id].length === 0);
              return (
                <Button key={q._id} type={currentQuestionIndex === index ? 'primary' : 'default'}
                  shape="circle" style={answered && currentQuestionIndex !== index ? { backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' } : {}}
                  onClick={() => setCurrentQuestionIndex(index)}>{index + 1}</Button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span>Current</span></div>
            <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Answered</span></div>
            <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-gray-300 rounded"></div><span>Not Answered</span></div>
          </div>
        </div>
      </div>

      <Modal title="Submit Assessment" open={showSubmitModal} onOk={() => handleSubmit()} onCancel={() => setShowSubmitModal(false)} okText="Submit" confirmLoading={isSubmitting}>
        <div className="space-y-4">
          <p>Are you sure you want to submit?</p>
          <div className="bg-gray-50 p-4 rounded">
            <p><strong>Assessment:</strong> {assessment.title}</p>
            <p><strong>Questions Answered:</strong> {answeredCount} / {assessment.questions.length}</p>
            <p><strong>Time Remaining:</strong> {formatTime(timeLeft)}</p>
          </div>
          <p className="text-red-600">Once submitted, you cannot change your answers.</p>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentInterface;