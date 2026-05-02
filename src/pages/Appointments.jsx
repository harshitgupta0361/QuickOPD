import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, XCircle, AlertTriangle, FastForward, CheckCircle2 } from 'lucide-react';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [cancelConfirmId, setCancelConfirmId] = useState(null);
    
    // Debug State for testing multi-day logic
    const [debugTimeOffset, setDebugTimeOffset] = useState(0); 

    const getCurrentTime = () => Date.now() + debugTimeOffset;

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('myAppointments') || '[]');
        const now = getCurrentTime();
        const MS_IN_HOUR = 60 * 60 * 1000;

        const filtered = stored.filter(apt => {
            if (apt.status === 'Confirmed') return true;
            
            if (apt.status === 'Cancelled') {
                const cancelledAt = apt.cancelledAt || apt.id; 
                const ageHours = (now - cancelledAt) / MS_IN_HOUR;
                
                if (apt.payload?.paymentMode === 'Online (UPI)') {
                    if (apt.refundReceivedAt) {
                        const refundAgeHours = (now - apt.refundReceivedAt) / MS_IN_HOUR;
                        if (refundAgeHours >= 24) return false;
                    }
                    // We no longer remove delayed appointments. We keep asking every 12h.
                    return true;
                } else {
                    // Remove non-online cancelled appointments after 72 hours
                    if (ageHours >= 72) return false;
                    return true;
                }
            }
            return true;
        });

        setAppointments(filtered);
        
        // Save back if we cleaned up any appointments
        if (filtered.length !== stored.length) {
            localStorage.setItem('myAppointments', JSON.stringify(filtered));
        }
    }, [debugTimeOffset]);

    const handleCancelRequest = (id) => {
        setCancelConfirmId(id);
    };

    const confirmCancel = () => {
        if (!cancelConfirmId) return;
        
        const aptToCancel = appointments.find(apt => apt.id === cancelConfirmId);
        
        const updated = appointments.map(apt => 
            apt.id === cancelConfirmId ? { ...apt, status: 'Cancelled', cancelledAt: getCurrentTime() } : apt
        );
        
        setAppointments(updated);
        localStorage.setItem('myAppointments', JSON.stringify(updated));

        setCancelConfirmId(null);

        if (aptToCancel && aptToCancel.payload?.paymentMode === 'Online (UPI)') {
            setTimeout(() => {
                alert("Your appointment has been cancelled. Your refund will be reflected in your bank account within 48 hours.");
            }, 100);
        }
    };

    const abortCancel = () => {
        setCancelConfirmId(null);
    };

    const handleRefundResponse = (id, received) => {
        if (received) {
            const isConfirmed = window.confirm("Please reconfirm: Are you absolutely sure you have received your refund in your bank account?");
            if (!isConfirmed) return;
        }

        const updated = appointments.map(apt => {
            if (apt.id === id) {
                if (received) {
                    return { ...apt, refundReceivedAt: getCurrentTime() };
                } else {
                    return { ...apt, refundDelayedAt: getCurrentTime() };
                }
            }
            return apt;
        });
        
        setAppointments(updated);
        localStorage.setItem('myAppointments', JSON.stringify(updated));
    };

    const renderOnlineRefundStatus = (apt) => {
        const now = getCurrentTime();
        const cancelledAt = apt.cancelledAt || apt.id;
        const MS_IN_HOUR = 60 * 60 * 1000;
        const ageHours = (now - cancelledAt) / MS_IN_HOUR;

        const PromptButtons = () => (
            <div style={{ marginTop: '0.75rem', background: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    Did you receive your refund?
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }} onClick={() => handleRefundResponse(apt.id, true)}>
                        Yes, I got it
                    </button>
                    <button className="btn btn-secondary glass" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', color: 'var(--danger)' }} onClick={() => handleRefundResponse(apt.id, false)}>
                        No, still waiting
                    </button>
                </div>
            </div>
        );

        if (apt.refundReceivedAt) {
            return (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} /> Refund received. History will clear in 24 hours.
                </div>
            );
        }

        if (apt.refundDelayedAt) {
            const delayAgeHours = (now - apt.refundDelayedAt) / MS_IN_HOUR;
            
            if (delayAgeHours >= 12) {
                return <PromptButtons />;
            }
            
            return (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                    <div>The organization has been notified about your request. We will check back with you in 12 hours.</div>
                </div>
            );
        }

        if (ageHours >= 48) {
            return <PromptButtons />;
        }

        return (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                Refund will be reflected in your bank account within 48 hours.
            </div>
        );
    };

    return (
        <div className="container animate-fade-in" style={{ position: 'relative', paddingBottom: '100px' }}>
            <h2 className="mb-4">My Appointments</h2>
            {appointments.length === 0 ? (
                <div className="card text-center" style={{ padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📅</div>
                    <h3>No appointments yet</h3>
                    <p>When you book an appointment at a facility, it will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                    {appointments.map(apt => (
                        <div key={apt.id} className="card" style={{ opacity: apt.status === 'Cancelled' ? 0.7 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ color: 'var(--primary)', textDecoration: apt.status === 'Cancelled' ? 'line-through' : 'none' }}>{apt.department}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>{apt.doctor}</p>
                                </div>
                                <span style={{ 
                                    background: apt.status === 'Confirmed' ? 'var(--secondary)' : (apt.status === 'Cancelled' ? '#EF4444' : 'var(--text-muted)'), 
                                    color: 'white', 
                                    padding: '0.2rem 0.6rem', 
                                    borderRadius: '1rem', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold' 
                                }}>{apt.status}</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <Calendar size={16} color="var(--text-muted)" />
                                    <span>{apt.date}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <Clock size={16} color="var(--text-muted)" />
                                    <span>{apt.time}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <MapPin size={16} color="var(--text-muted)" />
                                    <span>{apt.hospital}</span>
                                </div>
                                
                                {apt.status === 'Cancelled' && apt.payload?.paymentMode === 'Online (UPI)' && renderOnlineRefundStatus(apt)}
                                
                                {apt.status !== 'Cancelled' && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--background)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Token No:</span>
                                        <strong style={{ color: 'var(--primary)', letterSpacing: '1px' }}>{apt.payload?.tokenNo}</strong>
                                    </div>
                                )}

                                {apt.status !== 'Cancelled' && (
                                    <button 
                                        onClick={() => handleCancelRequest(apt.id)}
                                        className="btn"
                                        style={{ marginTop: '1rem', width: '100%', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <XCircle size={18} />
                                        Cancel Appointment
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {cancelConfirmId && (
                <div className="modal-overlay active" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                        <div style={{ background: '#EF4444', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <XCircle size={32} />
                        </div>
                        
                        <h2 style={{ marginBottom: '0.5rem' }}>Cancel Appointment?</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary glass" style={{ flex: 1, color: 'var(--text-main)' }} onClick={abortCancel}>
                                Keep It
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, background: '#EF4444', borderColor: '#EF4444' }} onClick={confirmCancel}>
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Tools - Hidden in production, useful for testing timeframes */}
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999, display: 'flex', gap: '0.5rem' }}>
                <button 
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '2rem', background: '#3B82F6', borderColor: '#3B82F6', boxShadow: 'var(--shadow-lg)' }}
                    onClick={() => setDebugTimeOffset(prev => prev + (12 * 60 * 60 * 1000))}
                    title="Simulate passing of 12 hours"
                >
                    <FastForward size={18} /> +12h
                </button>
                <button 
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '2rem', background: '#8B5CF6', borderColor: '#8B5CF6', boxShadow: 'var(--shadow-lg)' }}
                    onClick={() => setDebugTimeOffset(prev => prev + (24 * 60 * 60 * 1000))}
                    title="Simulate passing of 24 hours"
                >
                    <FastForward size={18} /> +24h
                </button>
            </div>
        </div>
    );
};

export default Appointments;
