import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Layout } from 'antd';
import {
    RocketOutlined,
    SafetyCertificateOutlined,
    BarChartOutlined,
    TeamOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { Code, BookOpen, Users, Zap, Mail, Phone, MapPin, Play, Star, ExternalLink, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import Navbar from '../components/common/Navbar';

const { Content, Footer } = Layout;

const Landing = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

    const handleAuthRedirect = (e) => {
        e.preventDefault();
        if (isLogin) {
            navigate('/login');
        } else {
            navigate('/signup');
        }
    };

    const handleContactSubmit = (e) => {
        e.preventDefault();
        const { name, email, message } = contactForm;
        const mailtoLink = `mailto:admin@smartassessment.com?subject=Contact from ${name}&body=${message}%0D%0A%0D%0AFrom: ${email}`;
        window.open(mailtoLink);
        setContactForm({ name: '', email: '', message: '' });
    };

    return (
        <Layout className="min-h-screen bg-white dark:bg-gray-900">
            <Navbar />

            <Content>
                {/* Hero Section - WebWeave Style but SAS Theme (Blue/Indigo) */}
                <section className="py-24 relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                    <div className="absolute inset-0 opacity-10">
                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                        </svg>
                    </div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            <div className="relative z-10">
                                <div className="flex items-center space-x-2 mb-6">
                                    <Sparkles className="h-6 w-6 text-yellow-400" />
                                    <span className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Modern Assessment Platform</span>
                                </div>
                                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
                                    <span className="text-white">Smart.</span>
                                    <br />
                                    <span className="text-blue-300">Secure.</span>
                                    <br />
                                    <span className="text-purple-300">Scalable.</span>
                                </h2>
                                <p className="text-lg sm:text-xl text-blue-100 mb-8 leading-relaxed">
                                    Your all-in-one destination for <span className="font-semibold text-white">secure, interactive, and efficient evaluations</span>.
                                    Deploy assessments with AI-powered assistance, real-time proctoring, and comprehensive analytics.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                    <button
                                        onClick={() => document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-500 text-white rounded-full hover:bg-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                    >
                                        <span className="font-semibold text-lg">Get Started Free</span>
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                    <a
                                        href="#features"
                                        className="flex items-center justify-center space-x-2 px-8 py-4 border-2 border-white text-white rounded-full hover:bg-white/10 transition-all duration-300 text-center text-lg"
                                    >
                                        <Play className="h-5 w-5" />
                                        <span className="font-semibold">Watch Demo</span>
                                    </a>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-blue-800">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">100%</div>
                                        <div className="text-sm text-blue-200">Secure</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">AI</div>
                                        <div className="text-sm text-blue-200">Powered</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">24/7</div>
                                        <div className="text-sm text-blue-200">Available</div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Auth Portal (WebWeave Login Box Style) */}
                            <div id="auth-form" className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl relative text-gray-900">
                                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                    PORTAL
                                </div>

                                <div className="flex mb-6">
                                    <button
                                        onClick={() => setIsLogin(true)}
                                        className={`flex-1 py-3 text-center rounded-l-xl transition-all duration-300 font-semibold ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => setIsLogin(false)}
                                        className={`flex-1 py-3 text-center rounded-r-xl transition-all duration-300 font-semibold ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Register
                                    </button>
                                </div>

                                <form onSubmit={handleAuthRedirect} className="space-y-4">
                                    <div className="text-center pb-4 text-gray-600">
                                        Access your dashboard by proceeding to our secure portal.
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-bold shadow-lg text-lg flex justify-center items-center"
                                    >
                                        {isLogin ? 'Proceed to Login' : 'Create Free Account'} <ArrowRight className="ml-2 h-5 w-5" />
                                    </button>
                                </form>

                                <p className="text-xs text-gray-500 text-center mt-6">
                                    By proceeding, you agree to our Platform Integrity Guidelines.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section - WebWeave Grid with SAS styling */}
                <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                                <Star className="h-6 w-6 text-blue-500" />
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Enterprise-Grade Architecture</span>
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Powerful Features</h3>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                                Everything you need to evaluate, monitor, and master certification programs in one platform.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-white dark:bg-gray-700 text-center p-8 border-t-4 border-blue-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    <SafetyCertificateOutlined className="text-4xl text-blue-600 dark:text-blue-300" />
                                </div>
                                <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Generation</h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">Intelligent question generation based on difficulty parameters and category specifications.</p>
                                <div className="mt-6 flex items-center justify-center">
                                    <CheckCircleOutlined className="text-green-500 mr-2 text-lg" />
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Automatic Variation</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-700 text-center p-8 border-t-4 border-purple-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2">
                                <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    <BarChartOutlined className="text-4xl text-purple-600 dark:text-purple-300" />
                                </div>
                                <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Anomaly Detection</h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">Real-time behavioral analysis tracks tab switches and copy-paste events to ensure exam integrity.</p>
                                <div className="mt-6 flex items-center justify-center">
                                    <CheckCircleOutlined className="text-green-500 mr-2 text-lg" />
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Live Dashboard</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-700 text-center p-8 border-t-4 border-indigo-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2">
                                <div className="p-4 bg-indigo-100 dark:bg-indigo-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    <TeamOutlined className="text-4xl text-indigo-600 dark:text-indigo-300" />
                                </div>
                                <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Performance Analytics</h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">Track cohort progress with detailed breakdowns, automated grading, and comprehensive ranking systems.</p>
                                <div className="mt-6 flex items-center justify-center">
                                    <CheckCircleOutlined className="text-green-500 mr-2 text-lg" />
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Deep Metrics</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-700 text-center p-8 border-t-4 border-cyan-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2">
                                <div className="p-4 bg-cyan-100 dark:bg-cyan-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    <Zap className="text-4xl text-cyan-600 dark:text-cyan-300" />
                                </div>
                                <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">AI Assistant</h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">Instantly review test compositions and detect collusions using integrated AI evaluation protocols.</p>
                                <div className="mt-6 flex items-center justify-center">
                                    <CheckCircleOutlined className="text-green-500 mr-2 text-lg" />
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Auto-Flagging</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section - WebWeave layout */}
                <section id="about" className="py-24 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">About SAS Platform</h3>
                            <div className="w-24 h-1 bg-blue-500 mx-auto mb-8 rounded-full"></div>
                        </div>

                        <div className="text-center mb-16">
                            <p className="text-2xl text-gray-700 dark:text-gray-200 mb-6 font-light leading-relaxed">
                                Welcome to <span className="font-bold text-blue-600 dark:text-blue-400">Smart Assessment System</span> – your secure destination for modern evaluations.
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
                                Designed from the ground up to support universities, corporations, and modern certification bodies, providing reliable exam environments worldwide.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-blue-100 dark:border-gray-700">
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <CheckCircle className="h-6 w-6 mr-3 text-blue-500" />
                                    Architectural Features
                                </h4>
                                <ul className="space-y-6">
                                    <li className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                            <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">Dynamic UI routing with React</span>
                                    </li>
                                    <li className="flex items-center space-x-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                                            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">Socket.IO real-time behavioral streams</span>
                                    </li>
                                    <li className="flex items-center space-x-4">
                                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">Immutable Audit Logs</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-10 rounded-2xl shadow-xl flex flex-col justify-center">
                                <h4 className="text-3xl font-bold mb-6 flex items-center">
                                    <Star className="h-8 w-8 mr-3 text-yellow-400" />
                                    Our Mission
                                </h4>
                                <p className="text-blue-100 leading-relaxed text-xl mb-8">
                                    To bridge the gap between testing security and accessibility.
                                    We believe in providing unbreakable assessment environments that are simultaneously user-friendly and highly scalable.
                                </p>
                                <div className="pt-6 border-t border-blue-700">
                                    <p className="text-yellow-400 font-bold text-lg">
                                        Secure. Reliable. Instant.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section - WebWeave Layout */}
                <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Get In Touch</h3>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Ready to deploy your next assessment? Let's connect.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Contact Form */}
                            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600">
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <Mail className="h-6 w-6 mr-3 text-blue-500" />
                                    Contact Sales / Support
                                </h4>
                                <form onSubmit={handleContactSubmit} className="space-y-5">
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 dark:bg-gray-800 dark:text-white"
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Your Work Email"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 dark:bg-gray-800 dark:text-white"
                                        required
                                    />
                                    <textarea
                                        placeholder="How can we help?"
                                        rows={4}
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 dark:bg-gray-800 dark:text-white resize-none"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-bold shadow-lg text-lg"
                                    >
                                        Send Inquiry
                                    </button>
                                </form>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-8 flex flex-col justify-center">
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contact Information</h4>

                                <div className="space-y-6">
                                    <div className="flex items-center space-x-6 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                                            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Email</h5>
                                            <p className="text-gray-600 dark:text-gray-300">contact@smartassessment.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                                            <Phone className="h-6 w-6 text-green-600 dark:text-green-300" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Sales Phone</h5>
                                            <p className="text-gray-600 dark:text-gray-300">+1 800 555-TEST</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                                            <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Headquarters</h5>
                                            <p className="text-gray-600 dark:text-gray-300">San Francisco, CA</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Content>

            {/* SAS Footer */}
            <Footer className="text-center bg-gray-900 text-gray-500 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-6 flex justify-center">
                        <span className="text-3xl font-extrabold text-white tracking-widest">SAS</span>
                    </div>
                    <p className="text-lg mb-2 text-gray-400">© 2026 Smart Assessment System. All Rights Reserved.</p>
                    <p className="text-sm opacity-50 tracking-widest uppercase">Intelligent. Secure. Smart.</p>
                </div>
            </Footer>
        </Layout>
    );
};

export default Landing;
