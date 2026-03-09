import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const Register = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
        is_subscribed: false
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, user } = useAuth();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([{ label: 'Create Account', path: '/register' }]);
        if (user) {
            navigate('/account');
        }
        return () => setBreadcrumbs([]);
    }, [user, navigate, setBreadcrumbs]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setSubmitting(true);

        const result = await register({
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            password: formData.password,
            is_subscribed: formData.is_subscribed
        });

        if (result.success) {
            navigate('/account');
        } else {
            setError(result.error || 'Failed to create account. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            padding: '60px 20px'
        }}>
            <div style={{
                maxWidth: '550px',
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
                        <UserPlus size={30} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 10px', color: '#111' }}>Create Account</h1>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>Join the AV Gear community today</p>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#333', textTransform: 'uppercase' }}>First Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                <input
                                    type="text"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleChange}
                                    required
                                    placeholder="John"
                                    style={{
                                        width: '100%',
                                        padding: '12px 15px 12px 45px',
                                        borderRadius: '12px',
                                        border: '1px solid #ddd',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        background: '#fcfcfc'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#333', textTransform: 'uppercase' }}>Last Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                <input
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleChange}
                                    required
                                    placeholder="Doe"
                                    style={{
                                        width: '100%',
                                        padding: '12px 15px 12px 45px',
                                        borderRadius: '12px',
                                        border: '1px solid #ddd',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        background: '#fcfcfc'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#333', textTransform: 'uppercase' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="john.doe@example.com"
                                style={{
                                    width: '100%',
                                    padding: '12px 15px 12px 45px',
                                    borderRadius: '12px',
                                    border: '1px solid #ddd',
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                    background: '#fcfcfc'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#333', textTransform: 'uppercase' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '12px 45px 12px 45px',
                                        borderRadius: '12px',
                                        border: '1px solid #ddd',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        background: '#fcfcfc'
                                    }}
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
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#333', textTransform: 'uppercase' }}>Confirm</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '12px 45px 12px 45px',
                                        borderRadius: '12px',
                                        border: '1px solid #ddd',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        background: '#fcfcfc'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            name="is_subscribed"
                            id="is_subscribed"
                            checked={formData.is_subscribed}
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="is_subscribed" style={{ fontSize: '0.9rem', color: '#666', cursor: 'pointer' }}>
                            Sign up for our newsletter
                        </label>
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
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.95rem', color: '#666' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
