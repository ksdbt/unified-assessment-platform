import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, List, Button, Avatar, Tag, Modal, Form, Input, InputNumber, Divider, Space, Spin } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Formik } from 'formik';
import { submissionAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { TextArea } = Input;

const EvaluateSubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleEvaluationSubmit = async (values) => {
    try {
      await submissionAPI.evaluate(evaluatingSubmission._id, {
        manualAnswers: values.manualAnswers,
        feedback: values.feedback
      });
      setSubmissions(prev => prev.filter(s => s._id !== evaluatingSubmission._id));
      setModalVisible(false);
      setEvaluatingSubmission(null);
      toast.success('Submission evaluated successfully!');
    } catch (error) {
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
    submission.answers.filter(a => a.isCorrect === null || a.isCorrect === undefined);

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
                    <div className="text-sm text-gray-600">Time taken: {submission.timeTaken ? `${Math.floor(submission.timeTaken / 60)}h ${submission.timeTaken % 60}m` : 'N/A'}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={`Evaluate - ${evaluatingSubmission?.studentName}`}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEvaluatingSubmission(null); }}
        width={900} footer={null}
      >
        {evaluatingSubmission && (
          <Formik
            initialValues={{
              manualAnswers: getManualAnswers(evaluatingSubmission).map(() => ({ points: 0, feedback: '' })),
              feedback: ''
            }}
            onSubmit={handleEvaluationSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <Form layout="vertical" onFinish={handleSubmit}>
                <div className="space-y-4">
                  {/* Auto-evaluated */}
                  {evaluatingSubmission.answers.filter(a => a.isCorrect !== null && a.isCorrect !== undefined).map((answer, index) => (
                    <Card key={index} size="small" className="bg-gray-50">
                      <div className="font-medium mb-1">Question {index + 1} (Auto-evaluated)</div>
                      <div className="text-sm mb-2"><strong>Answer:</strong> {typeof answer.answer === 'string' ? answer.answer : (answer.answer || []).join(', ')}</div>
                      <div className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {answer.isCorrect ? 'Correct' : 'Incorrect'} — {answer.points} points
                      </div>
                    </Card>
                  ))}

                  {/* Manual grading */}
                  {getManualAnswers(evaluatingSubmission).map((answer, index) => (
                    <Card key={`manual-${index}`} size="small">
                      <div className="font-medium mb-2">Written Answer {index + 1} (Manual Evaluation)</div>
                      <div className="text-sm mb-4">
                        <strong>Student Answer:</strong>
                        <div className="mt-1 p-3 bg-gray-50 rounded border" dangerouslySetInnerHTML={{ __html: answer.answer || '' }} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Points (max: {answer.points || '?'})</label>
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
                            rows={3}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Divider />
                  <div>
                    <label className="block text-sm font-medium mb-2">Overall Feedback</label>
                    <TextArea value={values.feedback} onChange={(e) => setFieldValue('feedback', e.target.value)} rows={4} placeholder="Overall feedback..." />
                  </div>
                  <div className="flex justify-end">
                    <Space>
                      <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                      <Button type="primary" htmlType="submit">Submit Evaluation</Button>
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