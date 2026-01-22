import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Tag, Button, Space, Modal, Descriptions, List, Avatar } from 'antd';
import {
  EyeOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { getSubmissionsByStudent } from '../../data/submissions';
import { getAssessmentById } from '../../data/assessments';

const Submissions = () => {
  const { user } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const submissions = getSubmissionsByStudent(user.id);

  const getStatusColor = (status) => {
    switch (status) {
      case 'evaluated': return 'green';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'evaluated': return <CheckCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setViewModalVisible(true);
  };

  const columns = [
    {
      title: 'Assessment',
      dataIndex: 'assessmentId',
      key: 'assessment',
      render: (assessmentId) => {
        const assessment = getAssessmentById(assessmentId);
        return (
          <div>
            <div className="font-medium">{assessment?.title}</div>
            <div className="text-sm text-gray-600">{assessment?.subject}</div>
          </div>
        );
      }
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Score',
      dataIndex: 'percentage',
      key: 'score',
      render: (percentage, record) => (
        record.status === 'evaluated' ? (
          <div className="text-center">
            <div className={`font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-600">
              {record.totalScore}/{record.maxScore}
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Pending</span>
        )
      )
    },
    {
      title: 'Time Taken',
      dataIndex: 'timeTaken',
      key: 'timeTaken',
      render: (minutes) => {
        if (!minutes) return '-';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewSubmission(record)}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          My Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your assessment submissions and results
        </p>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} submissions`
          }}
          locale={{
            emptyText: 'No submissions yet'
          }}
        />
      </Card>

      {/* Submission Details Modal */}
      <Modal
        title="Submission Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedSubmission && (
          <div className="space-y-6">
            {/* Assessment Info */}
            <Descriptions title="Assessment Information" bordered column={2}>
              <Descriptions.Item label="Assessment">
                {getAssessmentById(selectedSubmission.assessmentId)?.title}
              </Descriptions.Item>
              <Descriptions.Item label="Subject">
                {getAssessmentById(selectedSubmission.assessmentId)?.subject}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {new Date(selectedSubmission.submittedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedSubmission.status)}>
                  {selectedSubmission.status}
                </Tag>
              </Descriptions.Item>
              {selectedSubmission.status === 'evaluated' && (
                <>
                  <Descriptions.Item label="Score">
                    <span className={`font-bold ${selectedSubmission.percentage >= 70 ? 'text-green-600' : selectedSubmission.percentage >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                      {selectedSubmission.percentage}%
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Points">
                    {selectedSubmission.totalScore}/{selectedSubmission.maxScore}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Time Taken">
                {selectedSubmission.timeTaken ? `${Math.floor(selectedSubmission.timeTaken / 60)}h ${selectedSubmission.timeTaken % 60}m` : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Instructor Feedback */}
            {selectedSubmission.instructorFeedback && (
              <Card title="Instructor Feedback">
                <p>{selectedSubmission.instructorFeedback}</p>
              </Card>
            )}

            {/* Question Breakdown */}
            {selectedSubmission.status === 'evaluated' && (
              <Card title="Question Breakdown">
                <List
                  dataSource={selectedSubmission.answers}
                  renderItem={(answer, index) => (
                    <List.Item>
                      <div className="flex justify-between items-start w-full">
                        <div className="flex-1">
                          <div className="font-medium mb-2">
                            Question {index + 1}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {(() => {
                              const assessment = getAssessmentById(selectedSubmission.assessmentId);
                              const question = assessment?.questions.find(q => q.id === answer.questionId);
                              return question?.question || 'Question not found';
                            })()}
                          </div>
                          <div className="text-sm">
                            <strong>Your Answer:</strong> {typeof answer.answer === 'string' ? answer.answer : answer.answer.join(', ')}
                          </div>
                          {answer.feedback && (
                            <div className={`text-sm mt-1 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {answer.feedback}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className={`font-bold ${answer.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {answer.points} points
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Pending Status Message */}
            {selectedSubmission.status === 'pending' && (
              <Card>
                <div className="text-center text-orange-600">
                  <ClockCircleOutlined className="text-2xl mb-2" />
                  <p>This submission is being evaluated by your instructor.</p>
                  <p className="text-sm">Results will be available soon.</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Submissions;
