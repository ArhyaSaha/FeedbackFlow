import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    MessageSquare,
    TrendingUp,
    Clock,
    CheckCircle,
    Sprout,
    Calendar,
    User,
    ThumbsUp,
    Tag,
    X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';

function EmployeeHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentFeedback, setRecentFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAckModal, setShowAckModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [ackComment, setAckComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

            // Fetch recent feedback
            const feedbackResponse = await fetch(`${backendUrl}/feedback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const feedbackData = await feedbackResponse.json();
            setRecentFeedback(feedbackData.slice(0, 3)); // Get latest 3

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeFeedback = async (feedbackId, comment = '') => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${backendUrl}/feedback/${feedbackId}/acknowledge`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: comment || null })
            });
            fetchData(); // Refresh data
            setShowAckModal(false);
            setSelectedFeedback(null);
            setAckComment('');
            toast.success(
                'Feedback acknowledged!',
                {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                }
            )
        } catch (error) {
            toast.error(
                'Oops! An error occured.',
                {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                }
            )
            console.error('Error acknowledging feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAckModal = (feedback) => {
        setSelectedFeedback(feedback);
        setShowAckModal(true);
        setAckComment('');
    };

    const openDetailModal = (feedback) => {
        setSelectedDetailFeedback(feedback);
        setShowDetailModal(true);
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-50 border-green-200';
            case 'constructive': return 'text-amber-600 bg-amber-50 border-amber-200';
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.full_name}!
                </h1>
                <p className="text-gray-600">Here's your feedback overview and recent activity.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Positive Feedback</p>
                            <p className="text-2xl font-bold text-green-600">{stats?.positive || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Acknowledged</p>
                            <p className="text-2xl font-bold text-blue-600">{stats?.acknowledged || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Review</p>
                            <p className="text-2xl font-bold text-orange-600">{stats?.pending || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Feedback Summary */}
            <div className="bg-white max-h-[40rem] rounded-xl shadow-sm border border-gray-200 p-6 mb-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Feedback Highlights</h2>
                    <span className="text-sm text-gray-500">Latest updates</span>
                </div>

                {recentFeedback.length > 0 ? (
                    <div className="space-y-4">
                        {recentFeedback.map((feedback) => (
                            <div key={feedback.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetailModal(feedback)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className='flex items-baseline'>
                                                <p className="font-bold text-gray-900 mr-2">{feedback.giver_name}</p>
                                                <p className='text-xs italic px-2 py-1 bg-gray-200 rounded-full'>{(feedback.giver_role == 'employee') ? "Peer" : "Manager"}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 pt-1 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(feedback.sentiment)}`}>
                                        {getSentimentIcon(feedback.sentiment)}
                                        <span className="capitalize">{feedback.sentiment}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    {/* Tags Display - Compact Version */}
                                    {feedback.tags && feedback.tags.length > 0 && (
                                        // <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <h4 className="font-medium text-gray-900 text-sm">Tags:</h4>
                                            {feedback.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                                >
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        // </div>
                                    )}
                                    <div className="mb-2">
                                        <h4 className="text-sm font-medium text-green-600 mb-1">Strengths:</h4>
                                        <p className="prose prose-sm max-w-none text-sm text-gray-600 line-clamp-2">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {feedback.strengths}
                                            </ReactMarkdown>
                                        </p>
                                    </div>
                                    {feedback.improvements && (
                                        <div>
                                            <h4 className="text-sm font-medium text-amber-600 mb-1">Areas for Improvement:</h4>
                                            <p className="prose prose-sm max-w-none text-sm text-gray-600 line-clamp-2">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {feedback.improvements}
                                                </ReactMarkdown>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {feedback.acknowledged ? (
                                            <span className="inline-flex items-center space-x-1 text-green-600 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Acknowledged</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center space-x-1 text-orange-600 text-sm">
                                                <Clock className="w-4 h-4" />
                                                <span>Pending acknowledgment</span>
                                            </span>
                                        )}
                                    </div>

                                    {!feedback.acknowledged && (
                                        <button
                                            onClick={() => openAckModal(feedback)}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Acknowledge
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No feedback received yet</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Quick Tip</h3>
                <p className="text-gray-700">
                    Regular feedback acknowledgment shows your manager that you're actively engaged with their input.
                    Use the feedback to identify growth opportunities and celebrate your strengths!
                </p>
            </div>

            {showAckModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Acknowledge Feedback
                        </h3>

                        {selectedFeedback && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">From: {selectedFeedback.giver_name}</p>
                                <p className="text-sm text-gray-600">Date: {new Date(selectedFeedback.created_at).toLocaleDateString()}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add a comment (optional)
                            </label>
                            <textarea
                                value={ackComment}
                                onChange={(e) => setAckComment(e.target.value)}
                                placeholder="Thank you for the feedback..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This comment will be visible to your manager.
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowAckModal(false);
                                    setSelectedFeedback(null);
                                    setAckComment('');
                                }}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => acknowledgeFeedback(selectedFeedback.id, ackComment)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Acknowledging...' : 'Acknowledge'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDetailModal && selectedDetailFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                                            <h3 className="font-semibold text-gray-900 mr-2">{selectedDetailFeedback.giver_name}</h3>
                                            <p className='text-xs italic px-2 py-1 bg-gray-200 rounded-full'>{(selectedDetailFeedback.giver_role == 'employee') ? "Peer" : "Manager"}</p>
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

                            {!selectedDetailFeedback.acknowledged && (
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            openAckModal(selectedDetailFeedback);
                                        }}
                                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Acknowledge Feedback
                                    </button>
                                </div>
                            )}
                            {selectedDetailFeedback.acknowledged && selectedDetailFeedback.acknowledgment_comment && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="font-medium text-blue-900 mb-2 text-sm">Your Response:</h4>
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

export default EmployeeHome;