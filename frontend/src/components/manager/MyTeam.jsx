import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Calendar,
    ThumbsUp,
    TrendingUp,
    Sprout,
    Plus,
    Search
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useAuth } from '../../contexts/AuthContext';


function MyTeam() {
    const [teamMembers, setTeamMembers] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const { user } = useAuth();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch team members
            const teamResponse = await fetch(`${backendUrl}/team`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const teamData = await teamResponse.json();
            setTeamMembers(teamData);

            // Fetch all feedback to get latest feedback for each team member
            const feedbackResponse = await fetch(`${backendUrl}/feedback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const feedbackData = await feedbackResponse.json();
            setFeedback(feedbackData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLatestFeedbackForEmployee = (employeeId) => {
        const employeeFeedback = feedback.filter(f => f.receiver_id === employeeId);
        return employeeFeedback.length > 0 ? employeeFeedback[0] : null; // Already sorted by date desc
    };

    const handleGiveFeedback = (employee) => {
        setSelectedEmployee(employee);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedEmployee(null);
        fetchData(); // Refresh data
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

    const filteredTeamMembers = teamMembers.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Team</h1>
                    <p className="text-gray-600">Manage your team members and track their feedback history.</p>
                </div>
                <div className="text-sm text-gray-500">
                    <div className='mb-6'>
                        <div className='flex items-center space-x-1'>
                            <p className='text-sm '>Your Manager ID is: </p>
                            <p className=' text-xs font-semibold italic'>{user.id}</p>
                        </div>
                        <p className='text-xs text-gray-500'>Share this with your team so they can join you.</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex justify-between">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className='flex items-center text-sm text-gray-500'>
                    {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Team Members Grid */}
            {filteredTeamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeamMembers.map((member) => {
                        const latestFeedback = getLatestFeedbackForEmployee(member.id);

                        return (
                            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                {/* Member Info */}
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{member.full_name}</h3>
                                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                                    </div>
                                </div>

                                {/* Latest Feedback Info */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Feedback</h4>
                                    {latestFeedback ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(latestFeedback.sentiment)}`}>
                                                    {getSentimentIcon(latestFeedback.sentiment)}
                                                    <span className="capitalize">{latestFeedback.sentiment}</span>
                                                </div>
                                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(latestFeedback.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2">
                                                {latestFeedback.strengths.substring(0, 100)}...
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No feedback given yet</p>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleGiveFeedback(member)}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Give Feedback</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    {searchTerm ? (
                        <>
                            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                            <p className="text-gray-500">Try adjusting your search term</p>
                        </>
                    ) : (
                        <>
                            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                            <p className="text-gray-500">You don't have any team members assigned yet</p>
                        </>
                    )}
                </div>
            )}

            {/* Feedback Modal */}
            {showModal && (
                <FeedbackModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    teamMembers={teamMembers}
                    selectedEmployee={selectedEmployee}
                />
            )}
        </div>
    );
}

export default MyTeam;