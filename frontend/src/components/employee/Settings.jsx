import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Shield,
    UserCheck,
    Cog,
    Edit,
    Save,
    X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';


function Settings() {
    const [userDetails, setUserDetails] = useState(null);
    const [managerDetails, setManagerDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: ''
    });
    const { user } = useAuth();
    const [managers, setManagers] = useState([]);
    const [editingManager, setEditingManager] = useState(false);
    const [selectedManagerId, setSelectedManagerId] = useState('');
    const backendUrl = import.meta.env.VITE_BACKEND_URL;


    useEffect(() => {
        fetchUserDetails();
        fetchManagers();
    }, []);

    // Add this function to fetch managers
    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/managers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const managersData = await response.json();
                setManagers(managersData);
            }
        } catch (error) {
            console.error('Error fetching managers:', error);
        }
    };

    const handleManagerChange = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/auth/update-manager`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ manager_id: selectedManagerId || null })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUserDetails(updatedUser);
                setEditingManager(false);
                toast.success(
                    'Manager updated successfully!',
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
                // Refresh manager details
                if (updatedUser.manager_id) {
                    try {
                        const managerResponse = await fetch(`${backendUrl}/users/${updatedUser.manager_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (managerResponse.ok) {
                            const managerData = await managerResponse.json();
                            setManagerDetails(managerData);
                        }
                    } catch (error) {
                        console.error('Error fetching updated manager details:', error);
                    }
                } else {
                    setManagerDetails(null);
                }
            } else {
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
                console.error('Failed to update manager');
            }
        } catch (error) {
            console.error('Error updating manager:', error);
        }
    };

    const fetchUserDetails = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch current user details
            const userResponse = await fetch(`${backendUrl}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userResponse.json();
            setUserDetails(userData);

            setEditForm({
                full_name: userData.full_name,
                email: userData.email
            });

            // If user has a manager, fetch manager details
            if (userData.manager_id) {
                try {
                    const managerResponse = await fetch(`${backendUrl}/users/${userData.manager_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (managerResponse.ok) {
                        const managerData = await managerResponse.json();
                        setManagerDetails(managerData);
                    }
                } catch (error) {
                    console.error('Error fetching manager details:', error);
                    // Manager details are optional, so we continue without them
                }
            }

        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
        setEditForm({
            full_name: userDetails.full_name,
            email: userDetails.email
        });
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUserDetails(updatedUser);
                setEditing(false);
                toast.success(
                    'Profile updated successfully!',
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
            } else {
                console.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const getRoleColor = (role) => {
        return role === 'manager'
            ? 'text-purple-600 bg-purple-50 border-purple-200'
            : 'text-blue-600 bg-blue-50 border-blue-200';
    };

    const getRoleIcon = (role) => {
        return role === 'manager' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />;
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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <Cog className="w-8 h-8 text-gray-700" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600">Manage your account settings and preferences</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                        {!editing ? (
                            <button
                                onClick={handleEdit}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                            </button>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center space-x-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Profile Picture */}
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-10 h-10 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Profile Picture</h3>
                                <p className="text-sm text-gray-500">Upload a photo to personalize your account</p>
                            </div>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            ) : (
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-900">{userDetails?.full_name}</span>
                                </div>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            {editing ? (
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            ) : (
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-900">{userDetails?.email}</span>
                                </div>
                            )}
                        </div>

                        {/* Role Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role
                            </label>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(userDetails?.role)}`}>
                                    {getRoleIcon(userDetails?.role)}
                                    <span className="capitalize">{userDetails?.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* User ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User ID
                            </label>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-mono text-gray-600">{userDetails?.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manager Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Manager Information</h2>
                        {userDetails?.role === 'employee' && !editingManager && (
                            <button
                                onClick={() => {
                                    setEditingManager(true);
                                    setSelectedManagerId(userDetails.manager_id || '');
                                }}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Change Manager</span>
                            </button>
                        )}
                        {editingManager && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleManagerChange}
                                    className="flex items-center space-x-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingManager(false);
                                        setSelectedManagerId(userDetails.manager_id || '');
                                    }}
                                    className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {userDetails?.role === 'manager' ? (
                        <div className="text-center py-8">
                            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">You are a Manager</h3>
                            <p className="text-gray-500">As a manager, you don't have a direct supervisor in this system.</p>
                        </div>
                    ) : editingManager ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Manager
                                </label>
                                <select
                                    value={selectedManagerId}
                                    onChange={(e) => setSelectedManagerId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">No Manager</option>
                                    {managers.map((manager) => (
                                        <option key={manager.id} value={manager.id}>
                                            {manager.full_name} ({manager.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : userDetails?.manager_id ? (
                        <div className="space-y-4">
                            {managerDetails ? (
                                <>
                                    <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                            <UserCheck className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{managerDetails.full_name}</h3>
                                            <p className="text-sm text-gray-600">{managerDetails.email}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Manager ID
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-mono text-gray-600">{userDetails.manager_id}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manager Details Unavailable</h3>
                                    <p className="text-gray-500 mb-4">Unable to fetch manager information.</p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Manager ID
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-mono text-gray-600">{userDetails.manager_id}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Manager Assigned</h3>
                            <p className="text-gray-500">You don't have a manager assigned in the system.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Created
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-900">Account creation date not available</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Updated
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-900">Profile update date not available</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;