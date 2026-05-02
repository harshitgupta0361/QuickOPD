import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserCircle, Mail, Phone, Lock, Globe, Loader2 } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        fullName: '', phone: '', email: '', username: '', password: '', preferredLanguage: 'en'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                navigate('/login');
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            // Mock fallback if backend is not running
            console.log("Mocking signup for:", formData);
            localStorage.setItem('mockUser', JSON.stringify(formData));
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)', padding: '2rem 0' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2>Create an Account</h2>
                    <p className="text-muted">Join QuickOPD for faster medical assistance</p>
                </div>

                {error && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSignup}>
                    <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                                <input type="text" name="fullName" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.fullName} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Phone Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                                <input type="tel" name="phone" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.phone} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                            <input type="email" name="email" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.email} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <div style={{ position: 'relative' }}>
                            <UserCircle size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                            <input type="text" name="username" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.username} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                            <input type="password" name="password" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.password} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Preferred Language</label>
                        <div style={{ position: 'relative' }}>
                            <Globe size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                            <select name="preferredLanguage" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.preferredLanguage} onChange={handleChange}>
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
