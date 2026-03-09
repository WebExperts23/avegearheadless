import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, AlertCircle, CheckCircle, Loader2, KeyRound } from 'lucide-react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { requestPasswordReset, user } = useAuth();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([{ label: 'Forgot Password', path: '/forgot-password' }]);
        if (user) {
            navigate('/account');
        }
        return () => setBreadcrumbs([]);
    }, [user, navigate, setBreadcrumbs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setSubmitting(true);

        const result = await requestPasswordReset(email);

        if (result.success) {
            setSuccess(true);
            setSubmitting(false);
        } else {
            setError(result.error || 'Failed to request password reset. Please try again.');
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
                        <KeyRound size={30} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 10px', color: '#111' }}>Reset Password</h1>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>Enter your email to receive a password reset link</p>
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

                {success && (
                    <div style={{
                        background: '#f0fdf4',
                        color: '#166534',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '25px',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '15px',
                        border: '1px solid #bbf7d0'
                    }}>
                        <CheckCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{ margin: '0 0 10px', fontWeight: '700' }}>Email Sent!</p>
                            <p style={{ margin: 0, color: '#15803d', lineHeight: '1.5' }}>
                                If an account exists with this email address, you will receive a password reset link shortly.
                            </p>
                        </div>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '30px' }}>
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
                                    Sending Link...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.95rem', color: '#666' }}>
                    Remember your password? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
