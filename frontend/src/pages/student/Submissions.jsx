import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Descriptions, List, Spin } from 'antd';
import { EyeOutlined, FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { submissionAPI } from '../../services/api';

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  useEffect(() => {
    submissionAPI.getStudentSubmissions()
      .then(res => setSubmissions(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => status === 'evaluated' ? 'green' : 'orange';
  const getStatusIcon = (status) => status === 'evaluated' ? <CheckCircleOutlined /> : <ClockCircleOutlined />;

  const columns = [
    {
      title: 'Assessment', dataIndex: 'assessmentId', key: 'assessment',
      render: (assessment) => (
        <div>
          <div className="font-medium">{assessment?.title || 'Assessment'}</div>
          <div className="text-sm text-gray-600">{assessment?.subject}</div>
        </div>
      )
    },
    {
      title: 'Submitted', dataIndex: 'submittedAt', key: 'submittedAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Score', dataIndex: 'percentage', key: 'score',
      render: (percentage, record) => record.status === 'evaluated' ? (
        <div className="text-center">
          <div className={`font-bold ${(percentage || 0) >= 70 ? 'text-green-600' : (percentage || 0) >= 50 ? 'text-orange-600' : 'text-red-600'}`}>{percentage}%</div>
          <div className="text-sm text-gray-600">{record.totalScore}/{record.maxScore}</div>
        </div>
      ) : <span className="text-gray-500">Pending</span>
    },
    {
      title: 'Time Taken', dataIndex: 'timeTaken', key: 'timeTaken',
      render: (seconds) => {
        if (!seconds) return '-';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      }
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Button type="primary" icon={<EyeOutlined />} size="small" onClick={() => { setSelectedSubmission(record); setViewModalVisible(true); }}>View</Button>
      )
    }
  ];

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Submissions</h1>
        <p className="text-gray-600 dark:text-gray-400">View your assessment submissions and results</p>
      </div>

      <Card>
        <Table columns={columns} dataSource={submissions} rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} submissions` }}
          locale={{ emptyText: 'No submissions yet' }}
        />
      </Card>

      <Modal title="Submission Details" open={viewModalVisible} onCancel={() => setViewModalVisible(false)} width={800}
        footer={[<Button key="close" onClick={() => setViewModalVisible(false)}>Close</Button>]}>
        {selectedSubmission && (
          <div className="space-y-6">
            <Descriptions title="Assessment Information" bordered column={2}>
              <Descriptions.Item label="Assessment">{selectedSubmission.assessmentId?.title}</Descriptions.Item>
              <Descriptions.Item label="Subject">{selectedSubmission.assessmentId?.subject}</Descriptions.Item>
              <Descriptions.Item label="Submitted">{new Date(selectedSubmission.submittedAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedSubmission.status)}>{selectedSubmission.status}</Tag>
              </Descriptions.Item>
              {selectedSubmission.status === 'evaluated' && (
                <>
                  <Descriptions.Item label="Score">
                    <span className={`font-bold ${(selectedSubmission.percentage || 0) >= 70 ? 'text-green-600' : 'text-red-600'}`}>{selectedSubmission.percentage}%</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Points">{selectedSubmission.totalScore}/{selectedSubmission.maxScore}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedSubmission.instructorFeedback && (
              <Card title="Instructor Feedback"><p>{selectedSubmission.instructorFeedback}</p></Card>
            )}

            {selectedSubmission.status === 'evaluated' && (
              <Card title="Question Breakdown">
                <List
                  dataSource={selectedSubmission.answers}
                  renderItem={(answer, index) => (
                    <List.Item>
                      <div className="flex justify-between items-start w-full">
                        <div className="flex-1">
                          <div className="font-medium mb-2">Question {index + 1}</div>
                          <div className="text-sm">
                            <strong>Your Answer:</strong> {typeof answer.answer === 'string' ? answer.answer : (answer.answer || []).join(', ')}
                          </div>
                          {answer.feedback && (
                            <div className={`text-sm mt-1 ${answer.isCorrect ? 'text-green-600' : 'text-orange-600'}`}>{answer.feedback}</div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className={`font-bold ${(answer.points || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>{answer.points || 0} pts</div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {selectedSubmission.status === 'pending' && (
              <Card>
                <div className="text-center text-orange-600">
                  <ClockCircleOutlined className="text-2xl mb-2" />
                  <p>This submission is being evaluated by your instructor.</p>
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