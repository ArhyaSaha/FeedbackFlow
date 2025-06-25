import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    ThumbsUp,
    TrendingUp,
    Users,
    CheckCircle,
    Calendar,
    User,
    Plus,
    Eye,
    Sprout,
    MessageSquare,
    X,
    Clock,
    Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from './FeedbackModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ManagerHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailFeedback, setSelectedDetailFeedback] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch stats
            const statsResponse = await fetch(`${backendUrl}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsData = await statsResponse.json();
            setStats(statsData);

            // Fetch recent feedback activity
            const feedbackResponse = await fetch(`${backendUrl}/feedback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const feedbackData = await feedbackResponse.json();
            setRecentActivity(feedbackData.slice(0, 5)); // Get latest 5

            // Fetch team members
            const teamResponse = await fetch(`${backendUrl}/team`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const teamData = await teamResponse.json();
            setTeamMembers(teamData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewFeedback = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingFeedback(null);
        fetchData();
    };

    const openDetailModal = (feedback) => {
        setSelectedDetailFeedback(feedback);
        setShowDetailModal(true);
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-50 border-green-200';
            case 'constructive': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive': return <TrendingUp className="w-4 h-4" />;
            case 'constructive': return <Sprout className="w-4 h-4" />;
            default: return <ThumbsUp className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const positivePercentage = stats?.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
    const constructivePercentage = stats?.total > 0 ? Math.round((stats.constructive / stats.total) * 100) : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex mb-8">
                <div className='w-full'>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.full_name}!
                    </h1>
                    <p className="text-gray-600">Here's your team feedback overview and recent activity.</p>
                </div>
                <div className='h-full w-full'>
                    <div className="flex space-x-3 justify-end">
                        <button
                            onClick={() => { navigate('/manager/team') }}
                            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Eye className="w-4 h-4" />
                            <span>View Team</span>
                        </button>
                        <button
                            onClick={handleNewFeedback}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <Plus className="w-4 h-4" />
                            <span>Give Feedback</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Feedback Given</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Positive Feedback</p>
                            <p className="text-2xl font-bold text-green-600">{stats?.positive || 0}</p>
                            <p className="text-xs text-gray-500">{positivePercentage}% of total</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Constructive Feedback</p>
                            <p className="text-2xl font-bold text-orange-600">{stats?.constructive || 0}</p>
                            <p className="text-xs text-gray-500">{constructivePercentage}% of total</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Sprout className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Acknowledged</p>
                            <p className="text-2xl font-bold text-blue-600">{stats?.acknowledged || 0}</p>
                            <p className="text-xs text-gray-500">Team responses</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity Feed */}
                <div className="bg-white max-h-[31rem] rounded-xl shadow-sm border border-gray-200 p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                        <span className="text-sm text-gray-500">Latest feedback given</span>
                    </div>

                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((feedback) => (
                                <div key={feedback.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetailModal(feedback)}>
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            Feedback given to {feedback.receiver_name}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(feedback.sentiment)}`}>
                                                {getSentimentIcon(feedback.sentiment)}
                                                <span className="capitalize">{feedback.sentiment}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(feedback.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {feedback.acknowledged && (
                                            <p className="text-xs text-green-600 mt-1">✓ Acknowledged by employee</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <ThumbsUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No recent activity</p>
                        </div>
                    )}
                </div>

                {/* Team Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Team Overview</h2>
                        <span className="text-sm text-gray-500">{teamMembers.length} members</span>
                    </div>

                    {teamMembers.length > 0 ? (
                        <div className="space-y-3">
                            {teamMembers.slice(0, 5).map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.full_name}</p>
                                            <p className="text-sm text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {teamMembers.length > 5 && (
                                <p className="text-sm text-gray-500 text-center pt-2">
                                    +{teamMembers.length - 5} more team members
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No team members found</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <FeedbackModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    teamMembers={teamMembers}
                    editingFeedback={null}
                />
            )}

            {showDetailModal && selectedDetailFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-xl">
                            <h3 className="text-lg font-semibold text-gray-900">Feedback Details</h3>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedDetailFeedback(null);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className='flex items-baseline'>
                                            <h3 className="font-semibold text-gray-900 mr-2">To: {selectedDetailFeedback.receiver_name}</h3>
                                            <p className='text-xs italic px-2 py-1 bg-gray-200 rounded-full'>Employee</p>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm pt-1 text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(selectedDetailFeedback.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getSentimentColor(selectedDetailFeedback.sentiment)}`}>
                                        {getSentimentIcon(selectedDetailFeedback.sentiment)}
                                        <span className="capitalize">{selectedDetailFeedback.sentiment}</span>
                                    </div>

                                    {selectedDetailFeedback.acknowledged ? (
                                        <span className="inline-flex items-center space-x-1 text-green-600 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Acknowledged</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center space-x-1 text-orange-600 text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>Pending</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Tags Display */}
                                {selectedDetailFeedback.tags && selectedDetailFeedback.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        <h4 className="font-medium text-gray-900 text-sm">Tags:</h4>
                                        {selectedDetailFeedback.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                            >
                                                <Tag className="w-3 h-3 mr-1" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                                    <div className="prose prose-sm max-w-none text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {selectedDetailFeedback.strengths}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {selectedDetailFeedback.improvements && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                                        <div className="prose prose-sm max-w-none text-gray-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {selectedDetailFeedback.improvements}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedDetailFeedback.acknowledged && selectedDetailFeedback.acknowledgment_comment && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="font-medium text-blue-900 mb-2 text-sm">Employee Response:</h4>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <p className="text-gray-700 text-sm italic">"{selectedDetailFeedback.acknowledgment_comment}"</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Acknowledged on {new Date(selectedDetailFeedback.acknowledged_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

export default ManagerHome;