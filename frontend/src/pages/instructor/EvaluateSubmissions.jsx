import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, List, Button, Avatar, Tag, Modal, Form, Input, InputNumber, Divider, Space, Spin, Tooltip } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Formik } from 'formik';
import { submissionAPI, aiAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { TextArea } = Input;

const EvaluateSubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);

  useEffect(() => {
    submissionAPI.getPendingSubmissions()
      .then(res => setSubmissions(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEvaluate = (submission) => {
    setEvaluatingSubmission(submission);
    setModalVisible(true);
  };

  const handleAutoEvaluate = async (setFieldValue) => {
    if (!evaluatingSubmission) return;

    setAiGrading(true);
    try {
      const manualAnswers = getManualAnswers(evaluatingSubmission);
      const gradedAnswers = await Promise.all(manualAnswers.map(async (answer) => {
        const question = evaluatingSubmission.assessmentId?.questions?.find(q => q._id === answer.questionId) || {};
        try {
          const res = await aiAPI.evaluate({
            question: question.question || "Question details missing",
            answer: answer.answer,
            type: question.type || "long_answer",
            points: question.points || question.marks || 10
          });
          return {
            questionId: answer.questionId,
            points: res.data?.points || 0,
            feedback: `[AI Evaluation] ${res.data?.feedback || 'Evaluated by AI.'}`
          };
        } catch (err) {
          console.error('Failed to grade question', answer.questionId, err);
          return {
            questionId: answer.questionId,
            points: 0,
            feedback: '[AI Evaluation] Failed to auto-evaluate this answer.'
          };
        }
      }));

      setFieldValue('manualAnswers', gradedAnswers);
      setFieldValue('feedback', `[AI Auto-Summary] Automatically evaluated ${gradedAnswers.length} written responses.`);
      toast.success('AI Evaluation completed! Please review suggestions.');
    } catch (error) {
      toast.error(error.message || 'AI Auto-evaluation failed');
    } finally {
      setAiGrading(false);
    }
  };

  const handleEvaluationSubmit = async (values) => {
    console.log('[EvaluateSubmissions] Submitting Evaluation for:', evaluatingSubmission?._id);
    console.log('[EvaluateSubmissions] Payload:', {
      manualAnswers: values.manualAnswers,
      feedback: values.feedback
    });

    try {
      const response = await submissionAPI.evaluate(evaluatingSubmission._id, {
        manualAnswers: values.manualAnswers,
        feedback: values.feedback
      });
      console.log('[EvaluateSubmissions] Success:', response);
      setSubmissions(prev => prev.filter(s => s._id !== evaluatingSubmission._id));
      setModalVisible(false);
      setEvaluatingSubmission(null);
      toast.success('Submission evaluated successfully!');
    } catch (error) {
      console.error('[EvaluateSubmissions] FAILED:', error);
      toast.error(error.message || 'Failed to evaluate submission');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  if (submissions.length === 0) {
    return (
      <div className="p-6 text-center py-12">
        <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Caught Up!</h2>
        <p className="text-gray-600 dark:text-gray-400">No pending submissions to evaluate at this time.</p>
      </div>
    );
  }

  // Get manual (written) answers that need grading
  const getManualAnswers = (submission) =>
    (submission.answers || []).filter(a => a.isCorrect === null || a.isCorrect === undefined);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Evaluate Submissions</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and grade student submissions</p>
      </div>

      <Card>
        <List
          dataSource={submissions}
          renderItem={(submission) => (
            <List.Item actions={[<Button type="primary" onClick={() => handleEvaluate(submission)} icon={<CheckCircleOutlined />}>Evaluate</Button>]}>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{submission.studentName}</span>
                    <Tag color="orange">Pending Review</Tag>
                  </div>
                }
                description={
                  <div className="space-y-1">
                    <div>{submission.assessmentId?.title}</div>
                    <div className="text-sm text-gray-600">Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
                    <div className="text-sm text-gray-600">
                      Time taken: {submission.timeTaken ? (
                        submission.timeTaken > 3600
                          ? `${Math.floor(submission.timeTaken / 3600)}h ${Math.floor((submission.timeTaken % 3600) / 60)}m`
                          : `${Math.floor(submission.timeTaken / 60)}m ${submission.timeTaken % 60}s`
                      ) : 'N/A'}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={
          <div className="flex justify-between items-center pr-8 w-full">
            <span>Evaluate - {evaluatingSubmission?.studentName}</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEvaluatingSubmission(null); }}
        width={900} footer={null}
      >
        {evaluatingSubmission && (
          <Formik
            initialValues={{
              manualAnswers: getManualAnswers(evaluatingSubmission).map((a) => ({
                questionId: a.questionId,
                points: a.points || 0,
                feedback: a.feedback || ''
              })),
              feedback: ''
            }}
            onSubmit={handleEvaluationSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <Form layout="vertical" onFinish={handleSubmit}>
                <div className="flex justify-end mb-4">
                  <Button
                    type="primary"
                    icon={<RobotOutlined />}
                    className="bg-purple-600 border-none h-10 px-6 rounded-lg shadow-md"
                    onClick={() => handleAutoEvaluate(setFieldValue)}
                    loading={aiGrading}
                  >
                    Auto-Evaluate with AI
                  </Button>
                </div>
                <div className="space-y-4">
                  {/* Auto-evaluated */}
                  {(evaluatingSubmission.answers || []).filter(a => a.isCorrect !== null && a.isCorrect !== undefined).map((answer, index) => (
                    <Card key={index} size="small" className="bg-gray-50 border-gray-200">
                      <div className="font-medium mb-1">Question {index + 1} (Auto-evaluated)</div>
                      <div className="text-sm mb-2"><strong>Answer:</strong> {typeof answer.answer === 'string' ? answer.answer : JSON.stringify(answer.answer)}</div>
                      <div className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {answer.isCorrect ? 'Correct' : 'Incorrect'} — {answer.points || answer.marksObtained} points
                      </div>
                      {answer.feedback && <div className="text-xs text-gray-500 mt-1 italic">Feedback: {answer.feedback}</div>}
                    </Card>
                  ))}

                  {/* Manual grading / AI Review */}
                  {getManualAnswers(evaluatingSubmission).map((answer, index) => {
                    const question = evaluatingSubmission.assessmentId?.questions?.find(q => q._id === answer.questionId) || {};
                    const isAiEvaluated = answer.feedback?.includes('[AI Evaluation]');

                    return (
                      <Card
                        key={`manual-${index}`}
                        size="small"
                        className={`border-indigo-100 ${isAiEvaluated ? 'bg-purple-50/20' : 'bg-indigo-50/10'}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Question {index + 1 + (evaluatingSubmission.answers.length - getManualAnswers(evaluatingSubmission).length)} ({question.type || 'Written Answer'})</div>
                          <Space>
                            {isAiEvaluated && <Tag color="purple" icon={<RobotOutlined />}>AI Evaluated</Tag>}
                            {answer.feedback?.includes('[AI Suggestion]') && <Tag color="cyan" icon={<ThunderboltOutlined />}>AI Pre-graded</Tag>}
                          </Space>
                        </div>
                        <div className="text-sm mb-4">
                          <strong>Student Answer:</strong>
                          {question.type === 'coding' ? (
                            <pre className="mt-1 p-3 bg-gray-900 text-gray-100 rounded border font-mono text-xs overflow-auto">{answer.answer || ''}</pre>
                          ) : (
                            <div className="mt-1 p-3 bg-white rounded border text-gray-800 shadow-sm" dangerouslySetInnerHTML={{ __html: answer.answer || '' }} />
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Points (max: {question.points || question.marks || '?'})</label>
                            <InputNumber
                              value={values.manualAnswers[index]?.points || 0}
                              onChange={(v) => {
                                const updated = [...values.manualAnswers];
                                updated[index] = { ...updated[index], points: v };
                                setFieldValue('manualAnswers', updated);
                              }}
                              min={0}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Feedback</label>
                            <TextArea
                              value={values.manualAnswers[index]?.feedback || ''}
                              onChange={(e) => {
                                const updated = [...values.manualAnswers];
                                updated[index] = { ...updated[index], feedback: e.target.value };
                                setFieldValue('manualAnswers', updated);
                              }}
                              placeholder="Review logic, efficiency, and accuracy..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  <Divider />
                  <div>
                    <label className="block text-sm font-medium mb-2">Overall Feedback</label>
                    <TextArea value={values.feedback} onChange={(e) => setFieldValue('feedback', e.target.value)} rows={4} placeholder="Summarize student performance..." />
                  </div>
                  <div className="flex justify-end">
                    <Space>
                      <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                      <Button type="primary" htmlType="submit" className="bg-indigo-600">Submit Evaluation</Button>
                    </Space>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </Modal>
    </div>
  );
};

export default EvaluateSubmissions;