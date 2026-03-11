import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Radio, Checkbox, Progress, Modal, Space, Typography, Spin, Tag, Alert } from 'antd';
import {
  ClockCircleOutlined, LeftOutlined, RightOutlined, SaveOutlined,
  WarningOutlined, EyeInvisibleOutlined, CheckSquareOutlined,
  PlayCircleOutlined, MessageOutlined, FileTextOutlined, CodeOutlined,
  CloseOutlined, SendOutlined, RobotOutlined, FileAddOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Editor from '@monaco-editor/react';
import { compileCodeLocally } from '../../services/localCompiler';
import { assessmentAPI, submissionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import axios from 'axios';

const { Title, Text } = Typography;

const AssessmentInterface = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || { difficulty: 'medium', timerEnabled: true, questionLimit: 10 };
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(config.difficulty || 'medium');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [assessment, setAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const submitCalledRef = useRef(false);

  const [isStarted, setIsStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const startTimeRef = useRef(null);

  // Behavioral Telemetry State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPastes, setCopyPastes] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [anomalyWarnings, setAnomalyWarnings] = useState([]);
  const sessionStartIp = useRef(null);

  // Per-Question Time Tracking
  const [questionTimes, setQuestionTimes] = useState({});
  const questionStartTime = useRef(Date.now());

  // Keystroke Dynamics
  const keystrokeTimings = useRef([]); // dwell times per key
  const lastKeyDown = useRef(null);

  // WebWeave Feature: Local Execution & Tools State
  const [executionOutput, setExecutionOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'notes', 'ai'
  const [notes, setNotes] = useState('');
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [fingerprint, setFingerprint] = useState(null);
  const [scrollStats, setScrollStats] = useState({ count: 0, lastPos: 0, velocity: 0 });

  // ─── Reading Pattern Analysis (Innovation Phase 2) ──────────────────────
  useEffect(() => {
    if (!isStarted) return;
    const handleScroll = () => {
      const currentPos = window.scrollY;
      const time = Date.now();
      const dist = Math.abs(currentPos - scrollStats.lastPos);
      setScrollStats(prev => ({
        count: prev.count + 1,
        lastPos: currentPos,
        velocity: dist // Simplified velocity
      }));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isStarted, scrollStats.lastPos]);

  // ─── Canvas Fingerprinting (Innovation Phase 2) ──────────────────────────
  // Hardware Clock Drift Detection
  const measureClockDrift = () => {
    const start = performance.now();
    let x = 0;
    // Tight loop to create a heat signature/timing baseline
    for (let i = 0; i < 1000000; i++) { x += Math.sqrt(i); }
    const end = performance.now();
    return end - start;
  };

  const getCanvasFingerprint = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const txt = 'Antigravity-Audit-Fingerprint';
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText(txt, 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText(txt, 4, 17);

      const drift = measureClockDrift();
      return `${canvas.toDataURL()}_drift:${drift.toFixed(4)}`;
    } catch (e) {
      return `fp_error_${Date.now()}`;
    }
  };

  useEffect(() => {
    setFingerprint(getCanvasFingerprint());
  }, [getCanvasFingerprint]);

  // ─── Enhanced Keystroke Dynamics (Gap Analysis 3) ────────────────────────
  const handleKeyDown = (e) => {
    const now = Date.now();
    lastKeyDown.current = { key: e.key, time: now };
  };

  const handleKeyUp = (e) => {
    if (!lastKeyDown.current || lastKeyDown.current.key !== e.key) return;
    const now = Date.now();
    const dwellTime = now - lastKeyDown.current.time;
    keystrokeTimings.current.push({
      key: e.key,
      dwell: dwellTime,
      timestamp: now
    });
    // Keep last 100 for memory efficiency
    if (keystrokeTimings.current.length > 100) {
      keystrokeTimings.current.shift();
    }
  };

  const handleRunCode = async (code, qId) => {
    setIsExecuting(true);
    setExecutionOutput('Executing code...');
    try {
      const q = assessment.questions.find(q => q._id === qId);
      const input = q?.testCases?.[0]?.input || ''; // Use first test case as sample input
      const result = await compileCodeLocally({
        language: q?.language || 'javascript',
        code,
        input
      });

      let outputText = result.error ? `❌ Error:\n${result.error}` : `✅ Output:\n${result.output}`;
      if (result.executionTime) outputText += `\n\n⏱️ Execution Time: ${result.executionTime.toFixed(2)}ms`;

      setExecutionOutput(outputText);
    } catch (err) {
      setExecutionOutput(`❌ Execution Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // ─── Fullscreen Management ────────────────────────────────────────────────
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && isStarted && !submitCalledRef.current) {
        setAnomalyWarnings(w => [...w, {
          type: 'exit_fullscreen',
          message: `User exited fullscreen mode at ${new Date().toLocaleTimeString()}`,
          severity: 'high'
        }]);
        toast.error('🚨 Fullscreen mode is required. Please re-enter.', { autoClose: false, closeOnClick: true });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isStarted]);

  // ─── Behavioral Event Listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!isStarted) return;

    // Tab Visibility Detection
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        setIsTabVisible(false);
        try {
          await axios.post('http://localhost:5000/api/telemetry/event', { assessmentId: id === 'ai' ? 'ai-generated' : (assessment._id || id), action: 'TAB_SWITCH', details: { timestamp: new Date() } }, { withCredentials: true });
        } catch (e) { console.error('Failed to log telemetry', e) }

        toast.warning(`⚠️ Tab Switch Detected! Event Logged.`, { autoClose: 2000 });
      } else {
        setIsTabVisible(true);
      }
    };

    // Window Blur Detection (Aggressive Tab Switch)
    const handleWindowBlur = () => {
      if (!submitCalledRef.current) {
        setTabSwitches(prev => prev + 1);
        setIsTabVisible(false);
      }
    };

    // Proctoring Lock: Block Copy, Paste, and Cut
    const handleClipboardCapture = async (e) => {
      e.preventDefault();
      const action = e.type.toUpperCase();
      setCopyPastes(prev => prev + 1);

      try {
        await axios.post('http://localhost:5000/api/telemetry/event', { assessmentId: id === 'ai' ? 'ai-generated' : (assessment._id || id), action: 'COPY_PASTE', details: { type: action, timestamp: new Date() } }, { withCredentials: true });
      } catch (e) { console.error('Failed to log telemetry', e) }

      toast.error(`🚨 ${action} Action Blocked! Proctoring policy active & logged.`, { autoClose: 2500 });
    };

    // Keystroke Dynamics - These are now handled on the main div
    // const handleKeyDown = (e) => {
    //   lastKeyDown.current = { key: e.key, time: Date.now() };
    // };
    // const handleKeyUp = (e) => {
    //   if (lastKeyDown.current && lastKeyDown.current.key === e.key) {
    //     const dwell = Date.now() - lastKeyDown.current.time;
    //     keystrokeTimings.current.push({ key: e.key, dwell });
    //     lastKeyDown.current = null;
    //   }
    // };

    // Proctoring Lock: Prevent Browser Navigation (Back/Forward)
    const blockNavigation = () => {
      window.history.pushState(null, null, window.location.href);
    };

    // Proctoring Lock: Exit Warning
    const handleBeforeUnload = (e) => {
      if (!submitCalledRef.current) {
        e.preventDefault();
        e.returnValue = ''; // Trigger browser confirmation dialog
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('paste', handleClipboardCapture);
    document.addEventListener('copy', handleClipboardCapture);
    document.addEventListener('cut', handleClipboardCapture);
    // document.addEventListener('keydown', handleKeyDown); // Moved to main div
    // document.addEventListener('keyup', handleKeyUp); // Moved to main div
    window.addEventListener('popstate', blockNavigation);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial history state to block back button
    window.history.pushState(null, null, window.location.href);

    // Prevent right-click context menu
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Phase 4: Interactive AI Proctor (Crisis Management)
    const proctorInterval = setInterval(() => {
      const liveRisk = (tabSwitches * 5) + (copyPastes * 8);
      if (liveRisk > 40 && !submitCalledRef.current) {
        Modal.warning({
          title: '🚨 AI Proctor Message',
          content: 'I noticed significant unusual activity. Please maintain focus on the assessment to avoid automatic disqualification.',
          okText: 'Understood'
        });
        // Reset risk slightly so modal doesn't spam
        setTabSwitches(0);
        setCopyPastes(0);
      }
    }, 10000);

    return () => {
      clearInterval(proctorInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('paste', handleClipboardCapture);
      document.removeEventListener('copy', handleClipboardCapture);
      document.removeEventListener('cut', handleClipboardCapture);
      // document.removeEventListener('keydown', handleKeyDown);
      // document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('popstate', blockNavigation);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', e => e.preventDefault());
    };
  }, [isStarted]);

  // Per-question time tracking: record time when question changes
  const recordQuestionTime = useCallback((qId) => {
    const elapsed = (Date.now() - questionStartTime.current) / 1000; // seconds
    setQuestionTimes(prev => ({
      ...prev,
      [qId]: (prev[qId] || 0) + elapsed
    }));
    questionStartTime.current = Date.now();
  }, []);

  const handleQuestionChange = (newIndex) => {
    const currentQId = assessment?.questions[currentQuestionIndex]?._id;
    if (currentQId) recordQuestionTime(currentQId);
    setCurrentQuestionIndex(newIndex);
    questionStartTime.current = Date.now();
  };

  // ─── Assessment Loading ────────────────────────────────────────────────────
  useEffect(() => {
    if (config.mode === 'ai-generated' && config.aiQuestions) {
      const questions = config.aiQuestions.map((q, idx) => ({
        ...q,
        _id: q._id || `ai_${idx}`,
        points: q.points || 10
      }));
      const aiAssessment = {
        _id: 'ai-generated',
        title: 'AI Generated Assessment',
        duration: questions.length * 2, // 2 minutes per question default
        questions: questions
      };
      setAssessment(aiAssessment);
      // Logic for AI quiz duration
      if (config.timerEnabled) setTimeLeft(questions.length * 60); // 1 min per question by default
      const init = {};
      questions.forEach(q => {
        if (q.type === 'multiple_choice') init[q._id] = [];
        else if (q.type === 'coding') init[q._id] = q.initialCode || '';
        else init[q._id] = '';
      });
      setAnswers(init);
      setIsStarted(true); // Automatically start AI generated assessments
      startTimeRef.current = Date.now();
      questionStartTime.current = Date.now();
      setLoading(false);
      return;
    }

    assessmentAPI.getById(id)
      .then(res => {
        let questions = res.data.questions || [];

        // Mode-specific question filtering (Adaptive Difficulty)
        if (config.mode === 'standard' && config.difficulty) {
          questions = questions.filter(q => q.difficulty === config.difficulty);
        }

        if (config.questionLimit) questions = questions.slice(0, config.questionLimit);

        const enrichedAssessment = { ...res.data, questions };
        setAssessment(enrichedAssessment);

        if (config.timerEnabled) setTimeLeft(res.data.duration * 60);

        const init = {};
        questions.forEach(q => {
          if (q.type === 'multiple_choice') init[q._id] = [];
          else if (q.type === 'coding') init[q._id] = q.initialCode || '';
          else init[q._id] = '';
        });
        setAnswers(init);
      })
      .catch(() => toast.error('Failed to load assessment'))
      .finally(() => setLoading(false));
  }, [id, config.mode, config.aiQuestions, config.questionLimit, config.timerEnabled, config.difficulty]);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && assessment && config.timerEnabled && isStarted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handleSubmit(true); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, assessment, config.timerEnabled, isStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setIsStarted(true);
    startTimeRef.current = Date.now();
    questionStartTime.current = Date.now();
    enterFullscreen();
  };

  // Compute keystroke dynamics summary
  const getKeystrokeSummary = () => {
    if (keystrokeTimings.current.length === 0) return null;
    const dwells = keystrokeTimings.current.map(k => k.dwell);
    const mean = dwells.reduce((a, b) => a + b, 0) / dwells.length;
    return { mean: Math.round(mean), samples: dwells.length };
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (isSubmitting || submitCalledRef.current) return;
    submitCalledRef.current = true;
    setIsSubmitting(true);

    // Record time for last question
    const lastQId = assessment?.questions[currentQuestionIndex]?._id;
    if (lastQId) recordQuestionTime(lastQId);

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }

      const submissionData = {
        assessmentId: id === 'ai' ? 'ai-generated' : (assessment._id || id),
        answers,
        timeTaken: Math.round((Date.now() - startTimeRef.current) / 1000),
        questions: id === 'ai' ? assessment.questions : undefined,
        anomalyData: {
          tabSwitches,
          copyPastes,
          questionTimes,
          fingerprint,
          keystrokeDynamics: keystrokeTimings.current,
          sessionStartIp: sessionStartIp.current || 'client',
          warnings: anomalyWarnings
        }
      };

      const res = await submissionAPI.submit(submissionData);

      // Phase 3: Verifiable Result Hash
      const resultHash = btoa(JSON.stringify({
        id: res.data._id,
        root: fingerprint,
        score: res.data.percentage
      })).slice(0, 32);

      // Submit Telemetry and Calculate Exam DNA
      try {
        await axios.post('http://localhost:5000/api/telemetry/submit-exam', {
          assessmentId: id === 'ai' ? 'ai-generated' : (assessment._id || id),
          submissionId: res.data._id,
          typingCadence: keystrokeTimings.current,
          submissionTimings: Object.entries(questionTimes).map(([qId, timeTaken]) => ({ questionId: qId, timeTakenMs: timeTaken * 1000 }))
        }, { withCredentials: true });
      } catch (e) {
        console.error('Failed to submit exam telemetry', e);
      }

      toast.success(autoSubmit ? 'Time expired! Submitted automatically.' : 'Assessment submitted successfully!');
      navigate(`/assessment-result/${res.data._id}`, { state: { verificationCode: resultHash } });
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

  // Compute live risk indicator
  const liveRisk = (tabSwitches * 5) + (copyPastes * 8);
  const riskColor = liveRisk >= 30 ? 'error' : liveRisk >= 15 ? 'warning' : 'success';

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 relative"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex="0" // Make div focusable for keyboard events
    >
      {/* Start Test Overlay */}
      {!isStarted && (
        <div className="fixed inset-0 z-[10000] bg-indigo-900/95 backdrop-blur-lg flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full">
            <Title level={2} className="text-white !mb-4">Ready to start the assessment?</Title>
            <div className="text-left bg-black/20 p-6 rounded-xl mb-8 space-y-4">
              <h3 className="text-indigo-300 font-bold uppercase tracking-wider text-sm flex items-center">
                <WarningOutlined className="mr-2" /> Proctoring Rules & Security
              </h3>
              <ul className="space-y-2 text-gray-200">
                <li className="flex items-center"><CheckSquareOutlined className="mr-2 text-green-400" /> Fullscreen mode will be enabled</li>
                <li className="flex items-center"><CheckSquareOutlined className="mr-2 text-green-400" /> Tab switching and navigation are blocked</li>
                <li className="flex items-center"><CheckSquareOutlined className="mr-2 text-green-400" /> Copying and pasting are disabled</li>
                <li className="flex items-center"><CheckSquareOutlined className="mr-2 text-green-400" /> Behavioral anomalies are tracked in real-time</li>
              </ul>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={handleStartTest}
              className="h-14 px-12 text-lg font-bold bg-indigo-500 hover:bg-indigo-400 border-none rounded-xl"
            >
              Start Assessment Now
            </Button>
            <p className="mt-4 text-indigo-200/60 text-xs">By clicking Start, you agree to the proctoring policy.</p>
          </div>
        </div>
      )}

      {/* Fullscreen Required Overlay */}
      {isStarted && !isFullscreen && !submitCalledRef.current && (
        <div className="fixed inset-0 z-[9999] bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
          <WarningOutlined className="text-6xl text-white mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold mb-4">FULLSCREEN MODE REQUIRED</h2>
          <p className="text-xl text-red-100 max-w-lg mb-8">
            This assessment must be taken in fullscreen mode to ensure integrity.
            Exiting fullscreen is recorded as a security anomaly.
          </p>
          <Button
            type="primary"
            size="large"
            onClick={enterFullscreen}
            className="h-14 px-8 font-bold bg-white text-red-600 hover:bg-gray-100 border-none rounded-xl"
          >
            Re-enter Fullscreen
          </Button>
        </div>
      )}

      {/* Proctoring Lock Layer */}
      {isStarted && !isTabVisible && isFullscreen && (
        <div className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
          <EyeInvisibleOutlined className="text-6xl text-amber-500 mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2 text-white">PROCTORING ALERT: FOCUS LOST</h2>
          <p className="text-xl text-gray-300 max-w-lg">
            Window focus lost or tab switch detected.
            This action has been logged and your risk score has increased.
          </p>
          <div className="mt-8 bg-amber-900/30 border border-amber-500 p-4 rounded-lg">
            <p className="text-amber-400 font-mono">Telemetry Logged: TAB_SWITCH_EVENT</p>
          </div>
          <Button
            type="primary"
            size="large"
            className="mt-8 h-12 px-8 font-bold uppercase tracking-wider bg-amber-600 border-none"
            onClick={() => setIsTabVisible(true)}
          >
            I Acknowledge and Resume Test
          </Button>
        </div>
      )}
      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{assessment.title}</h1>
            <p className="text-gray-600 text-sm">Question {currentQuestionIndex + 1} of {assessment.questions.length}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Live Risk Indicator */}
            <div className="flex items-center gap-1 text-xs">
              <WarningOutlined className="text-gray-400" />
              <span className="text-gray-500">Live Risk:</span>
              <Tag color={riskColor === 'error' ? 'red' : riskColor === 'warning' ? 'orange' : 'green'} className="text-xs">
                {liveRisk} pts
              </Tag>
            </div>
            {/* Tab Visibility Indicator */}
            {!isTabVisible && (
              <Tag color="red" icon={<EyeInvisibleOutlined />}>Tab Away!</Tag>
            )}
            {config.timerEnabled && (
              <div className="flex items-center space-x-2">
                <ClockCircleOutlined className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-orange-500'} />
                <span className={`font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
            <Button icon={<SaveOutlined />} size="small" onClick={() => toast.info('Progress saved!')}>Save</Button>
          </div>
        </div>

        {/* Anomaly Alerts */}
        {(tabSwitches > 0 || copyPastes > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tabSwitches > 0 && (
              <Tag color="orange" icon={<WarningOutlined />} className="text-xs">
                {tabSwitches} Tab Switch{tabSwitches > 1 ? 'es' : ''} Detected
              </Tag>
            )}
            {copyPastes > 0 && (
              <Tag color="red" icon={<WarningOutlined />} className="text-xs">
                {copyPastes} Paste Action{copyPastes > 1 ? 's' : ''} Detected
              </Tag>
            )}
          </div>
        )}

        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-blue-600 font-semibold">Progress</span>
            <span className="text-gray-500">{answeredCount}/{assessment.questions.length} answered</span>
          </div>
          <Progress percent={progress} showInfo={false} strokeColor="#3b82f6" trailColor="#e5e7eb" />
        </div>
      </div>

      <div className="flex">
        {/* ─── Main Question Area ───────────────────────────────────────── */}
        <div className="flex-1 p-6">
          <Card className="mb-6">
            <div className="space-y-6">
              <div className="flex items-start justify-between select-none">
                <Title level={4} className="flex-1">{currentQuestion.question}</Title>
                <Tag>{currentQuestion.difficulty || 'Medium'}</Tag>
              </div>

              {currentQuestion.type === 'mcq' && (
                <Radio.Group
                  value={answers[currentQuestion._id]}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: e.target.value }))}
                  className="w-full"
                >
                  <Space direction="vertical" className="w-full">
                    {currentQuestion.options.map((option, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all border-2 ${answers[currentQuestion._id] === option
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion._id]: option }))}
                      >
                        <Radio value={option} className="w-full text-base">{option}</Radio>
                      </Card>
                    ))}
                  </Space>
                </Radio.Group>
              )}

              {currentQuestion.type === 'multiple_choice' && (
                <Checkbox.Group
                  value={answers[currentQuestion._id] || []}
                  onChange={(vals) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: vals }))}
                  className="w-full"
                >
                  <Space direction="vertical" className="w-full">
                    {currentQuestion.options.map((option, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer ${(answers[currentQuestion._id] || []).includes(option) ? 'border-blue-500 bg-blue-50' : ''}`}
                      >
                        <Checkbox value={option} className="w-full">{option}</Checkbox>
                      </Card>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}

              {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'long_answer') && (
                <ReactQuill
                  theme="snow"
                  value={answers[currentQuestion._id] || ''}
                  onChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: val }))}
                  placeholder="Type your answer here..."
                  className="bg-white"
                />
              )}

              {currentQuestion.type === 'coding' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 font-mono flex items-center gap-2">
                      <CodeOutlined /> {currentQuestion.language || 'javascript'}
                    </span>
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleRunCode(answers[currentQuestion._id], currentQuestion._id)}
                      loading={isExecuting}
                      className="bg-green-600 hover:bg-green-500 border-none rounded-lg"
                    >
                      Run Code
                    </Button>
                  </div>

                  <div className="bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl">
                    <Editor
                      height="400px"
                      language={currentQuestion.language || 'javascript'}
                      value={answers[currentQuestion._id] || ''}
                      onChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: val }))}
                      theme="vs-dark"
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        roundedSelection: true,
                        scrollbar: { verticalScrollbarSize: 8 },
                      }}
                    />
                  </div>

                  {executionOutput && (
                    <div className="mt-4 bg-black rounded-xl p-4 border border-green-500/30 shadow-2xl">
                      <div className="flex justify-between text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="flex items-center gap-2"><CodeOutlined /> Terminal Output</span>
                        <Button
                          type="text"
                          size="small"
                          className="text-gray-500 hover:text-white"
                          onClick={() => setExecutionOutput('')}
                        >
                          Clear
                        </Button>
                      </div>
                      <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                        <span className="text-blue-400">user@uap:~$ </span>
                        {executionOutput}
                      </pre>
                    </div>
                  )}

                  {currentQuestion.testCases && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <h5 className="font-bold mb-2 flex items-center gap-2">
                        <FileTextOutlined /> Sample Test Case
                      </h5>
                      {currentQuestion.testCases.slice(0, 1).map((tc, idx) => (
                        <div key={idx} className="text-xs font-mono space-x-4 bg-white/50 dark:bg-black/20 p-2 rounded">
                          <span className="text-indigo-600 font-bold">Input:</span>
                          <span className="text-gray-700 dark:text-gray-300">{tc.input || 'N/A'}</span>
                          <span className="text-green-600 font-bold ml-4">Expected:</span>
                          <span className="text-gray-700 dark:text-gray-300">{tc.expectedOutput}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Time on this question: {Math.round((questionTimes[currentQuestion._id] || 0))}s</span>
                <Text type="secondary">Points: {currentQuestion.points || currentQuestion.marks}</Text>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              onClick={() => handleQuestionChange(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              icon={<LeftOutlined />}
            >
              Previous
            </Button>
            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button type="primary" onClick={() => setShowSubmitModal(true)} loading={isSubmitting}>
                Submit Assessment
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => handleQuestionChange(currentQuestionIndex + 1)}
                icon={<RightOutlined />}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* ─── Sidebar ───────────────────────────────────────────────────── */}
        <div className="w-72 bg-white dark:bg-gray-800 border-l p-4 flex flex-col gap-4">
          <div>
            <h3 className="font-bold mb-3 text-gray-900 dark:text-white text-sm">Question Map</h3>
            <div className="grid grid-cols-5 gap-2">
              {assessment.questions.map((q, index) => {
                const answered = answers[q._id] !== '' && !(Array.isArray(answers[q._id]) && answers[q._id].length === 0);
                return (
                  <Button
                    key={q._id}
                    type={currentQuestionIndex === index ? 'primary' : 'default'}
                    shape="circle"
                    size="small"
                    style={answered && currentQuestionIndex !== index ? { backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' } : {}}
                    onClick={() => handleQuestionChange(index)}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>Current</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span>Answered</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded-full" /><span>Unanswered</span></div>
            </div>
          </div>

          {/* ─── Live Behavioral Monitor (Patent Feature) ─── */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <WarningOutlined className="text-orange-400" /> Behavior Monitor
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Tab Switches</span>
                <Tag color={tabSwitches > 2 ? 'red' : tabSwitches > 0 ? 'orange' : 'green'} className="text-xs">{tabSwitches}</Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paste Actions</span>
                <Tag color={copyPastes > 0 ? 'red' : 'green'} className="text-xs">{copyPastes}</Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Live Risk Score</span>
                <Tag color={liveRisk >= 30 ? 'red' : liveRisk > 0 ? 'orange' : 'green'} className="text-xs">{liveRisk}</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* ─── WebWeave Feature: Floating Tools & Sidebars ─── */}
        <div className="fixed bottom-8 left-8 z-[5000] flex flex-col gap-4">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<FileAddOutlined />}
            className={`shadow-2xl flex items-center justify-center h-14 w-14 ${activePanel === 'notes' ? 'bg-indigo-600' : 'bg-gray-800'}`}
            onClick={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
          />
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<RobotOutlined />}
            className={`shadow-2xl flex items-center justify-center h-14 w-14 ${activePanel === 'ai' ? 'bg-indigo-600' : 'bg-gray-800'}`}
            onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
          />
        </div>

        {/* Side Panels */}
        {activePanel && (
          <div className="fixed top-24 left-24 w-96 h-[500px] bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 z-[5001] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
              <h3 className="font-bold flex items-center gap-2 dark:text-white">
                {activePanel === 'notes' ? <><FileAddOutlined /> Personal Notes</> : <><RobotOutlined /> AI Tutor</>}
              </h3>
              <Button type="text" icon={<CloseOutlined />} onClick={() => setActivePanel(null)} />
            </div>

            <div className="flex-1 overflow-hidden p-4">
              {activePanel === 'notes' ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Draft your thoughts here... these are not submitted."
                  className="w-full h-full p-4 bg-yellow-50 dark:bg-gray-900 border-none focus:ring-0 resize-none font-medium text-gray-800 dark:text-gray-200 rounded-lg shadow-inner"
                />
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                    {aiChat.length === 0 && (
                      <div className="text-center text-gray-500 mt-10">
                        <ThunderboltOutlined style={{ fontSize: 40 }} className="mx-auto mb-2 opacity-20" />
                        <p>Ask me anything about the assessment or coding concepts!</p>
                      </div>
                    )}
                    {aiChat.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && setAiChat([...aiChat, { role: 'user', content: aiInput }])}
                      placeholder="Type your question..."
                      className="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      className="bg-indigo-600 border-none flex items-center justify-center h-9"
                      onClick={() => {
                        if (!aiInput.trim()) return;
                        setAiChat([...aiChat, { role: 'user', content: aiInput }]);
                        setAiInput('');
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Modal */}
        <Modal
          title="Submit Assessment"
          open={showSubmitModal}
          onOk={() => handleSubmit()}
          onCancel={() => setShowSubmitModal(false)}
          okText="Submit"
          confirmLoading={isSubmitting}
        >
          <div className="space-y-3">
            <p>Are you sure you want to submit?</p>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
              <p><strong>Questions Answered:</strong> {answeredCount} / {assessment.questions.length}</p>
              {config.timerEnabled && <p><strong>Time Remaining:</strong> {formatTime(timeLeft)}</p>}
            </div>
            {(tabSwitches > 0 || copyPastes > 0) && (
              <Alert
                type="warning"
                message={`${tabSwitches} tab switch(es) and ${copyPastes} paste action(s) were recorded and will be included in your submission report.`}
                showIcon
                icon={<WarningOutlined />}
              />
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AssessmentInterface;