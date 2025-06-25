import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Calendar,
    User,
    TrendingUp,
    MessageSquare,
    CheckCircle,
    Clock,
    ChevronDown,
    Sprout,
    Download,
    Tag,
    Users
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';

function ReceivedFeedback() {
    const [feedback, setFeedback] = useState([]);
    const [filteredFeedback, setFilteredFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sentimentFilter, setSentimentFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [showFilters, setShowFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showAckModal, setShowAckModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [ackComment, setAckComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [roleFilter, setRoleFilter] = useState('all');
    const [acknowledgementFilter, setAcknowledgementFilter] = useState('all');
    const backendUrl = import.meta.env.VITE_BACKEND_URL;


    useEffect(() => {
        fetchFeedback();
    }, []);

    useEffect(() => {
        filterAndSortFeedback();
    }, [feedback, searchTerm, sentimentFilter, roleFilter, acknowledgementFilter, sortBy]);

    const fetchFeedback = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/feedback/received`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setFeedback(data);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortFeedback = () => {
        let filtered = [...feedback];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.giver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.strengths.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.improvements.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sentiment filter
        if (sentimentFilter !== 'all') {
            filtered = filtered.filter(item => item.sentiment === sentimentFilter);
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(item => {
                if (roleFilter === 'manager') {
                    return item.giver_role !== 'employee';
                } else if (roleFilter === 'peer') {
                    return item.giver_role === 'employee';
                }
                return true;
            });
        }

        // Acknowledgement filter
        if (acknowledgementFilter !== 'all') {
            if (acknowledgementFilter === 'pending') {
                filtered = filtered.filter(item => !item.acknowledged);
            } else if (acknowledgementFilter === 'done') {
                filtered = filtered.filter(item => item.acknowledged);
            }
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'manager':
                    return a.giver_name.localeCompare(b.giver_name);
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
            pdf.text('Feedback Report', margin, yPosition);
            yPosition += 15;

            // Employee info
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Employee: ${feedbackItem.receiver_name}`, margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Date: ${new Date(feedbackItem.created_at).toLocaleDateString()}`, margin, yPosition);
            yPosition += 6;

            if (feedback.tags && feedback.tags.length > 0) {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'italic');
                pdf.setTextColor(100, 100, 100);

                const tagsText = `Tags: ${feedback.tags.join(' • ')}`;
                pdf.text(tagsText, 20, yPosition);
                yPosition += 8;

                // Reset text color
                pdf.setTextColor(0, 0, 0);
            }

            pdf.text(`Sentiment: ${feedbackItem.sentiment.charAt(0).toUpperCase() + feedbackItem.sentiment.slice(1)}`, margin, yPosition);
            yPosition += 6;

            pdf.text(`Status: ${feedbackItem.acknowledged ? 'Acknowledged' : 'Pending'}`, margin, yPosition);
            yPosition += 15;

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
            pdf.save(`feedback-${feedbackItem.receiver_name}-${new Date(feedbackItem.created_at).toISOString().split('T')[0]}.pdf`);
            toast.success(
                'Downloaded successfully!',
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
                'Error generating PDF. Please try again.',
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
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Export all filtered feedback to PDF
    const exportAllFeedbackToPDF = async () => {
        if (filteredFeedback.length === 0) {
            alert('No feedback to export.');
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
            pdf.text('Feedback Report Summary', margin, yPosition);
            yPosition += 20;

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 8;
            pdf.text(`Total Feedback Items: ${filteredFeedback.length}`, margin, yPosition);
            yPosition += 8;

            // Filters applied
            const filtersApplied = [];
            if (searchTerm) filtersApplied.push(`Search: "${searchTerm}"`);
            // if (employeeFilter !== 'all') {
            //     const employee = teamMembers.find(m => m.id === employeeFilter);
            //     filtersApplied.push(`Employee: ${employee?.full_name || 'Unknown'}`);
            // }
            if (sentimentFilter !== 'all') filtersApplied.push(`Sentiment: ${sentimentFilter}`);

            if (filtersApplied.length > 0) {
                pdf.text('Filters Applied:', margin, yPosition);
                yPosition += 6;
                filtersApplied.forEach(filter => {
                    pdf.text(`• ${filter}`, margin + 10, yPosition);
                    yPosition += 5;
                });
            }

            yPosition += 15;

            // Summary statistics
            const sentimentCounts = filteredFeedback.reduce((acc, item) => {
                acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
                return acc;
            }, {});

            const acknowledgedCount = filteredFeedback.filter(item => item.acknowledged).length;

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Summary Statistics:', margin, yPosition);
            yPosition += 10;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            Object.entries(sentimentCounts).forEach(([sentiment, count]) => {
                pdf.text(`${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}: ${count}`, margin, yPosition);
                yPosition += 5;
            });
            pdf.text(`Acknowledged: ${acknowledgedCount} / ${filteredFeedback.length}`, margin, yPosition);
            yPosition += 20;

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

                // Employee header
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${index + 1}. ${item.receiver_name}`, margin, yPosition);
                yPosition += 8;

                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Date: ${new Date(item.created_at).toLocaleDateString()} | Sentiment: ${item.sentiment} | Status: ${item.acknowledged ? 'Acknowledged' : 'Pending'}`, margin, yPosition);
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
            pdf.save(`feedback-report-${timestamp}.pdf`);
            toast.success(
                'Downloaded successfully!',
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
                'Error generating PDF. Please try again.',
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
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
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
            fetchFeedback(); // Refresh data
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
            default: return <MessageSquare className="w-4 h-4" />;
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
            {/* Header */}
            {/* <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Received Feedback</h1>
                <p className="text-gray-600">View and manage all feedback you've received from your managers.</p>
            </div> */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Received Feedback</h1>
                    <p className="text-gray-600">View and manage all feedback you've received from your managers.</p>
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
                            placeholder="Search feedback..."
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
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Roles</option>
                                <option value="manager">Manager Feedback</option>
                                <option value="peer">Peer Feedback</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                            <select
                                value={acknowledgementFilter}
                                onChange={(e) => setAcknowledgementFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="done">Acknowledged</option>
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
                                <option value="manager">Manager Name</option>
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
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        {(item.giver_role == 'employee') ? <Users className="w-6 h-6 text-indigo-600 " /> : <User className="w-6 h-6 text-gray-600" />}
                                    </div>
                                    <div>
                                        <div className='flex items-baseline'>
                                            <h3 className="font-semibold text-gray-900 mr-2">{item.giver_name}</h3>
                                            <p className='text-xs italic px-2 py-1 bg-gray-200 rounded-full'>{(item.giver_role == 'employee') ? "Peer" : "Manager"}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm pt-1 text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
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
                                {/* Tags Display - Compact Version */}
                                {item.tags && item.tags.length > 0 && (
                                    // <div className="mt-4 pt-4 border-t border-gray-200">
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
                                    // </div>
                                )}

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                                    <p className="prose prose-sm max-w-none text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {item.strengths}
                                        </ReactMarkdown>
                                    </p>
                                </div>

                                {item.improvements && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                                        <p className=" prose prose-sm max-w-none text-gray-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {item.improvements}
                                            </ReactMarkdown>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {!item.acknowledged && (
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                    <button
                                        onClick={() => openAckModal(item)}
                                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Acknowledge Feedback
                                    </button>
                                </div>
                            )}
                            {item.acknowledged && item.acknowledgment_comment && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="font-medium text-blue-900 mb-2 text-sm">Your Response:</h4>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <p className="text-gray-700 text-sm italic">"{item.acknowledgment_comment}"</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Acknowledged on {new Date(item.acknowledged_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
                        <p className="text-gray-500">
                            {searchTerm || sentimentFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'You haven\'t received any feedback yet'}
                        </p>
                    </div>
                )}
            </div>
            {/* Acknowledgment Modal */}
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
        </div>
    );
}

export default ReceivedFeedback;