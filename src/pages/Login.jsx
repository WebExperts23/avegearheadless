import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, user } = useAuth();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([{ label: 'Sign In', path: '/login' }]);
        if (user) {
            navigate('/account');
        }
        return () => setBreadcrumbs([]);
    }, [user, navigate, setBreadcrumbs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/account');
        } else {
            setError(result.error || 'Invalid email or password.');
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '450px',
                width: '100%',
                background: '#fff',
                borderRadius: '24px',
                padding: '50px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
                border: '1px solid #eee'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'rgba(230, 126, 34, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        color: 'var(--primary-color)'
                    }}>
                        <LogIn size={30} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 10px', color: '#111' }}>Welcome Back</h1>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>Sign in to access your account and orders</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fff5f5',
                        color: '#e53e3e',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '25px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: '1px solid #feb2b2'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                                style={{
                                    width: '100%',
                                    padding: '14px 15px 14px 45px',
                                    borderRadius: '12px',
                                    border: '1px solid #ddd',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s',
                                    background: '#fcfcfc'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Forgot password?</Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '14px 45px 14px 45px',
                                    borderRadius: '12px',
                                    border: '1px solid #ddd',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s',
                                    background: '#fcfcfc'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '15px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: '#aaa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="primary"
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.95rem', color: '#666' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none' }}>Create Account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
