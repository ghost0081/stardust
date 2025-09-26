import React, { useState, useEffect } from 'react';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, onLogin, initialMode = 'login' }) => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
      const payload = isSignup
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data?.message || 'Authentication failed');
        return;
      }

      // Pass authenticated user up to parent; do not store in localStorage
      onLogin(data.data.user);
      onClose();
      resetForm();
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: ''
    });
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    resetForm();
  };

  // Keep modal mode in sync with parent-provided initialMode each time it's opened
  useEffect(() => {
    if (isOpen) {
      setIsSignup(initialMode === 'signup');
    }
  }, [initialMode, isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <button className="login-close-btn" onClick={onClose}>
          ×
        </button>
        
        <div className="login-header">
          <h2 className="login-title">
            {isSignup ? 'Join Space Explorer' : 'Welcome Back'}
          </h2>
          <p className="login-subtitle">
            {isSignup 
              ? 'Create your account to explore the universe' 
              : 'Sign in to continue your cosmic journey'
            }
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="login-form-group">
              <label htmlFor="name" className="login-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="login-input"
                placeholder="Enter your full name"
                required={isSignup}
              />
            </div>
          )}

          <div className="login-form-group">
            <label htmlFor="email" className="login-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="login-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password" className="login-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="login-input"
              placeholder={isSignup ? "Create a password" : "Enter your password"}
              required
            />
          </div>

          <button type="submit" className="login-submit-btn">
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-switch-text">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button"
              className="login-switch-btn"
              onClick={switchMode}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="login-decorations">
          <div className="login-star login-star-1">⭐</div>
          <div className="login-star login-star-2">🌟</div>
          <div className="login-star login-star-3">✨</div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
