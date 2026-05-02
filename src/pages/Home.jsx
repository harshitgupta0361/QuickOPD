import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import { Mic, Bot, ChevronDown, ChevronUp, Heart, Brain, Bone, Baby, Wind, Stethoscope, Activity, Eye, Ear, Headset, UserSquare2, Ribbon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import blogo from '../assets/blogo.png';

const DEPARTMENTS = [
    { name: 'Cardiology', desc: 'Heart and circulatory system', icon: Heart, primary: true },
    { name: 'Neurology', desc: 'Brain and nervous system', icon: Brain, primary: true },
    { name: 'Orthopedics', desc: 'Bones, joints, and muscles', icon: Bone, primary: true },
    { name: 'Pediatrics', desc: 'Child and infant care', icon: Baby, primary: false },
    { name: 'Pulmonology', desc: 'Respiratory and lung conditions', icon: Wind, primary: false },
    { name: 'GeneralMedicine', label: 'General Medicine', desc: 'Fever, infections, basic care', icon: Stethoscope, primary: false },
    { name: 'Dermatology', desc: 'Skin, hair, and nail conditions', icon: Activity, primary: false },
    { name: 'Ophthalmology', desc: 'Eye and vision care', icon: Eye, primary: false },
    { name: 'ENT', desc: 'Ear, nose, and throat issues', icon: Ear, primary: false },
    { name: 'Psychiatry', desc: 'Mental health and counseling', icon: Headset, primary: false },
    { name: 'Gynecology', desc: "Women's health and pregnancy", icon: UserSquare2, primary: false },
    { name: 'Oncology', desc: 'Cancer treatment and care', icon: Ribbon, primary: false },
];

const Home = () => {
    const [showMore, setShowMore] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const displayedDepartments = showMore ? DEPARTMENTS : DEPARTMENTS.slice(0, 3);

    return (
        <div className="container animate-fade-in">
            <div className="hero glass">
                <h1>{t('home.hero.title')}</h1>
                <p>{t('home.hero.subtitle')}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/triage" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mic size={20} /> {t('home.btn.voice_triage')}
                    </Link>
                    <Link to="/questionnaire" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bot size={20} /> {t('home.btn.nerve_ai')}
                    </Link>
                </div>
            </div>

            <h2 className="mb-4">{t('home.hospitals_near_you')}</h2>
            <Map />

            <h2 className="mb-4 mt-4">{t('home.departments')}</h2>
            <div className="grid grid-cols-3" id="departments-grid">
                {displayedDepartments.map((dept) => {
                    const Icon = dept.icon;
                    return (
                        <div key={dept.name} className="card dept-card" onClick={() => navigate(`/department/${dept.name}`)}>
                            <Icon size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <h3>{dept.label || dept.name}</h3>
                            <p className="text-muted mt-4" style={{ fontSize: '0.9rem' }}>{dept.desc}</p>
                        </div>
                    );
                })}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '3rem' }}>
                <button 
                    className="btn btn-secondary glass" 
                    onClick={() => {
                        setShowMore(!showMore);
                        if (showMore) {
                            document.getElementById('departments-grid')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }} 
                    style={{ padding: '0.5rem 2rem', borderRadius: '2rem', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}
                >
                    {showMore ? t('home.btn.show_less') : t('home.btn.show_more')} 
                    {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Homepage Footer */}
            <footer style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <img src={blogo} alt="QuickOPD Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
                    <h3 style={{ margin: 0, color: 'var(--primary)', letterSpacing: '1px' }}>QuickOPD™</h3>
                </div>
                <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>&copy; {new Date().getFullYear()} QuickOPD. All rights reserved.</p>
                
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>Email:</span>
                        <a href="mailto:quickopdindia@gmail.com" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>quickopdindia@gmail.com</a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>Phone:</span>
                        <a href="tel:+917991616" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>+91 7991616###</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
