import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Lock, User, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '/icons/dpdzeroLogo.png';

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'employee',
    managerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.role,
          formData.managerId || null
        );
      } else {
        result = await signIn(formData.email, formData.password);
      }

      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsPageLoading(false);
    img.onerror = () => setIsPageLoading(false); // Handle error case
    img.src = '/icons/loginHero.svg';
    // const timer = setTimeout(() => {
    //   setIsPageLoading(false);
    // }, 1000); // Adjust timing as needed

    // return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className='flex'>
      <div className='w-[50%] h-full'>
        <div className="max-h-screen flex mt-6 justify-center bg-white px-4">
          <div className="max-w-md w-full ">
            <div className="flex justify-center">
              <img src={logo} alt="My Icon" className="w-2/5" />
            </div>

            <div className={`${isSignUp ? 'mt-10' : 'mt-28'} h-fit flex-row items-center justify-center `}>
              <div className="flex-row justify-center items-center text-center">
                <h2 style={{ fontFamily: '"Trebuchet MS", sans-serif' }} className={` mb-2 text-3xl font-semibold text-indigo-800 font-tr`}>Welcome to, FeedbackFlow</h2>
                <p className="mt-3 text-sm font-bold text-slate-600">
                  {isSignUp ? 'Create your account' : 'Sign in to your account'}
                </p>
              </div>

              <form className="mt-2 space-y-2" onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl shadow-sm p-2 space-y-4">
                  {isSignUp && (
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required={isSignUp}
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  {isSignUp && (
                    <>
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                          Role
                        </label>
                        <div className="relative">
                          <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                      </div>

                      {formData.role === 'employee' && (
                        <div>
                          <label htmlFor="managerId" className="block text-sm font-medium text-slate-700 mb-1">
                            Manager ID (Optional)
                          </label>
                          <input
                            id="managerId"
                            name="managerId"
                            // type="number"
                            value={formData.managerId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your manager's ID"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className='h-screen w-full  bg-[position:100%_center]' style={{
        backgroundImage: "url('/icons/loginHero.svg')"
      }}>
      </div>
    </div >
  );
}