import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Form, Input, Select, Button, Space, InputNumber, Divider, Modal, Tooltip, Spin, Switch, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { PlusOutlined, DeleteOutlined, SaveOutlined, EyeOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { assessmentAPI, aiAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Option } = Select;
const { TextArea } = Input;

const AssessmentSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  subject: Yup.string().required('Subject is required'),
  type: Yup.string().required('Type is required'),
  duration: Yup.number().min(1).required('Duration is required'),
  passingScore: Yup.number().min(0).max(100).required('Passing score is required'),
  difficulty: Yup.string().required('Difficulty is required'),
  questions: Yup.array().min(1, 'At least one question is required')
});

const questionTypes = [
  { value: 'mcq', label: 'Multiple Choice (Single Answer)' },
  { value: 'multiple_choice', label: 'Multiple Choice (Multiple Answers)' },
  { value: 'coding', label: 'Coding Challenge' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' }
];

const subjects = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Computer Networks',
  'Database Management Systems',
  'Software Engineering',
  'Machine Learning',
  'Artificial Intelligence',
  'Cybersecurity',
  'Cloud Computing',
  'Object Oriented Programming'
];
const difficulties = ['beginner', 'intermediate', 'advanced'];

const CreateAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Generation State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState({ title: false, description: false });
  const [aiParams, setAiParams] = useState({ topic: '', count: 5, type: 'mcq', difficulty: 'intermediate', title: '', description: '' });
  const [aiPreviewData, setAiPreviewData] = useState(null);
  const [showKeyEditor, setShowKeyEditor] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [keySaving, setKeySaving] = useState(false);

  const handleSaveKey = async () => {
    if (!customKey) return toast.warning('Please enter a key');
    setKeySaving(true);
    try {
      await userAPI.updateGeminiKey(customKey);
      toast.success('Gemini API Key saved for your profile!');
      setShowKeyEditor(false);
    } catch (error) {
      toast.error('Failed to save key: ' + error.message);
    } finally {
      setKeySaving(false);
    }
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await assessmentAPI.create({
        ...values,
        instructorId: user.id,
        instructorName: user.name,
        status: 'active',
        totalMarks: values.questions.reduce((sum, q) => sum + (q.points || 0), 0),
        enrolledStudents: []
      });
  
      toast.success('Assessment created successfully!');
      navigate('/manage-assessments');
    } catch (error) {
      toast.error(error.message || 'Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicSuggest = async (topic, setValues, values) => {
    if (!topic) return toast.warning('Please enter a subject or topic first');
    setAiSuggestionsLoading({ ...aiSuggestionsLoading, title: true });
    try {
      const res = await aiAPI.suggestMetadata(topic);
      if (res.success) {
        setValues({ ...values, title: res.data.title, description: res.data.description, subject: topic });
        toast.success('AI suggestions applied!');
      }
    } catch (error) {
      toast.error('AI suggestions failed');
    } finally {
      setAiSuggestionsLoading({ ...aiSuggestionsLoading, title: false });
    }
  };

  const handleAIGenerate = async (values, setValues) => {
    if (!aiParams.topic) {
      return toast.warning('Please enter a topic for AI generation');
    }

    setAiLoading(true);
    try {
      const res = await aiAPI.generateQuestions({
        topic: aiParams.topic,
        difficulty: aiParams.difficulty || values.difficulty,
        count: aiParams.count,
        type: aiParams.type,
        save: false,
        title: values.title || aiParams.title,
        description: values.description || aiParams.description
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'AI Generation failed');
      }

      setAiPreviewData(res.data);
      setAiModalVisible(false);

      // Update the main form values with generated content
      const newValues = {
        ...values,
        title: aiParams.title || values.title || `AI Generated: ${aiParams.topic}`,
        description: aiParams.description || values.description || `Assessment on ${aiParams.topic}`,
        subject: aiParams.topic,
        questions: res.data
      };

      // Calculate duration for the new questions
      newValues.duration = Math.max(1, calculateLogicalDuration(res.data));

      setValues(newValues);
      toast.info('AI Questions generated! Review the form below.');
    } catch (error) {
      toast.error(error.message || 'AI Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIQuestionInject = async (values, setValues) => {
    if (!values.subject && !aiParams.topic) return toast.warning('Please select a subject or enter a topic first');
    setAiLoading(true);
    try {
      const res = await aiAPI.generateQuestions({
        topic: values.subject || aiParams.topic,
        difficulty: values.difficulty,
        count: 3,
        type: aiParams.type,
        save: false,
        title: values.title,
        description: values.description
      });
      if (res.success && res.data) {
        const newQuestions = [...values.questions, ...res.data];
        handleDurationUpdate(newQuestions, values, setValues);
        toast.success('3 AI Questions added to your list!');
      }
    } catch (error) {
      toast.error('AI Question injection failed');
    } finally {
      setAiLoading(false);
    }
  };

  const calculateLogicalDuration = (questions) => {
    return questions.reduce((total, q) => {
      switch (q.type) {
        case 'mcq': return total + 1;
        case 'multiple_choice': return total + 2;
        case 'coding': return total + 15;
        case 'short_answer': return total + 3;
        case 'long_answer': return total + 10;
        default: return total + 1;
      }
    }, 0);
  };

  const handleDurationUpdate = (questions, values, setValues) => {
    const newDuration = calculateLogicalDuration(questions);
    setValues({ ...values, duration: Math.max(1, newDuration), questions });
  };

  const addQuestion = (values, setValues) => {
    const newQuestions = [...values.questions, { question: '', type: 'mcq', points: 5, difficulty: 'beginner', options: ['', ''], correctAnswer: '', correctAnswers: [] }];
    handleDurationUpdate(newQuestions, values, setValues);
  };

  const removeQuestion = (index, values, setValues) => {
    const newQuestions = values.questions.filter((_, i) => i !== index);
    handleDurationUpdate(newQuestions, values, setValues);
  };

  const addOption = (questionIndex, values, setValues) => {
    const newQuestions = [...values.questions];
    newQuestions[questionIndex].options.push('');
    setValues({ ...values, questions: newQuestions });
  };

  const removeOption = (questionIndex, optionIndex, values, setValues) => {
    const newQuestions = [...values.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setValues({ ...values, questions: newQuestions });
  };

  const updateQuestionField = (questionIndex, field, value, values, setValues) => {
    const newQuestions = [...values.questions];
    newQuestions[questionIndex][field] = value;
    if (field === 'type') {
      handleDurationUpdate(newQuestions, values, setValues);
    } else {
      setValues({ ...values, questions: newQuestions });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create New Assessment</h1>
          <p className="text-gray-600 dark:text-gray-400">Build your assessment with multiple question types</p>
        </div>
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={() => setAiModalVisible(true)}
          className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-lg shadow-md flex items-center"
        >
          AI Generator
        </Button>
      </div>

      <Formik
        initialValues={{
          title: '',
          description: '',
          subject: '',
          type: 'quiz',
          duration: 1,
          passingScore: 70,
          difficulty: 'intermediate',
          scheduledAt: dayjs().toISOString(),
          expiresAt: dayjs().add(7, 'day').toISOString(),
          questions: [{ question: '', type: 'mcq', points: 5, options: ['', ''], correctAnswer: '', correctAnswers: [] }]
        }}
        validationSchema={AssessmentSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setValues, handleSubmit }) => (
          <Form layout="vertical" onFinish={handleSubmit} className="space-y-6">
            <Card title="Assessment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center justify-between">
                    Title *
                    <Button
                      type="link"
                      size="small"
                      icon={<RobotOutlined />}
                      loading={aiSuggestionsLoading.title}
                      onClick={() => handleMagicSuggest(values.subject || aiParams.topic, setValues, values)}
                      className="text-indigo-600 p-0 h-auto"
                    >
                      ✨ AI Suggest
                    </Button>
                  </label>
                  <Input
                    value={values.title}
                    onChange={(e) => setValues({ ...values, title: e.target.value })}
                    placeholder="Enter assessment title"
                    status={errors.title && touched.title ? 'error' : ''}
                  />
                  {errors.title && touched.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject / Category *</label>
                  <Select
                    showSearch
                    value={values.subject}
                    onChange={(v) => {
                      setValues({ ...values, subject: v });
                      setAiParams({ ...aiParams, topic: v });
                    }}
                    className="w-full"
                    placeholder="Select or type subject"
                  >
                    {subjects.map(s => <Option key={s} value={s}>{s}</Option>)}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <Select value={values.type} onChange={(v) => setValues({ ...values, type: v })} className="w-full">
                    <Option value="quiz">Quiz</Option>
                    <Option value="exam">Exam</Option>
                    <Option value="assignment">Assignment</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty *</label>
                  <Select value={values.difficulty} onChange={(v) => setValues({ ...values, difficulty: v })} className="w-full">
                    {difficulties.map(d => <Option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</Option>)}
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Duration (minutes) *</label>
                    <Tooltip title="Calculate based on questions">
                      <Button
                        type="link"
                        size="small"
                        icon={<ThunderboltOutlined />}
                        onClick={() => setValues({ ...values, duration: calculateLogicalDuration(values.questions) })}
                      >
                        Auto-calc
                      </Button>
                    </Tooltip>
                  </div>
                  <InputNumber value={values.duration} onChange={(v) => setValues({ ...values, duration: v })} min={1} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Scheduled At *</label>
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD hh:mm A"
                    value={values.scheduledAt ? dayjs(values.scheduledAt) : null}
                    onChange={(date) => setValues({ ...values, scheduledAt: date ? date.toISOString() : '' })}
                    className="w-full"
                    placeholder="Start date and time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expires At / Deadline *</label>
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD hh:mm A"
                    value={values.expiresAt ? dayjs(values.expiresAt) : null}
                    onChange={(date) => setValues({ ...values, expiresAt: date ? date.toISOString() : '' })}
                    className="w-full"
                    placeholder="Deadline date and time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Attempts *</label>
                  <InputNumber min={1} value={values.maxAttempts || 1} onChange={(v) => setValues({ ...values, maxAttempts: v })} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Publish Immediately</label>
                  <Switch checked={values.isPublished !== false} onChange={(v) => setValues({ ...values, isPublished: v })} />
                </div>
              </div>
              {values.subject?.toLowerCase().includes('english') && aiParams.type === 'coding' && (
                <div className="mt-4 bg-amber-50 p-3 rounded border border-amber-200 text-amber-700 text-xs flex items-center">
                  <ThunderboltOutlined className="mr-2" />
                  <span><strong>Note:</strong> Generating 'Coding' questions for English might be unexpected. The AI will focus on text-processing logic if continued.</span>
                </div>
              )}
              <div className="mt-4">
                <label className="text-sm font-medium mb-2 flex items-center justify-between">
                  Description *
                  <Button
                    type="link"
                    size="small"
                    icon={<RobotOutlined />}
                    loading={aiSuggestionsLoading.title}
                    onClick={() => handleMagicSuggest(values.subject || aiParams.topic, setValues, values)}
                    className="text-indigo-600 p-0 h-auto"
                  >
                    ✨ AI Refine
                  </Button>
                </label>
                <TextArea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} rows={3} placeholder="Enter assessment description" />
                {errors.description && touched.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
              </div>
            </Card>

            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <span>Questions</span>
                  <Space>
                    <Select
                      size="small"
                      placeholder="Type"
                      value={aiParams.type}
                      onChange={(v) => setAiParams({ ...aiParams, type: v })}
                      style={{ width: 120 }}
                    >
                      <Option value="mcq">MCQ</Option>
                      <Option value="coding">Coding</Option>
                      <Option value="short_answer">Short Answer</Option>
                    </Select>
                    <Button
                      size="small"
                      icon={<RobotOutlined />}
                      onClick={() => handleAIQuestionInject(values, setValues)}
                      loading={aiLoading}
                      className="text-indigo-600 border-indigo-200 hover:border-indigo-600"
                    >
                      ✨ Add 3 AI Questions
                    </Button>
                  </Space>
                </div>
              }
            >
              {values.questions.filter(q => q).map((question, questionIndex) => (
                <div key={questionIndex} className="mb-6 p-4 border rounded-lg bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Question {questionIndex + 1}</h3>
                    <Button danger icon={<DeleteOutlined />} onClick={() => removeQuestion(questionIndex, values, setValues)} disabled={values.questions.length === 1}>Remove</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type *</label>
                      <Select value={question.type} onChange={(v) => updateQuestionField(questionIndex, 'type', v, values, setValues)} className="w-full">
                        {questionTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Points *</label>
                      <InputNumber value={question.points} onChange={(v) => updateQuestionField(questionIndex, 'points', v, values, setValues)} min={1} className="w-full" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Question *</label>
                    <TextArea value={question.question} onChange={(e) => updateQuestionField(questionIndex, 'question', e.target.value, values, setValues)} rows={2} placeholder="Enter your question" />
                  </div>
                  {(question.type === 'mcq' || question.type === 'multiple_choice') && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">Options *</label>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => addOption(questionIndex, values, setValues)} size="small">Add Option</Button>
                      </div>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                          <Input value={option} onChange={(e) => { const newOpts = [...question.options]; newOpts[optionIndex] = e.target.value; updateQuestionField(questionIndex, 'options', newOpts, values, setValues); }} placeholder={`Option ${optionIndex + 1}`} className="flex-1" />
                          <Button danger icon={<DeleteOutlined />} onClick={() => removeOption(questionIndex, optionIndex, values, setValues)} disabled={question.options.length === 2} size="small" />
                        </div>
                      ))}
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Correct Answer{question.type === 'multiple_choice' ? 's' : ''} *</label>
                        {question.type === 'mcq' ? (
                          <Select value={question.correctAnswer} onChange={(v) => updateQuestionField(questionIndex, 'correctAnswer', v, values, setValues)} className="w-full" placeholder="Select correct answer">
                            {question.options.map((opt, i) => <Option key={i} value={opt} disabled={!opt.trim()}>{opt || `Option ${i + 1}`}</Option>)}
                          </Select>
                        ) : (
                          <Select mode="multiple" value={question.correctAnswers} onChange={(v) => updateQuestionField(questionIndex, 'correctAnswers', v, values, setValues)} className="w-full" placeholder="Select correct answers">
                            {question.options.map((opt, i) => <Option key={i} value={opt} disabled={!opt.trim()}>{opt || `Option ${i + 1}`}</Option>)}
                          </Select>
                        )}
                      </div>
                    </div>
                  )}
                  {question.type === 'coding' && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center text-blue-700 dark:text-blue-300 mb-2">
                        <ThunderboltOutlined className="mr-2" />
                        <span className="font-semibold">Coding Challenge Setup</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">AI will automatically evaluate the logic, complexity, and correctness of submitted code for this question.</p>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Initial/Boilerplate Code</label>
                        <TextArea
                          value={question.initialCode}
                          onChange={(e) => updateQuestionField(questionIndex, 'initialCode', e.target.value, values, setValues)}
                          rows={4}
                          className="font-mono text-xs"
                          placeholder="function solution() {\n  // Your code here\n}"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Button type="dashed" icon={< PlusOutlined />} onClick={() => addQuestion(values, setValues)} className="w-full h-12">Add Manual Question</Button>
              {errors.questions && typeof errors.questions === 'string' && <div className="text-red-500 text-sm mt-2">{errors.questions}</div>}
            </Card>

            <div className="flex justify-between">
              <Button icon={<EyeOutlined />} onClick={() => { setPreviewData(values); setPreviewVisible(true); }}>Preview</Button>
              <Space>
                <Button onClick={() => navigate('/manage-assessments')}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>Create Assessment</Button>
              </Space>
            </div>

            <Modal
              title={
                <div className="flex justify-between items-center pr-8">
                  <div className="flex items-center"><RobotOutlined className="mr-2 text-indigo-600" /> AI Question Generator</div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setShowKeyEditor(!showKeyEditor)}
                    className="text-gray-500 hover:text-indigo-600"
                  >
                    {showKeyEditor ? 'Back to Generator' : 'Key Settings'}
                  </Button>
                </div>
              }
              open={aiModalVisible}
              onCancel={() => {
                setAiModalVisible(false);
                setShowKeyEditor(false);
              }}
              footer={showKeyEditor ? [
                <Button key="close" onClick={() => setShowKeyEditor(false)}>Cancel</Button>,
                <Button key="save" type="primary" loading={keySaving} onClick={handleSaveKey}>Save My Key</Button>
              ] : [
                <Button key="cancel" onClick={() => { setAiModalVisible(false); setShowKeyEditor(false); }}>Cancel</Button>,
                <Button
                  key="generate"
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  loading={aiLoading}
                  onClick={() => handleAIGenerate(values, setValues)}
                  className="bg-indigo-600"
                >
                  Generate & Preview
                </Button>
              ]}
            >
              {showKeyEditor ? (
                <div className="py-6">
                  <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
                    <p className="text-sm text-indigo-800 mb-0">
                      <strong>Bring Your Own Key (BYOK)</strong>: Enter your personal Google Gemini API Key. This key will be stored securely and used for all your AI generations, ensuring you use your own credits.
                    </p>
                  </div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Google Gemini API Key</label>
                  <Input.Password
                    placeholder="Enter your AIza... key"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">Find your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Google AI Studio</a></p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Topic / Specific Subject</label>
                    <Input
                      placeholder="e.g., React Hooks, Python Data Structures, World War II"
                      value={aiParams.topic}
                      onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Question Type</label>
                      <Select value={aiParams.type} onChange={(v) => setAiParams({ ...aiParams, type: v })} className="w-full">
                        <Option value="mcq">Multiple Choice</Option>
                        <Option value="coding">Coding Challenges</Option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Number of Questions</label>
                      <InputNumber min={1} max={20} value={aiParams.count} onChange={(v) => setAiParams({ ...aiParams, count: v })} className="w-full" />
                    </div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center text-indigo-700 dark:text-indigo-300 mb-2">
                      <EyeOutlined className="mr-2" />
                      <span className="font-semibold text-sm">Interactive Preview Enabled</span>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      The AI will generate questions for you to review and edit here. Nothing is saved until you are satisfied.
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-700 text-xs">
                    <strong>Pro Tip:</strong> Questions are generated based on the overall assessment difficulty ({values.difficulty}) and passing score ({values.passingScore}%).
                  </div>
                </div>
              )}
            </Modal>
          </Form>
        )}
      </Formik>

      <Modal title="Assessment Preview" open={previewVisible} onCancel={() => setPreviewVisible(false)} width={800} footer={[<Button key="close" onClick={() => setPreviewVisible(false)}>Close</Button>]}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{previewData?.title}</h2>
          <p className="text-gray-600">{previewData?.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Subject: {previewData?.subject}</div>
            <div>Type: {previewData?.type}</div>
            <div>Duration: {previewData?.duration} minutes</div>
            <div>Passing Score: {previewData?.passingScore}%</div>
          </div>
          <Divider />
          <h3 className="font-bold">Questions ({previewData?.questions?.length})</h3>
          {previewData?.questions?.map((q, i) => (
            <Card key={i} size="small" className="mb-3">
              <div className="font-medium">{i + 1}. {q.question} ({q.points} pts)</div>
              {(q.type === 'mcq' || q.type === 'multiple_choice') && q.options && (
                <ul className="text-sm ml-4 mt-2">
                  {q.options.map((opt, oi) => (
                    <li key={oi} className={q.correctAnswer === opt || (q.correctAnswers || []).includes(opt) ? 'text-green-600 font-medium' : ''}>{opt}</li>
                  ))}
                </ul>
              )}
              {q.type === 'coding' && (
                <div className="mt-2 text-xs font-mono bg-gray-50 p-2 rounded border">
                  Coding Challenge Initialized
                </div>
              )}
            </Card>
          ))}
        </div>
      </Modal>
    </div >
  );
};

export default CreateAssessment;