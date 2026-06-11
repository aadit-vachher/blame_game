import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Flame, Lock, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1d2e 0%, #11131e 100%)',
      padding: 'var(--space-6)',
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: 'var(--space-8)',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        color: 'white',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Brand/Logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-8)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(79, 95, 224, 0.4)',
            color: 'white',
          }}>
            <Flame size={24} fill="white" />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Blame Game
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            Accountability and Bottleneck Tracker
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-blocked)',
            fontSize: 'var(--font-size-xs)',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-xs)' }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.3)' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  paddingLeft: '38px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                }}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-xs)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.3)' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingLeft: '38px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                }}
                className="form-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              height: '42px',
              marginTop: 'var(--space-2)',
              boxShadow: '0 4px 12px rgba(79, 95, 224, 0.2)',
            }}
          >
            {loading ? (
              <span className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
