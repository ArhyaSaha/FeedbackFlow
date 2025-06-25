import React, { useState, useEffect } from 'react';
import { X, User, MessageSquare, Eye, Edit3, Tag, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';

function FeedbackModal({ isOpen, onClose, teamMembers, editingFeedback, selectedEmployee }) {
    const [formData, setFormData] = useState({
        receiver_id: '',
        strengths: '',
        improvements: '',
        sentiment: 'positive',
        tags: [],
        giver_role: 'manager'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState({
        strengths: false,
        improvements: false
    });
    const [tagInput, setTagInput] = useState('');
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const suggestedTags = [
        'communication', 'leadership', 'teamwork', 'problem-solving', 'creativity',
        'time-management', 'technical-skills', 'initiative', 'collaboration', 'adaptability',
        'attention-to-detail', 'mentoring', 'project-management', 'customer-service', 'innovation'
    ];

    useEffect(() => {
        if (editingFeedback) {
            setFormData({
                employee_id: editingFeedback.receiver_id,
                strengths: editingFeedback.strengths,
                improvements: editingFeedback.improvements,
                sentiment: editingFeedback.sentiment,
                tags: editingFeedback.tags || []
            });
        } else if (selectedEmployee) {
            setFormData(prev => ({
                ...prev,
                employee_id: selectedEmployee.id,
                tags: []
            }));
        } else {
            setFormData({
                employee_id: '',
                strengths: '',
                improvements: '',
                sentiment: 'positive',
                tags: []
            });
        }
    }, [editingFeedback, selectedEmployee]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const url = editingFeedback
                ? `${backendUrl}/feedback/${editingFeedback.id}`
                : `${backendUrl}/feedback`;

            const method = editingFeedback ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(
                    editingFeedback
                        ? 'Feedback updated successfully!'
                        : 'Feedback sent successfully!',
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
                onClose();
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'An error occurred');
            }
        } catch (error) {
            toast.error(
                'Oops! An error occured!',
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
            console.log(error)
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const togglePreview = (field) => {
        setPreviewMode(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const addTag = (tag) => {
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
        }
        setTagInput('');
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTagInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput.trim());
        }
    };

    if (!isOpen) return null;

    const selectedEmployeeName = selectedEmployee?.full_name ||
        teamMembers.find(member => member.id === formData.employee_id)?.full_name || '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 py-2 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingFeedback ? 'Edit Feedback' : 'Give Feedback'}
                            </h2>
                            {selectedEmployeeName && (
                                <p className="text-sm text-gray-500">For {selectedEmployeeName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Markdown Help */}
                <div className="px-6 py-1 bg-blue-50 border-b border-blue-200">
                    <p className="text-xs text-blue-500">
                        <strong>*Markdown supported</strong>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-3 space-y-4">
                    {/* Employee Selection */}
                    {!selectedEmployee && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Team Member
                            </label>
                            <select
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleChange}
                                required
                                disabled={false}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="">Choose a team member...</option>
                                {teamMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Strengths */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Strengths & Positive Feedback
                            </label>
                            <button
                                type="button"
                                onClick={() => togglePreview('strengths')}
                                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                {previewMode.strengths ? (
                                    <>
                                        <Edit3 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        <span>Preview</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {previewMode.strengths ? (
                            <div className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none text-sm">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {formData.strengths || '*No content to preview*'}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                name="strengths"
                                value={formData.strengths}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                placeholder="Highlight what this person does well."
                            />
                        )}
                    </div>

                    {/* Areas for Improvement */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Areas for Improvement
                            </label>
                            <button
                                type="button"
                                onClick={() => togglePreview('improvements')}
                                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                {previewMode.improvements ? (
                                    <>
                                        <Edit3 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        <span>Preview</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {previewMode.improvements ? (
                            <div className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none text-sm">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {formData.improvements || '*No content to preview*'}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                name="improvements"
                                value={formData.improvements}
                                onChange={handleChange}
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                placeholder="Areas for Growth:
Constructive feedback with a positive tone encourages continuous improvement."
                            />
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags
                        </label>

                        {/* Selected Tags */}
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 p-0.5 hover:bg-blue-200 rounded-full"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Tag Input */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleTagInputKeyPress}
                                placeholder="Add a tag..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => addTag(tagInput.trim())}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Suggested Tags */}
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
                            <div className="flex flex-wrap gap-1">
                                {suggestedTags
                                    .filter(tag => !formData.tags.includes(tag))
                                    .slice(0, 8)
                                    .map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => addTag(tag)}
                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Sentiment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Overall Sentiment
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'positive', label: 'Positive', color: 'green' },
                                { value: 'neutral', label: 'Neutral', color: 'blue' },
                                { value: 'constructive', label: 'Constructive', color: 'orange' }
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${formData.sentiment === option.value
                                        ? `border-${option.color}-500 bg-${option.color}-50`
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="sentiment"
                                        value={option.value}
                                        checked={formData.sentiment === option.value}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span className={`font-medium ${formData.sentiment === option.value
                                        ? `text-${option.color}-700`
                                        : 'text-gray-700'
                                        }`}>
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (editingFeedback ? 'Update Feedback' : 'Give Feedback')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FeedbackModal;