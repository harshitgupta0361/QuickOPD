import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Banknote, CheckCircle2, Hospital, User, Clock, MapPin, Download, AlertTriangle, Smartphone, XCircle, Clock4, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { facility, deptName } = location.state || {};

    const [paymentMethod, setPaymentMethod] = useState(null); // 'online' or 'visit'
    const [onlineSubMethod, setOnlineSubMethod] = useState('upi'); // 'credit', 'debit', 'upi'
    const [bookingState, setBookingState] = useState(null); // null -> 'upi-pending' -> 'processing' -> {token, qrPayload} -> 'rejected' -> 'timeout'
    
    // UPI Timer State
    const [timeLeft, setTimeLeft] = useState(180);
    const [showUpiModal, setShowUpiModal] = useState(false);

    useEffect(() => {
        if (!facility) {
            console.error("Payment page: facility is missing from location.state. Redirecting back in 3s...");
            const t = setTimeout(() => navigate(-1), 3000);
            return () => clearTimeout(t);
        }
    }, [facility, navigate]);

    useEffect(() => {
        let timer;
        if (bookingState === 'upi-pending' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (bookingState === 'upi-pending' && timeLeft === 0) {
            setBookingState('timeout');
            setShowUpiModal(false);
        }
        return () => clearInterval(timer);
    }, [bookingState, timeLeft]);

    if (!facility) {
        return (
            <div className="container animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <h2>Error Loading Payment Details</h2>
                <p className="text-muted">Missing facility information. Redirecting back...</p>
            </div>
        );
    }

    const generateAppointmentTime = (timingsStr) => {
        try {
            if (!timingsStr || !timingsStr.includes('-')) return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            const [startStr, endStr] = timingsStr.split('-').map(s => s.trim());
            
            const parseTime = (timeStr) => {
                const [time, period] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                return hours * 60 + (minutes || 0);
            };
            
            const startMins = parseTime(startStr);
            const endMins = parseTime(endStr);
            
            const randomMins = startMins + Math.floor(Math.random() * (endMins - startMins));
            const h = Math.floor(randomMins / 60);
            const m = randomMins % 60;
            
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            const displayM = m < 10 ? '0' + m : m;
            
            return `${displayH}:${displayM} ${period}`;
        } catch(e) {
            return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
    };

    const handleConfirmBooking = (isUpiSuccess = false) => {
        if (!paymentMethod && !isUpiSuccess) return;

        if (!isUpiSuccess && paymentMethod === 'online') {
            if (onlineSubMethod !== 'upi') {
                alert("Only UPI is supported currently as the website is under production.");
                return;
            }
            // Go to UPI Pending state
            setBookingState('upi-pending');
            setTimeLeft(180);
            return;
        }

        // Processing state for generating final appointment
        setBookingState('processing');

        setTimeout(() => {
            const patientData = JSON.parse(localStorage.getItem('triagePatientDetails')) || {
                name: 'Guest User', phone: 'N/A', age: 'N/A', gender: 'N/A', bloodGroup: 'N/A'
            };
            const triageData = JSON.parse(localStorage.getItem('triageResult')) || {
                transcript: 'None provided'
            };

            const tokenNo = `TKN-${Math.floor(Math.random() * 90000) + 10000}`;
            const generatedTime = generateAppointmentTime(facility.timings);

            const payload = {
                tokenNo,
                hospital: facility.name,
                doctor: facility.doctor,
                patient: patientData,
                triageReport: triageData.transcript,
                paymentMode: isUpiSuccess ? 'Online (UPI)' : 'Pay on Visit',
                appointmentTime: generatedTime,
                timestamp: new Date().toISOString()
            };

            const existingAppointments = JSON.parse(localStorage.getItem('myAppointments') || '[]');
            const newAppointment = {
                id: Date.now(),
                department: deptName,
                doctor: facility.doctor,
                hospital: facility.name,
                status: 'Confirmed',
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
                time: generatedTime,
                payload
            };
            
            existingAppointments.unshift(newAppointment);
            localStorage.setItem('myAppointments', JSON.stringify(existingAppointments));

            setBookingState({
                token: tokenNo,
                qrPayload: JSON.stringify(payload),
                appointmentTime: generatedTime
            });
        }, 1500);
    };

    const handleUpiCancel = () => {
        setShowUpiModal(false);
        setBookingState('rejected');
    };

    const handleUpiPay = () => {
        setShowUpiModal(false);
        handleConfirmBooking(true);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const downloadQR = () => {
        if (!bookingState || !bookingState.token) return;
        const svg = document.getElementById('qr-code-svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Appointment_${bookingState.token}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <button className="btn" style={{ background: 'transparent', color: 'var(--text-main)', padding: '0', marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>
                <ArrowLeft style={{ marginRight: '8px' }} /> Back
            </button>

            {bookingState === null ? (
                <>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)', textAlign: 'center' }}>Complete Your Booking</h1>
                    
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Hospital size={20} color="var(--primary)" /> Appointment Details
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Facility</div>
                                <div style={{ fontWeight: '600' }}>{facility.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Doctor</div>
                                <div style={{ fontWeight: '600' }}>{facility.doctor} ({deptName})</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Consultation Fee</div>
                                <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '1.1rem' }}>{facility.charges}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Timings</div>
                                <div style={{ fontWeight: '600' }}>{facility.timings}</div>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ marginBottom: '1rem' }}>Select Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        
                        {/* Pay Online Option */}
                        <div 
                            style={{ 
                                border: `2px solid ${paymentMethod === 'online' ? 'var(--primary)' : 'var(--border)'}`, 
                                borderRadius: '1rem', 
                                padding: '1.5rem', 
                                background: 'var(--surface)', 
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                            onClick={() => setPaymentMethod('online')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: paymentMethod === 'online' ? 'var(--primary)' : 'var(--background)', color: paymentMethod === 'online' ? 'white' : 'var(--text-muted)', padding: '1rem', borderRadius: '50%', transition: 'var(--transition)' }}>
                                    <CreditCard size={28} />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Pay Online</h4>
                                    <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Secure online payment.</p>
                                </div>
                            </div>

                            {/* Sub-options for Online Payment */}
                            {paymentMethod === 'online' && (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                                    
                                    {/* Credit Card */}
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${onlineSubMethod === 'credit' ? 'var(--primary)' : 'var(--border)'}`, background: onlineSubMethod === 'credit' ? 'rgba(79,70,229,0.05)' : 'var(--background)', cursor: 'pointer' }}
                                        onClick={() => setOnlineSubMethod('credit')}
                                    >
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--primary)', padding: '2px' }}>
                                            {onlineSubMethod === 'credit' && <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                                        </div>
                                        <div style={{ fontWeight: '500' }}>Credit Card</div>
                                    </div>

                                    {/* Debit Card */}
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${onlineSubMethod === 'debit' ? 'var(--primary)' : 'var(--border)'}`, background: onlineSubMethod === 'debit' ? 'rgba(79,70,229,0.05)' : 'var(--background)', cursor: 'pointer' }}
                                        onClick={() => setOnlineSubMethod('debit')}
                                    >
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--primary)', padding: '2px' }}>
                                            {onlineSubMethod === 'debit' && <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                                        </div>
                                        <div style={{ fontWeight: '500' }}>Debit Card</div>
                                    </div>

                                    {/* UPI */}
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${onlineSubMethod === 'upi' ? 'var(--primary)' : 'var(--border)'}`, background: onlineSubMethod === 'upi' ? 'rgba(79,70,229,0.05)' : 'var(--background)', cursor: 'pointer' }}
                                        onClick={() => setOnlineSubMethod('upi')}
                                    >
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--primary)', padding: '2px' }}>
                                            {onlineSubMethod === 'upi' && <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                                        </div>
                                        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: '500' }}>UPI</span>
                                            <span style={{ fontSize: '0.75rem', background: 'var(--secondary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>Recommended</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                        Note: As the website is under production, only UPI is actively simulated.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pay on Visit Option */}
                        <div 
                            style={{ 
                                border: `2px solid ${paymentMethod === 'visit' ? 'var(--primary)' : 'var(--border)'}`, 
                                borderRadius: '1rem', 
                                padding: '1.5rem', 
                                background: 'var(--surface)', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'var(--transition)'
                            }}
                            onClick={() => setPaymentMethod('visit')}
                        >
                            <div style={{ background: paymentMethod === 'visit' ? 'var(--primary)' : 'var(--background)', color: paymentMethod === 'visit' ? 'white' : 'var(--text-muted)', padding: '1rem', borderRadius: '50%', transition: 'var(--transition)' }}>
                                <Banknote size={28} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Pay on Visit</h4>
                                <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pay directly at the clinic reception.</p>
                                
                                {paymentMethod === 'visit' && (
                                    <div style={{ marginTop: '1rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#F59E0B' }}>
                                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4' }}>
                                            Important: You must visit the place 30 mins prior to the appointment else your slot will be cancelled.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '2rem' }}
                        disabled={!paymentMethod}
                        onClick={() => handleConfirmBooking()}
                    >
                        Proceed
                    </button>
                </>
            ) : bookingState === 'upi-pending' ? (
                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem', textAlign: 'center' }}>
                    <Smartphone size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Scan QR to Pay</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Amount: <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{facility.charges}</span></p>

                    <div 
                        style={{ 
                            background: 'white', 
                            padding: '1.5rem', 
                            borderRadius: '1rem', 
                            border: '1px solid var(--border)', 
                            display: 'inline-block', 
                            marginBottom: '1rem', 
                            boxShadow: 'var(--shadow-md)',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                        }}
                        onClick={() => setShowUpiModal(true)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <QRCodeSVG value={`upi://pay?pa=quickopd@upi&pn=QuickOPD&am=${facility.charges.replace(/\D/g, '')}`} size={200} />
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '2rem', fontWeight: '600' }}>
                        (Click the QR code to simulate scanning)
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft > 30 ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        <Clock size={24} /> {formatTime(timeLeft)}
                    </div>
                </div>
            ) : bookingState === 'rejected' ? (
                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                    <XCircle size={72} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Payment Rejected</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The transaction was cancelled or declined.</p>
                    <button className="btn btn-primary" onClick={() => setBookingState(null)}>Try Again</button>
                </div>
            ) : bookingState === 'timeout' ? (
                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                    <Clock4 size={72} color="#F59E0B" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Payment Timeout</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The UPI payment window has expired.</p>
                    <button className="btn btn-primary" onClick={() => setBookingState(null)}>Try Again</button>
                </div>
            ) : bookingState === 'processing' ? (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', marginBottom: '2rem' }}></div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h2 style={{ marginBottom: '0.5rem' }}>Confirming Appointment...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Generating your secure token.</p>
                </div>
            ) : (
                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem', textAlign: 'center' }}>
                    <CheckCircle2 size={72} color="var(--secondary)" style={{ marginBottom: '1.5rem' }} />
                    <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '2.5rem' }}>Booking Confirmed!</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1.1rem' }}>Show this QR code at {facility.name}</p>

                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.75rem 1.5rem', borderRadius: '2rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} /> Appointment Time: {bookingState.appointmentTime}
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', display: 'inline-block', marginBottom: '2rem', boxShadow: 'var(--shadow-md)' }}>
                        <QRCodeSVG id="qr-code-svg" value={bookingState.qrPayload} size={220} />
                    </div>

                    <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', marginBottom: '2rem' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Token Number</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '3px' }}>{bookingState.token}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px' }}>
                        <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={downloadQR}
                        >
                            <Download size={20} /> Download QR
                        </button>
                        <button 
                            className="btn btn-secondary glass" 
                            style={{ flex: 1, color: 'var(--text-main)' }}
                            onClick={() => navigate('/appointments')}
                        >
                            View Appointments
                        </button>
                    </div>
                </div>
            )}

            {/* Simulated UPI Gateway Modal */}
            {showUpiModal && (
                <div className="modal-overlay active" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                        <button onClick={() => setShowUpiModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={24} />
                        </button>
                        
                        <div style={{ background: 'var(--primary)', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Banknote size={32} />
                        </div>
                        
                        <h2 style={{ marginBottom: '0.5rem' }}>Mock UPI Gateway</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Simulating scan via phone camera.</p>
                        
                        <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Paying to</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem' }}>QuickOPD Services</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount</div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{facility.charges}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary glass" style={{ flex: 1, color: 'var(--danger)' }} onClick={handleUpiCancel}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpiPay}>
                                Pay Securely
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;
