import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, List, Button, Avatar, Tag, Modal, Form, Input, InputNumber, Divider, Space } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { getAssessmentsByInstructor } from '../../data/assessments';
import { getPendingSubmissions, updateSubmission } from '../../data/submissions';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { TextArea } = Input;

const EvaluateSubmissions = () => {
  const { user } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState(() => {
    const myAssessments = getAssessmentsByInstructor(user.id);
    return getPendingSubmissions().filter(submission =>
      myAssessments.some(assessment => assessment.id === submission.assessmentId)
    );
  });
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);

  const handleEvaluate = (submission) => {
    setEvaluatingSubmission(submission);
    setEvaluationModalVisible(true);
  };

  const handleEvaluationSubmit = async (values) => {
    try {
      // Calculate final score including manual grading
      const autoEvaluatedScore = evaluatingSubmission.answers
        .filter(answer => answer.isCorrect !== null)
        .reduce((acc, answer) => acc + (answer.isCorrect ? answer.points : 0), 0);

      const manualScore = values.manualAnswers.reduce((acc, manual) => acc + manual.points, 0);
      const totalScore = autoEvaluatedScore + manualScore;

      const percentage = Math.round((totalScore / evaluatingSubmission.maxScore) * 100);

      const updatedSubmission = updateSubmission(evaluatingSubmission.id, {
        status: 'evaluated',
        totalScore,
        percentage,
        instructorFeedback: values.feedback,
        evaluatedBy: user.id,
        evaluatedAt: new Date().toISOString(),
        answers: evaluatingSubmission.answers.map((answer, index) => {
          if (answer.isCorrect === null) {
            // Manual grading
            return {
              ...answer,
              points: values.manualAnswers[index].points,
              feedback: values.manualAnswers[index].feedback
            };
          }
          return answer;
        })
      });

      if (updatedSubmission) {
        setPendingSubmissions(prev => prev.filter(sub => sub.id !== evaluatingSubmission.id));
        setEvaluationModalVisible(false);
        setEvaluatingSubmission(null);
        toast.success('Submission evaluated successfully!');
      }
    } catch (error) {
      toast.error('Failed to evaluate submission');
    }
  };

  const getAssessmentTitle = (assessmentId) => {
    // This would normally come from a utility function
    const assessment = getAssessmentsByInstructor(user.id).find(a => a.id === assessmentId);
    return assessment?.title || 'Unknown Assessment';
  };

  if (pendingSubmissions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            All Caught Up!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No pending submissions to evaluate at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Evaluate Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and grade student submissions
        </p>
      </div>

      <Card>
        <List
          dataSource={pendingSubmissions}
          renderItem={(submission) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleEvaluate(submission)}
                  icon={<CheckCircleOutlined />}
                >
                  Evaluate
                </Button>
              ]}
            >
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
                    <div>{getAssessmentTitle(submission.assessmentId)}</div>
                    <div className="text-sm text-gray-600">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Time taken: {submission.timeTaken ? `${Math.floor(submission.timeTaken / 60)}h ${submission.timeTaken % 60}m` : 'N/A'}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Evaluation Modal */}
      <Modal
        title={`Evaluate Submission - ${evaluatingSubmission?.studentName}`}
        open={evaluationModalVisible}
        onCancel={() => {
          setEvaluationModalVisible(false);
          setEvaluatingSubmission(null);
        }}
        width={1000}
        footer={null}
      >
        {evaluatingSubmission && (
          <Formik
            initialValues={{
              manualAnswers: evaluatingSubmission.answers
                .filter(answer => answer.isCorrect === null)
                .map(() => ({ points: 0, feedback: '' })),
              feedback: ''
            }}
            onSubmit={handleEvaluationSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <Form layout="vertical" onFinish={handleSubmit}>
                <div className="space-y-6">
                  {/* Auto-evaluated questions */}
                  {evaluatingSubmission.answers
                    .filter(answer => answer.isCorrect !== null)
                    .map((answer, index) => (
                      <Card key={index} size="small" className="bg-gray-50">
                        <div className="font-medium mb-2">Question {index + 1} (Auto-evaluated)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {(() => {
                            const assessment = getAssessmentsByInstructor(user.id).find(a => a.id === evaluatingSubmission.assessmentId);
                            const question = assessment?.questions.find(q => q.id === answer.questionId);
                            return question?.question || 'Question not found';
                          })()}
                        </div>
                        <div className="text-sm mb-2">
                          <strong>Answer:</strong> {typeof answer.answer === 'string' ? answer.answer : answer.answer.join(', ')}
                        </div>
                        <div className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {answer.feedback} - {answer.points} points
                        </div>
                      </Card>
                    ))}

                  {/* Manual evaluation questions */}
                  {evaluatingSubmission.answers
                    .filter(answer => answer.isCorrect === null)
                    .map((answer, index) => (
                      <Card key={`manual-${index}`} size="small">
                        <div className="font-medium mb-2">Question {evaluatingSubmission.answers.filter(a => a.isCorrect !== null).length + index + 1} (Manual Evaluation)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {(() => {
                            const assessment = getAssessmentsByInstructor(user.id).find(a => a.id === evaluatingSubmission.assessmentId);
                            const question = assessment?.questions.find(q => q.id === answer.questionId);
                            return question?.question || 'Question not found';
                          })()}
                        </div>
                        <div className="text-sm mb-4">
                          <strong>Student Answer:</strong>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            {answer.answer}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Points</label>
                            <InputNumber
                              value={values.manualAnswers[index]?.points || 0}
                              onChange={(value) => {
                                const newManualAnswers = [...values.manualAnswers];
                                newManualAnswers[index] = { ...newManualAnswers[index], points: value };
                                setFieldValue('manualAnswers', newManualAnswers);
                              }}
                              min={0}
                              max={answer.points}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-500 mt-1">Max: {answer.points} points</div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Feedback</label>
                            <TextArea
                              value={values.manualAnswers[index]?.feedback || ''}
                              onChange={(e) => {
                                const newManualAnswers = [...values.manualAnswers];
                                newManualAnswers[index] = { ...newManualAnswers[index], feedback: e.target.value };
                                setFieldValue('manualAnswers', newManualAnswers);
                              }}
                              rows={3}
                              placeholder="Provide feedback for this answer..."
                            />
                          </div>
                        </div>
                      </Card>
                    ))}

                  <Divider />

                  {/* Overall Feedback */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Overall Feedback</label>
                    <TextArea
                      value={values.feedback}
                      onChange={(e) => setFieldValue('feedback', e.target.value)}
                      rows={4}
                      placeholder="Provide overall feedback for this submission..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Space>
                      <Button onClick={() => setEvaluationModalVisible(false)}>
                        Cancel
                      </Button>
                      <Button type="primary" htmlType="submit">
                        Submit Evaluation
                      </Button>
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
