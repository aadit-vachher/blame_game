import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Flame, Lock, Mail, AlertCircle, Users } from 'lucide-react';
import { listTeams } from '../api/teams';

const Login = () => {
  const { loginUser, registerUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (isRegistering && teams.length === 0) {
      const fetchTeams = async () => {
        try {
          const res = await listTeams();
          setTeams(res.data || []);
        } catch (err) {
          console.error("Failed to fetch teams");
        }
      };
      fetchTeams();
    }
  }, [isRegistering, teams.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !teamId)) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = isRegistering
        ? await registerUser(email, password, teamId)
        : await loginUser(email, password);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || (isRegistering ? 'Registration failed' : 'Login failed'));
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

          {isRegistering && (
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-xs)' }}>
                Team
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.3)' }}>
                  <Users size={16} />
                </span>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    width: '100%',
                    height: '40px',
                    borderRadius: 'var(--radius-md)'
                  }}
                  required={isRegistering}
                >
                  <option value="" disabled style={{ color: 'black' }}>Select your team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id} style={{ color: 'black' }}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
              isRegistering ? 'Sign Up' : 'Sign In'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary-light)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
