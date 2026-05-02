import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Globe, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Account = () => {
    const { t } = useLanguage();
    const userStr = localStorage.getItem('user');
    const localUser = userStr ? JSON.parse(userStr) : null;
    const [user, setUser] = useState(localUser);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (localUser && localUser.id) {
            fetch(`http://localhost:3000/api/user/${localUser.id}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Failed to fetch");
                })
                .then(data => {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching user data:", err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [localUser?.id]);

    if (!user) return null;

    return (
        <div className="container animate-fade-in">
            <h2 className="mb-4">My Account</h2>
            <div className="card" style={{ maxWidth: '600px', position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                        <Loader2 className="animate-spin" color="var(--primary)" />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <User size={24} color="var(--primary)" />
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>Name</p>
                            <p style={{ fontWeight: '500' }}>{user.name || user.fullName || user.username || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Mail size={24} color="var(--primary)" />
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>Email</p>
                            <p style={{ fontWeight: '500' }}>{user.email || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Phone size={24} color="var(--primary)" />
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>Phone</p>
                            <p style={{ fontWeight: '500' }}>{user.phone || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Globe size={24} color="var(--primary)" />
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>Preferred Language</p>
                            <p style={{ fontWeight: '500' }}>{user.preferredLanguage === 'hi' ? 'Hindi' : 'English'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
