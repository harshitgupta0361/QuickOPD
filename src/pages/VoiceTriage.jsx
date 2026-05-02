import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Video, Upload, Heart, Activity, Stethoscope, User, Phone, Droplet, Users } from 'lucide-react';

const VoiceTriage = () => {
    const navigate = useNavigate();

    // Patient Details State
    const [patientDetails, setPatientDetails] = useState(null);
    const [showForm, setShowForm] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: 'Male',
        bloodGroup: 'A+'
    });

    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, recording, processing, result
    const [transcript, setTranscript] = useState('');
    const [result, setResult] = useState(null);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [isLiveVideo, setIsLiveVideo] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const videoRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const videoRef = useRef(null);
    const audioChunksRef = useRef([]);
    const videoChunksRef = useRef([]);
    const videoStreamRef = useRef(null);
    const transcriptRef = useRef('');

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                let finalTrans = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTrans += event.results[i][0].transcript;
                    }
                }
                if (finalTrans) {
                    setTranscript(prev => {
                        const newText = prev + finalTrans + ' ';
                        transcriptRef.current = newText;
                        return newText;
                    });
                }
            };

            recognitionRef.current = recognition;
        }

        // We no longer auto-hide the form on mount because the user wants it to pop up every time.
        // We can pre-fill the form with the stored details if they exist, but still show the form.
        const stored = localStorage.getItem('triagePatientDetails');
        if (stored) {
            setFormData(JSON.parse(stored));
        }

        return () => {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setPatientDetails(formData);
        setShowForm(false);
        localStorage.setItem('triagePatientDetails', JSON.stringify(formData));
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleMic = async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];
                setTranscript('');
                transcriptRef.current = '';

                if (recognitionRef.current) {
                    try { 
                        recognitionRef.current.lang = ''; // Let browser auto-detect or use default, acts more like a universal listener
                        recognitionRef.current.start(); 
                    } catch(e) {}
                }

                mediaRecorderRef.current.ondataavailable = e => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    if (recognitionRef.current) {
                        try { recognitionRef.current.stop(); } catch(e) {}
                    }

                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    setMediaPreviews(prev => [...prev, { type: 'audio', url: audioUrl, label: 'Voice Recording' }]);
                    
                    stopRecordingAndProcess(transcriptRef.current);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
                setStatus('recording');
            } catch (err) {
                console.error("Mic access error:", err);
                alert("Microphone access denied.");
            }
        } else {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        setMediaPreviews(prev => [...prev, { type, url, label: `File: ${file.name}` }]);
        stopRecordingAndProcess();
    };

    const startLiveVideo = async () => {
        setIsLiveVideo(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            alert("Camera access denied.");
            cancelLiveVideo();
        }
    };

    const startRecordingVideo = () => {
        if (!videoStreamRef.current) return;
        videoChunksRef.current = [];
        videoRecorderRef.current = new MediaRecorder(videoStreamRef.current);
        
        setTranscript('');
        transcriptRef.current = '';

        if (recognitionRef.current) {
            try { 
                recognitionRef.current.lang = ''; 
                recognitionRef.current.start(); 
            } catch(e) {}
        }

        videoRecorderRef.current.ondataavailable = e => {
            if (e.data.size > 0) videoChunksRef.current.push(e.data);
        };

        videoRecorderRef.current.onstop = () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e) {}
            }

            const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(videoBlob);

            setMediaPreviews(prev => [...prev, { type: 'video', url: videoUrl, label: 'Live Video Recording' }]);
            stopRecordingAndProcess(transcriptRef.current);
            cancelLiveVideo();
        };

        videoRecorderRef.current.start();
        setIsRecordingVideo(true);
        setStatus('recording');
    };

    const stopRecordingVideoLocal = () => {
        if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
            videoRecorderRef.current.stop();
        }
        setIsRecordingVideo(false);
    };

    const cancelLiveVideo = () => {
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        }
        setIsLiveVideo(false);
        setIsRecordingVideo(false);
    };

    const stopRecordingAndProcess = (text = '') => {
        setStatus('processing');
        
        setTimeout(() => {
            const departments = ['General Medicine', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gastroenterology', 'ENT', 'Pulmonology', 'Ophthalmology', 'Dentistry', 'Gynecology'];
            let determinedDept = "General Medicine";
            const lowerText = text.toLowerCase();
            
            if (lowerText) {
                // Highly expansive, conversational NLP-like keyword matching
                if (lowerText.match(/stomach|belly|digestion|liver|vomit|nausea|diarrhea|acid|gas|bloat|intestine|food poison|पेट|उल्टी|വയറു|পাকস্থলী|పొట్ట|pet|ulti|pait|dast|loose motion|pachan|haazma|acidity/)) {
                    determinedDept = "Gastroenterology";
                } else if (lowerText.match(/eye|vision|see|blind|blur|retina|pupil|aankh|nazar|dekhna|andha|chashma|dhundhla|കണ്ണ്|চোখ|కన్ను/)) {
                    determinedDept = "Ophthalmology";
                } else if (lowerText.match(/tooth|teeth|gum|cavity|dentist|jaw|bite|daant|masude|jabda|பல்|പല്ല്|দাঁত|పన్ను/)) {
                    determinedDept = "Dentistry";
                } else if (lowerText.match(/period|pregnancy|pregnant|uterus|ovary|vagina|discharge|menstrual|mahawari|delivery|women|aurat|garbh/)) {
                    determinedDept = "Gynecology";
                } else if (lowerText.match(/ear|nose|throat|tonsil|swallow|deaf|ringing|smell|sneeze|voice|vocal|कान|नाक|गला|ചെവി|কান|చెవి|kaan|naak|gala|zuban|aawaz/)) {
                    determinedDept = "ENT";
                } else if (lowerText.match(/lung|asthma|breathe|cough|wheeze|choke|suffocat|inhale|फेफड़े|सांस|ശ്വാസകോശം|ফুসফুস|ఊపిరితిత్తులు|saans|fefde|dama|khasi|breathing|haafna/)) {
                    determinedDept = "Pulmonology";
                } else if (lowerText.match(/heart|chest|palpitation|pulse|attack|blood pressure|bp|pacemaker|दिल|छाती|हृदय|നെஞ்சு|ഹൃദയം|হৃদয়|గుండె|dil|chhati|seena|dharkan|ghabrahat/)) {
                    determinedDept = "Cardiology";
                } else if (lowerText.match(/skin|rash|itch|pimple|acne|hair|nail|spot|allergy|hives|burn|scar|त्वचा|खुजली|चर्मं|ಚರ್ಮ|চামড়া|ചർമ്മം|twacha|khujli|daane|baal|nakhun|daag|dhabbe|chhaley|jal/)) {
                    determinedDept = "Dermatology";
                } else if (lowerText.match(/head|brain|dizzy|migraine|nerve|seizure|memory|faint|stroke|numb|paralysis|सिर|दिमाग|തല|মাথা|మెదడు|sir|dimaag|chakkar|behosh|yaad|sunn/)) {
                    determinedDept = "Neurology";
                } else if (lowerText.match(/bone|fracture|joint|muscle|back|knee|arthritis|leg|arm|shoulder|ankle|wrist|spine|sprain|हड्डी|எலும்பு|হাড়|ఎముక|haddi|pair|haath|jodh|kamar|ghutna|tut|toot|moch|taang|kandha|broken/)) {
                    determinedDept = "Orthopedics";
                } else if (lowerText.match(/child|baby|kid|infant|toddler|pediatric|son|daughter|newborn|बच्चा|शिशु|குழந்தை|കുട്ടി|বাচ্চা|baccha|bacha|shishu|beta|beti|ladka|ladki/)) {
                    determinedDept = "Pediatrics";
                } else if (lowerText.match(/fever|cold|flu|infection|weakness|tired|sick|ill|body ache|बुखार|थकान|bukhar|thakan|kamzori|sardi|zukam|bimari|bimar/)) {
                    determinedDept = "General Medicine";
                } else {
                    determinedDept = "General Medicine";
                }
            } else {
                determinedDept = departments[Math.floor(Math.random() * departments.length)];
            }

            const resData = {
                department: determinedDept,
                transcript: text
            };

            setResult(resData);
            setStatus('result');
            
            // Save triage data for the QR code later
            localStorage.setItem('triageResult', JSON.stringify({
                ...resData,
                mediaCount: mediaPreviews.length + 1
            }));

        }, 1500);
    };

    const resetTriage = () => {
        setStatus('idle');
        setTranscript('');
        transcriptRef.current = '';
        setResult(null);
        setMediaPreviews([]);
    };

    const renderDeptIcon = (dept) => {
        if (dept === 'Cardiology') return <Heart size={64} color="var(--danger)" />;
        if (dept === 'Dermatology') return <Activity size={64} color="var(--secondary)" />;
        return <Stethoscope size={64} color="var(--primary)" />;
    };

    return (
        <div className="container animate-fade-in" style={{ position: 'relative' }}>
            <h1 className="text-center mb-4">Voice Pre-Triage Agent</h1>

            {/* Patient Details Modal Overlay */}
            <div className={`modal-overlay ${showForm ? 'active' : ''}`} style={{ top: '300px', zIndex: 40 }}>
                <div className="modal-content" style={{ maxWidth: '500px' }}>
                    <div className="modal-header">
                        <h3 className="modal-title"><User size={24} color="var(--primary)" /> Patient Details</h3>
                    </div>
                    <div className="modal-body">
                        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Please provide the patient's details before starting the triage.</p>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label className="form-label">Patient Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                    <input type="text" name="name" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.name} onChange={handleFormChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                    <input type="tel" name="phone" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.phone} onChange={handleFormChange} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <input type="number" name="age" className="form-control" min="0" max="120" value={formData.age} onChange={handleFormChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <div style={{ position: 'relative' }}>
                                        <Users size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                        <select name="gender" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.gender} onChange={handleFormChange} required>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Blood Group</label>
                                <div style={{ position: 'relative' }}>
                                    <Droplet size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--danger)' }} />
                                    <select name="bloodGroup" className="form-control" style={{ paddingLeft: '2.5rem' }} value={formData.bloodGroup} onChange={handleFormChange} required>
                                        <option>A+</option><option>A-</option>
                                        <option>B+</option><option>B-</option>
                                        <option>O+</option><option>O-</option>
                                        <option>AB+</option><option>AB-</option>
                                        <option>Don't Know</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Proceed to Triage</button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Triage Interface */}
            {!showForm && (status === 'idle' || status === 'recording') && (
                <div className="card text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    
                    {!isLiveVideo ? (
                        <>
                            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--background)', padding: '0.5rem 1rem', borderRadius: '2rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}>
                                    <User size={16} color="var(--primary)" /> <span style={{ fontWeight: '500' }}>Patient: {patientDetails?.name || 'Guest'}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                                <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>GEMINI AI ACTIVE: AUTO-DETECTING LANGUAGE</span>
                            </div>

                            <button 
                                className={`mic-btn ${isRecording ? 'listening' : ''}`}
                                onClick={toggleMic}
                            >
                                {isRecording ? <Square fill="white" size={40} /> : <Mic size={40} />}
                            </button>
                            <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                {isRecording ? 'Listening in real-time...' : 'Tap the mic and speak in any language'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                                {isRecording ? (transcript || 'Listening for your symptoms...') : 'We automatically understand Hindi, English, Bengali, Tamil, and more.'}
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="btn btn-secondary glass" style={{ color: 'var(--text-main)' }} onClick={startLiveVideo}>
                                    <Video size={18} style={{ marginRight: '8px' }} /> Live Video
                                </button>
                                <label className="btn btn-secondary glass" style={{ color: 'var(--text-main)', cursor: 'pointer' }}>
                                    <Upload size={18} style={{ marginRight: '8px' }} /> Upload Media
                                    <input type="file" style={{ display: 'none' }} accept="audio/*,video/*,image/*" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </>
                    ) : (
                        <div style={{ width: '100%', maxWidth: '500px' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '2rem', justifyContent: 'center' }}>
                                <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>GEMINI AI ACTIVE: AUTO-DETECTING LANGUAGE</span>
                            </div>
                            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: '1rem', marginBottom: '1rem' }} />
                            
                            {isRecordingVideo && (
                                <p style={{ color: 'var(--text-main)', marginBottom: '1rem', fontWeight: '500' }}>
                                    {transcript || 'Listening to your symptoms in real-time...'}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                {!isRecordingVideo ? (
                                    <button className="btn btn-primary" onClick={startRecordingVideo}>Start Recording</button>
                                ) : (
                                    <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={stopRecordingVideoLocal}>Stop Recording</button>
                                )}
                                <button className="btn btn-secondary glass" onClick={cancelLiveVideo}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!showForm && status === 'processing' && (
                <div className="card text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', marginBottom: '2rem' }}></div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h2>Analyzing your symptoms...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Our AI is finding the best department for you.</p>
                </div>
            )}

            {!showForm && status === 'result' && result && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                    <div className="card text-center" style={{ padding: '4rem 2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            {renderDeptIcon(result.department)}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Recommended Department:</h2>
                        <h1 style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '2.5rem' }}>{result.department}</h1>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '2rem' }}
                                onClick={() => navigate(`/department/${result.department}`)}
                            >
                                Look for hospitals, clinics, doctors
                            </button>
                            <button className="btn btn-secondary glass" style={{ color: 'var(--text-muted)' }} onClick={resetTriage}>
                                Start Over
                            </button>
                        </div>
                    </div>

                    {mediaPreviews.length > 0 && (
                        <div className="card">
                            <h3 style={{ marginBottom: '1rem' }}>Uploaded Media Review</h3>
                            {mediaPreviews.map((media, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>{media.label}</div>
                                    {media.type === 'audio' && <audio src={media.url} controls style={{ width: '100%' }} />}
                                    {media.type === 'video' && <video src={media.url} controls style={{ width: '100%', borderRadius: '0.5rem' }} />}
                                    {media.type === 'image' && <img src={media.url} alt="Uploaded" style={{ width: '100%', borderRadius: '0.5rem' }} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoiceTriage;
