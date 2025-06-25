import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Calendar,
    User,
    TrendingUp,
    Sprout,
    ThumbsUp,
    CheckCircle,
    Clock,
    ChevronDown,
    Edit,
    Download,
    Plus,
    Tag,
    Users
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import PeerFeedbackModal from './PeerFeedbackModal';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import PeerFeedbackModal from './PeerFeedbackModal';

function PeerFeedback() {
    const [feedback, setFeedback] = useState([]);
    const [filteredFeedback, setFilteredFeedback] = useState([]);
    const [peers, setPeers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [peerFilter, setPeerFilter] = useState('all');
    const [sentimentFilter, setSentimentFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;


    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterAndSortFeedback();
    }, [feedback, searchTerm, peerFilter, sentimentFilter, sortBy]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');

            const feedbackResponse = await fetch(`${backendUrl}/feedback/given`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const feedbackData = await feedbackResponse.json();
            setFeedback(feedbackData);

            const peersResponse = await fetch(`${backendUrl}/team`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const peersData = await peersResponse.json();
            setPeers(peersData);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortFeedback = () => {
        let filtered = [...(feedback || [])];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.strengths.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.improvements && item.improvements.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Peer filter
        if (peerFilter !== 'all') {
            filtered = filtered.filter(item => item.recipient_id === peerFilter);
        }

        // Sentiment filter
        if (sentimentFilter !== 'all') {
            filtered = filtered.filter(item => item.sentiment === sentimentFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'peer':
                    return a.recipient_name.localeCompare(b.recipient_name);
                case 'sentiment':
                    return a.sentiment.localeCompare(b.sentiment);
                default:
                    return 0;
            }
        });

        setFilteredFeedback(filtered);
    };

    // Function to strip markdown and convert to plain text
    const stripMarkdown = (markdown) => {
        if (!markdown) return '';
        return markdown
            .replace(/#+\s/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
            .replace(/\n+/g, '\n') // Normalize line breaks
            .trim();
    };

    // Export single feedback to PDF
    const exportSingleFeedbackToPDF = async (feedbackItem) => {
        setIsExporting(true);
        try {
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            let yPosition = margin;

            // Header
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Peer Feedback Report', margin, yPosition);
            yPosition += 15;

            // Recipient info
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`To: ${feedbackItem.recipient_name}`, margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Date: ${new Date(feedbackItem.created_at).toLocaleDateString()}`, margin, yPosition);
            yPosition += 6;

            pdf.text(`Sentiment: ${feedbackItem.sentiment.charAt(0).toUpperCase() + feedbackItem.sentiment.slice(1)}`, margin, yPosition);
            yPosition += 6;

            pdf.text(`Status: ${feedbackItem.acknowledged ? 'Acknowledged' : 'Pending'}`, margin, yPosition);
            yPosition += 15;

            // Tags
            if (feedbackItem.tags && feedbackItem.tags.length > 0) {
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Tags:', margin, yPosition);
                yPosition += 6;

                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                const tagsText = feedbackItem.tags.join(', ');
                pdf.text(tagsText, margin, yPosition);
                yPosition += 10;
            }

            // Strengths section
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Strengths:', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const strengthsText = stripMarkdown(feedbackItem.strengths);
            const strengthsLines = pdf.splitTextToSize(strengthsText, pageWidth - (margin * 2));

            strengthsLines.forEach(line => {
                if (yPosition > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }
                pdf.text(line, margin, yPosition);
                yPosition += 5;
            });

            yPosition += 10;

            // Improvements section (if exists)
            if (feedbackItem.improvements) {
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Areas for Improvement:', margin, yPosition);
                yPosition += 8;

                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                const improvementsText = stripMarkdown(feedbackItem.improvements);
                const improvementsLines = pdf.splitTextToSize(improvementsText, pageWidth - (margin * 2));

                improvementsLines.forEach(line => {
                    if (yPosition > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                });
            }

            // Footer
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
                pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
            }

            // Save the PDF
            pdf.save(`peer-feedback-${feedbackItem.recipient_name}-${new Date(feedbackItem.created_at).toISOString().split('T')[0]}.pdf`);
            toast.success('Downloaded successfully!');
        } catch (error) {
            toast.error('Error generating PDF. Please try again.');
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Export all filtered feedback to PDF
    const exportAllFeedbackToPDF = async () => {
        if (filteredFeedback.length === 0) {
            toast.warning('No feedback to export.');
            return;
        }

        setIsExporting(true);
        try {
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            let yPosition = margin;

            // Title page
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Peer Feedback Report Summary', margin, yPosition);
            yPosition += 20;

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 8;
            pdf.text(`Total Feedback Items: ${filteredFeedback.length}`, margin, yPosition);
            yPosition += 15;

            // Individual feedback items
            filteredFeedback.forEach((item, index) => {
                // Check if we need a new page
                if (yPosition > pageHeight - 100) {
                    pdf.addPage();
                    yPosition = margin;
                }

                // Separator line
                if (index > 0) {
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 10;
                }

                // Recipient header
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${index + 1}. To: ${item.recipient_name}`, margin, yPosition);
                yPosition += 8;

                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Date: ${new Date(item.created_at).toLocaleDateString()} | Sentiment: ${item.sentiment}`, margin, yPosition);
                yPosition += 10;

                // Strengths
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Strengths:', margin, yPosition);
                yPosition += 5;

                pdf.setFont('helvetica', 'normal');
                const strengthsText = stripMarkdown(item.strengths);
                const strengthsLines = pdf.splitTextToSize(strengthsText, pageWidth - (margin * 2));

                strengthsLines.forEach(line => {
                    if (yPosition > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin + 5, yPosition);
                    yPosition += 4;
                });

                yPosition += 5;

                // Improvements
                if (item.improvements) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Areas for Improvement:', margin, yPosition);
                    yPosition += 5;

                    pdf.setFont('helvetica', 'normal');
                    const improvementsText = stripMarkdown(item.improvements);
                    const improvementsLines = pdf.splitTextToSize(improvementsText, pageWidth - (margin * 2));

                    improvementsLines.forEach(line => {
                        if (yPosition > pageHeight - margin) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        pdf.text(line, margin + 5, yPosition);
                        yPosition += 4;
                    });
                }

                yPosition += 15;
            });

            // Add page numbers
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
            }

            // Save the PDF
            const timestamp = new Date().toISOString().split('T')[0];
            pdf.save(`peer-feedback-report-${timestamp}.pdf`);
            toast.success('Downloaded successfully!');
        } catch (error) {
            toast.error('Error generating PDF. Please try again.');
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleEditFeedback = (feedbackItem) => {
        setEditingFeedback(feedbackItem);
        setShowModal(true);
    };

    const handleNewFeedback = () => {
        setEditingFeedback(null);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingFeedback(null);
        fetchData();
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

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Loading overlay for PDF export */}
            {isExporting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Generating PDF...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Peer Feedback</h1>
                    <p className="text-gray-600">Give feedback to your colleagues and track all the feedback you've shared.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={exportAllFeedbackToPDF}
                        disabled={isExporting || filteredFeedback.length === 0}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export All PDF</span>
                    </button>
                    <button
                        onClick={handleNewFeedback}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Give Peer Feedback</span>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search peer feedback..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-5 h-5 text-gray-500" />
                        <span>Filters</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Colleague</label>
                            <select
                                value={peerFilter}
                                onChange={(e) => setPeerFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Colleagues</option>
                                {peers.map((peer) => (
                                    <option key={peer.id} value={peer.id}>{peer.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Sentiment</label>
                            <select
                                value={sentimentFilter}
                                onChange={(e) => setSentimentFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Sentiments</option>
                                <option value="positive">Positive</option>
                                <option value="neutral">Neutral</option>
                                <option value="constructive">Constructive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="date">Date (Newest First)</option>
                                <option value="peer">Colleague Name</option>
                                <option value="sentiment">Sentiment</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                {filteredFeedback.length > 0 ? (
                    filteredFeedback.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        {(item.giver_role == 'employee') ? <Users className="w-6 h-6 text-blue-600" /> : <User className="w-6 h-6 text-blue-600" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">To: {item.receiver_name}</h3>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            {item.updated_at !== item.created_at && (
                                                <span className="text-blue-600">(edited)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getSentimentColor(item.sentiment)}`}>
                                        {getSentimentIcon(item.sentiment)}
                                        <span className="capitalize">{item.sentiment}</span>
                                    </div>

                                    {item.acknowledged ? (
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

                                    <button
                                        onClick={() => handleEditFeedback(item)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => exportSingleFeedbackToPDF(item)}
                                        disabled={isExporting}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Export this feedback to PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Tags Display */}
                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        <h4 className="font-medium text-gray-900 text-sm">Tags:</h4>
                                        {item.tags.map((tag, index) => (
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
                                    <div className="prose prose-sm max-w-none bg-green-50 p-3 rounded-lg border border-green-200">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {item.strengths}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {item.improvements && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                                        <div className="prose prose-sm max-w-none bg-orange-50 p-3 rounded-lg border border-orange-200">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {item.improvements}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {item.acknowledged && item.acknowledgment_comment && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="font-medium text-blue-900 mb-2 text-sm">Colleague Response:</h4>
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <p className="text-gray-700 text-sm italic">"{item.acknowledgment_comment}"</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Acknowledged on {new Date(item.acknowledged_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No peer feedback found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || peerFilter !== 'all' || sentimentFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'You haven\'t given any peer feedback yet'}
                        </p>
                        <button
                            onClick={handleNewFeedback}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Give Your First Peer Feedback
                        </button>
                    </div>
                )}
            </div>

            {/* Peer Feedback Modal */}
            {showModal && (
                <PeerFeedbackModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    colleagues={peers}
                    editingFeedback={editingFeedback}
                />
            )}
        </div>
    );
}

export default PeerFeedback;