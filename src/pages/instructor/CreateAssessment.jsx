import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Form, Input, Select, Button, Space, InputNumber, Divider, Modal, message } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  EyeOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { addAssessment } from '../../data/assessments';
import { toast } from 'react-toastify';

const { Option } = Select;
const { TextArea } = Input;

const AssessmentSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  subject: Yup.string().required('Subject is required'),
  type: Yup.string().required('Type is required'),
  duration: Yup.number().min(1, 'Duration must be at least 1 minute').required('Duration is required'),
  passingScore: Yup.number().min(0).max(100).required('Passing score is required'),
  difficulty: Yup.string().required('Difficulty is required'),
  questions: Yup.array().of(
    Yup.object().shape({
      question: Yup.string().required('Question text is required'),
      type: Yup.string().required('Question type is required'),
      points: Yup.number().min(1).required('Points are required'),
      options: Yup.array().when('type', {
        is: (type) => type === 'mcq' || type === 'multiple_choice',
        then: Yup.array().min(2, 'At least 2 options required').required('Options are required')
      }),
      correctAnswer: Yup.mixed().when('type', {
        is: 'mcq',
        then: Yup.string().required('Correct answer is required')
      }),
      correctAnswers: Yup.array().when('type', {
        is: 'multiple_choice',
        then: Yup.array().min(1, 'At least one correct answer required').required('Correct answers are required')
      })
    })
  ).min(1, 'At least one question is required')
});

const CreateAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionTypes = [
    { value: 'mcq', label: 'Multiple Choice (Single Answer)' },
    { value: 'multiple_choice', label: 'Multiple Choice (Multiple Answers)' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'long_answer', label: 'Long Answer' }
  ];

  const subjects = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
    'Biology', 'English', 'History', 'Geography'
  ];

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const assessmentData = {
        ...values,
        instructorId: user.id,
        instructorName: user.name,
        status: 'draft',
        enrolledStudents: [], // Would be populated when publishing
        questions: values.questions.map((q, index) => ({
          id: Date.now() + index, // Simple ID generation
          ...q
        }))
      };

      addAssessment(assessmentData);
      toast.success('Assessment created successfully!');
      navigate('/manage-assessments');
    } catch (error) {
      toast.error('Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestion = (values, setValues) => {
    const newQuestion = {
      question: '',
      type: 'mcq',
      points: 5,
      options: ['', ''],
      correctAnswer: '',
      correctAnswers: []
    };

    setValues({
      ...values,
      questions: [...values.questions, newQuestion]
    });
  };

  const removeQuestion = (index, values, setValues) => {
    const newQuestions = values.questions.filter((_, i) => i !== index);
    setValues({
      ...values,
      questions: newQuestions
    });
  };

  const addOption = (questionIndex, values, setValues) => {
    const newQuestions = [...values.questions];
    newQuestions[questionIndex].options.push('');
    setValues({
      ...values,
      questions: newQuestions
    });
  };

  const removeOption = (questionIndex, optionIndex, values, setValues) => {
    const newQuestions = [...values.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setValues({
      ...values,
      questions: newQuestions
    });
  };

  const updateQuestionField = (questionIndex, field, value, values, setValues) => {
    const newQuestions = [...values.questions];
    newQuestions[questionIndex][field] = value;
    setValues({
      ...values,
      questions: newQuestions
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Assessment
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build your assessment with multiple question types
        </p>
      </div>

      <Formik
        initialValues={{
          title: '',
          description: '',
          subject: '',
          type: 'quiz',
          duration: 60,
          passingScore: 70,
          difficulty: 'intermediate',
          questions: [{
            question: '',
            type: 'mcq',
            points: 5,
            options: ['', ''],
            correctAnswer: '',
            correctAnswers: []
          }]
        }}
        validationSchema={AssessmentSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setValues }) => (
          <Form layout="vertical" className="space-y-6">
            {/* Assessment Details */}
            <Card title="Assessment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={values.title}
                    onChange={(e) => setValues({ ...values, title: e.target.value })}
                    placeholder="Enter assessment title"
                    status={errors.title && touched.title ? 'error' : ''}
                  />
                  {errors.title && touched.title && (
                    <div className="text-red-500 text-sm mt-1">{errors.title}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <Select
                    value={values.subject}
                    onChange={(value) => setValues({ ...values, subject: value })}
                    className="w-full"
                    placeholder="Select subject"
                    status={errors.subject && touched.subject ? 'error' : ''}
                  >
                    {subjects.map(subject => (
                      <Option key={subject} value={subject}>{subject}</Option>
                    ))}
                  </Select>
                  {errors.subject && touched.subject && (
                    <div className="text-red-500 text-sm mt-1">{errors.subject}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <Select
                    value={values.type}
                    onChange={(value) => setValues({ ...values, type: value })}
                    className="w-full"
                    status={errors.type && touched.type ? 'error' : ''}
                  >
                    <Option value="quiz">Quiz</Option>
                    <Option value="exam">Exam</Option>
                    <Option value="assignment">Assignment</Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty *</label>
                  <Select
                    value={values.difficulty}
                    onChange={(value) => setValues({ ...values, difficulty: value })}
                    className="w-full"
                    status={errors.difficulty && touched.difficulty ? 'error' : ''}
                  >
                    {difficulties.map(difficulty => (
                      <Option key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes) *</label>
                  <InputNumber
                    value={values.duration}
                    onChange={(value) => setValues({ ...values, duration: value })}
                    min={1}
                    className="w-full"
                    status={errors.duration && touched.duration ? 'error' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Passing Score (%) *</label>
                  <InputNumber
                    value={values.passingScore}
                    onChange={(value) => setValues({ ...values, passingScore: value })}
                    min={0}
                    max={100}
                    className="w-full"
                    status={errors.passingScore && touched.passingScore ? 'error' : ''}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Description *</label>
                <TextArea
                  value={values.description}
                  onChange={(e) => setValues({ ...values, description: e.target.value })}
                  rows={3}
                  placeholder="Enter assessment description"
                  status={errors.description && touched.description ? 'error' : ''}
                />
                {errors.description && touched.description && (
                  <div className="text-red-500 text-sm mt-1">{errors.description}</div>
                )}
              </div>
            </Card>

            {/* Questions */}
            <Card title="Questions">
              {values.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="mb-6 p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Question {questionIndex + 1}</h3>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeQuestion(questionIndex, values, setValues)}
                      disabled={values.questions.length === 1}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type *</label>
                      <Select
                        value={question.type}
                        onChange={(value) => updateQuestionField(questionIndex, 'type', value, values, setValues)}
                        className="w-full"
                      >
                        {questionTypes.map(type => (
                          <Option key={type.value} value={type.value}>{type.label}</Option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Points *</label>
                      <InputNumber
                        value={question.points}
                        onChange={(value) => updateQuestionField(questionIndex, 'points', value, values, setValues)}
                        min={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Question *</label>
                    <TextArea
                      value={question.question}
                      onChange={(e) => updateQuestionField(questionIndex, 'question', e.target.value, values, setValues)}
                      rows={2}
                      placeholder="Enter your question"
                    />
                  </div>

                  {/* Options for MCQ types */}
                  {(question.type === 'mcq' || question.type === 'multiple_choice') && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">Options *</label>
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => addOption(questionIndex, values, setValues)}
                          size="small"
                        >
                          Add Option
                        </Button>
                      </div>

                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[optionIndex] = e.target.value;
                              updateQuestionField(questionIndex, 'options', newOptions, values, setValues);
                            }}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1"
                          />
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeOption(questionIndex, optionIndex, values, setValues)}
                            disabled={question.options.length === 2}
                            size="small"
                          />
                        </div>
                      ))}

                      {/* Correct Answer Selection */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                          Correct Answer{question.type === 'multiple_choice' ? 's' : ''} *
                        </label>
                        {question.type === 'mcq' ? (
                          <Select
                            value={question.correctAnswer}
                            onChange={(value) => updateQuestionField(questionIndex, 'correctAnswer', value, values, setValues)}
                            className="w-full"
                            placeholder="Select correct answer"
                          >
                            {question.options.map((option, index) => (
                              <Option key={index} value={option} disabled={!option.trim()}>
                                {option || `Option ${index + 1}`}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Select
                            mode="multiple"
                            value={question.correctAnswers}
                            onChange={(values) => updateQuestionField(questionIndex, 'correctAnswers', values, values, setValues)}
                            className="w-full"
                            placeholder="Select correct answers"
                          >
                            {question.options.map((option, index) => (
                              <Option key={index} value={option} disabled={!option.trim()}>
                                {option || `Option ${index + 1}`}
                              </Option>
                            ))}
                          </Select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => addQuestion(values, setValues)}
                className="w-full"
              >
                Add Question
              </Button>

              {errors.questions && typeof errors.questions === 'string' && (
                <div className="text-red-500 text-sm mt-2">{errors.questions}</div>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setPreviewData(values);
                    setPreviewVisible(true);
                  }}
                >
                  Preview
                </Button>
              </Space>
              <Space>
                <Button onClick={() => navigate('/manage-assessments')}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={isSubmitting}
                >
                  Create Assessment
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Formik>

      {/* Preview Modal */}
      <Modal
        title="Assessment Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">{previewData?.title}</h2>
            <p className="text-gray-600">{previewData?.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Subject: {previewData?.subject}</div>
            <div>Type: {previewData?.type}</div>
            <div>Duration: {previewData?.duration} minutes</div>
            <div>Passing Score: {previewData?.passingScore}%</div>
          </div>

          <Divider />

          <div>
            <h3 className="font-bold mb-4">Questions ({previewData?.questions?.length})</h3>
            {previewData?.questions?.map((question, index) => (
              <Card key={index} size="small" className="mb-3">
                <div className="font-medium mb-2">
                  {index + 1}. {question.question} ({question.points} points)
                </div>
                <div className="text-sm text-gray-600">
                  Type: {questionTypes.find(t => t.value === question.type)?.label}
                </div>
                {(question.type === 'mcq' || question.type === 'multiple_choice') && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Options:</div>
                    <ul className="text-sm ml-4">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className={
                          question.type === 'mcq' && option === question.correctAnswer ? 'text-green-600 font-medium' :
                          question.type === 'multiple_choice' && question.correctAnswers.includes(option) ? 'text-green-600 font-medium' : ''
                        }>
                          {option || `Option ${optIndex + 1}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateAssessment;
