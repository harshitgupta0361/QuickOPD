import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, Lock, Loader2, Phone, Mail, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('phone'); // phone, email, username
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setLanguage } = useLanguage();

    const handleSendOTP = (e) => {
        e.preventDefault();
        if (!identifier) {
            setError('Please enter your ' + (loginMethod === 'phone' ? 'Phone Number' : 'Email'));
            return;
        }

        // Mock validation for OTP
        const mockUser = JSON.parse(localStorage.getItem('mockUser'));
        if (!mockUser) {
            setError('No registered user found. Please sign up first.');
            return;
        }
        if (loginMethod === 'phone' && mockUser.phone !== identifier) {
            setError('Phone number does not match any account.');
            return;
        }
        if (loginMethod === 'email' && mockUser.email !== identifier) {
            setError('Email does not match any account.');
            return;
        }

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(newOtp);
        setOtp('');
        setError('');
        setLoading(true);
        // Mock sending OTP
        setTimeout(() => {
            setOtpSent(true);
            setLoading(false);
            // OTP is sent
            alert(`Your QuickOPD verification OTP is: ${newOtp}`);
        }, 1000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = loginMethod === 'username' 
                ? { identifier, password } 
                : { identifier, otp, loginMethod };
                
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.preferredLanguage) {
                    setLanguage(data.user.preferredLanguage);
                }
                navigate('/');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            // Mock fallback if backend is not running
            const mockUser = JSON.parse(localStorage.getItem('mockUser'));
            
            if (!mockUser) {
                setError('No registered user found. Please sign up first.');
            } else if (loginMethod === 'phone' && otpSent) {
                if (mockUser.phone !== identifier) {
                    setError('Phone number does not match any account.');
                } else if (otp !== generatedOtp) {
                    setError('Invalid OTP. Please enter the code we sent.');
                } else {
                    localStorage.setItem('user', JSON.stringify(mockUser));
                    setLanguage(mockUser.preferredLanguage || 'en');
                    navigate('/');
                }
            } else if (loginMethod === 'email' && otpSent) {
                if (mockUser.email !== identifier) {
                    setError('Email does not match any account.');
                } else if (otp !== generatedOtp) {
                    setError('Invalid OTP. Please enter the code we sent.');
                } else {
                    localStorage.setItem('user', JSON.stringify(mockUser));
                    setLanguage(mockUser.preferredLanguage || 'en');
                    navigate('/');
                }
            } else if (loginMethod === 'username' && identifier && password) {
                if (mockUser.username === identifier && mockUser.password === password) {
                    localStorage.setItem('user', JSON.stringify(mockUser));
                    setLanguage(mockUser.preferredLanguage || 'en');
                    navigate('/');
                } else {
                    setError('Invalid username or password.');
                }
            } else {
                setError('Invalid login details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = () => {
        const guestUser = { id: 'guest_' + Date.now(), name: 'Guest User', preferredLanguage: 'en', isGuest: true };
        localStorage.setItem('user', JSON.stringify(guestUser));
        setLanguage('en');
        navigate('/');
    };

    return (
        <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2>Welcome Back</h2>
                    <p className="text-muted">Login to your QuickOPD account</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    <button 
                        type="button"
                        onClick={() => { setLoginMethod('phone'); setOtpSent(false); setGeneratedOtp(''); setOtp(''); setError(''); setIdentifier(''); }}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: 'none', background: loginMethod === 'phone' ? 'var(--primary)' : 'transparent', color: loginMethod === 'phone' ? 'white' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem', fontWeight: '500' }}
                    >Phone</button>
                    <button 
                        type="button"
                        onClick={() => { setLoginMethod('email'); setOtpSent(false); setGeneratedOtp(''); setOtp(''); setError(''); setIdentifier(''); }}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: 'none', background: loginMethod === 'email' ? 'var(--primary)' : 'transparent', color: loginMethod === 'email' ? 'white' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem', fontWeight: '500' }}
                    >Email</button>
                    <button 
                        type="button"
                        onClick={() => { setLoginMethod('username'); setOtpSent(false); setGeneratedOtp(''); setOtp(''); setError(''); setIdentifier(''); }}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: 'none', background: loginMethod === 'username' ? 'var(--primary)' : 'transparent', color: loginMethod === 'username' ? 'white' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem', fontWeight: '500' }}
                    >Username</button>
                </div>

                {error && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={loginMethod === 'username' || otpSent ? handleLogin : handleSendOTP}>
                    <div className="form-group">
                        <label className="form-label">
                            {loginMethod === 'phone' && 'Phone Number'}
                            {loginMethod === 'email' && 'Email Address'}
                            {loginMethod === 'username' && 'Username'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            {loginMethod === 'phone' && <Phone size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />}
                            {loginMethod === 'email' && <Mail size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />}
                            {loginMethod === 'username' && <UserCircle size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />}
                            <input 
                                type={loginMethod === 'email' ? 'email' : 'text'} 
                                className="form-control" 
                                style={{ paddingLeft: '2.5rem' }}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={otpSent}
                                required 
                            />
                        </div>
                    </div>
                    
                    {loginMethod === 'username' ? (
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    className="form-control" 
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '0.75rem',
                                        transform: 'translateY(-50%)',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    ) : otpSent ? (
                        <div className="form-group animate-fade-in">
                            <label className="form-label">Enter OTP</label>
                            <div style={{ position: 'relative' }}>
                                <CheckCircle2 size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ paddingLeft: '2.5rem', letterSpacing: '0.25rem', fontWeight: 'bold' }}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="----"
                                    maxLength="6"
                                    required 
                                />
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>Change {loginMethod === 'phone' ? 'number' : 'email'}</button>
                            </div>
                        </div>
                    ) : null}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : (
                            loginMethod === 'username' ? 'Login' :
                            otpSent ? 'Verify & Login' : 'Send OTP'
                        )}
                    </button>

                    <button 
                        type="button" 
                        onClick={handleGuestLogin} 
                        className="btn" 
                        style={{ width: '100%', marginTop: '0.75rem', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                    >
                        Continue as Guest
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
