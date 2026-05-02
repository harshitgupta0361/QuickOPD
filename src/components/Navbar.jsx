import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, LogOut, User, Moon, Sun, Trash2, Calendar, ChevronDown, X, Lock, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import blogo from '../assets/blogo.png';

const Navbar = () => {
    const { t, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [showContactModal, setShowContactModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setLanguage('en');
        setDropdownOpen(false);
        navigate('/login');
    };

    const confirmDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteError('');
        setDeleteLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/auth/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, password: deletePassword })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.clear();
                setLanguage('en');
                setShowDeleteModal(false);
                navigate('/login');
            } else {
                setDeleteError(data.error || 'Failed to delete account');
            }
        } catch (err) {
            setDeleteError('Network error. Is the backend running?');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <nav className="navbar glass">
                <Link to="/" className="nav-brand">
                    <img src={blogo} alt="QuickOPD Logo" style={{ height: '44px', width: '44px', objectFit: 'contain' }} /> QuickOPD
                </Link>
                {!isAuthPage && (
                    <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/">{t('nav.home')}</Link>

                        {location.pathname !== '/' && (
                            <>
                                <Link to="/triage">{t('nav.voice_agent')}</Link>
                                <Link to="/questionnaire">{t('nav.nerve_ai')}</Link>
                            </>
                        )}

                        <a href="#" onClick={(e) => { e.preventDefault(); setShowContactModal(true); }}>Contact</a>

                        {user ? (
                            <div className={`dropdown-container ${dropdownOpen ? 'active' : ''}`} ref={dropdownRef}>
                                <button
                                    className="btn btn-secondary glass"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)', cursor: 'pointer' }}
                                >
                                    <User size={16} />
                                    {user.name || user.fullName || user.username || 'My Account'}
                                    <ChevronDown size={14} />
                                </button>

                                <div className="dropdown-menu">
                                    <Link to="/account" className="dropdown-item" onClick={() => setDropdownOpen(false)} style={{ textDecoration: 'none' }}>
                                        <User size={18} /> Account Details
                                    </Link>
                                    <Link to="/appointments" className="dropdown-item" onClick={() => setDropdownOpen(false)} style={{ textDecoration: 'none' }}>
                                        <Calendar size={18} /> My Appointments
                                    </Link>

                                    <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>

                                    <div style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Settings</div>

                                    <button className="dropdown-item" onClick={() => { toggleTheme(); setDropdownOpen(false); }}>
                                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                    </button>

                                    <button className="dropdown-item" onClick={handleLogout}>
                                        <LogOut size={18} /> Logout
                                    </button>

                                    <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>

                                    <button className="dropdown-item danger" onClick={() => { setShowDeleteModal(true); setDropdownOpen(false); }}>
                                        <Trash2 size={18} color="var(--danger)" />
                                        <span style={{ color: 'var(--danger)' }}>Delete Account</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.75rem' }}>Login</Link>
                        )}
                    </div>
                )}
            </nav>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
                                <Trash2 size={24} /> Delete Account
                            </h3>
                            <button className="modal-close" onClick={() => { setShowDeleteModal(false); setDeleteError(''); setDeletePassword(''); }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                Are you sure you want to delete your account? This action is <strong>irreversible</strong> and will delete all your user data.
                            </p>

                            {deleteError && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{deleteError}</div>}

                            <form onSubmit={confirmDeleteAccount}>
                                <div className="form-group">
                                    <label className="form-label">Verify Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={20} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="password"
                                            className="form-control"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </div>
                                    <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                        (If you logged in via OTP without a password, enter 'OTP_TEMP_ACCOUNT_CONFIRM' as your password)
                                    </small>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" className="btn" onClick={() => setShowDeleteModal(false)} style={{ flex: 1, background: 'var(--border)', color: 'var(--text-main)' }}>Cancel</button>
                                    <button type="submit" className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white' }} disabled={deleteLoading}>
                                        {deleteLoading ? <Loader2 className="animate-spin" /> : 'Delete'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Details Modal */}
            {showContactModal && (
                <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ color: 'var(--primary)' }}>
                                <User size={24} /> Contact Details
                            </h3>
                            <button className="modal-close" onClick={() => setShowContactModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center' }}>
                            <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>Harshit Gupta</h4>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Website Owner</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Email:</span>
                                    <a href="mailto:quickopdindia@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>quickopdindia@gmail.com</a>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                    <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Phone:</span>
                                    <a href="tel:+917991616" style={{ color: 'var(--primary)', textDecoration: 'none' }}>+91 7991616###</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
