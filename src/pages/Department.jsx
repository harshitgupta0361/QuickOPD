import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Heart, Brain, Bone, Baby, Wind, Stethoscope, Activity, Eye, Ear, Headset, UserSquare2, Ribbon, MapPin, User, Star, Hospital, Clock, Banknote, Download, CheckCircle2, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LocationAutocomplete from '../components/LocationAutocomplete';

const DEPT_INFO = {
    'Cardiology': { desc: 'Heart and circulatory system', icon: Heart, head: 'Dr. R. Sharma' },
    'Neurology': { desc: 'Brain and nervous system', icon: Brain, head: 'Dr. M. Gupta' },
    'Orthopedics': { desc: 'Bones, joints, and muscles', icon: Bone, head: 'Dr. S. Patel' },
    'Pediatrics': { desc: 'Child and infant care', icon: Baby, head: 'Dr. A. Kumar' },
    'Pulmonology': { desc: 'Respiratory and lung conditions', icon: Wind, head: 'Dr. N. Singh' },
    'GeneralMedicine': { label: 'General Medicine', desc: 'Fever, infections, basic care', icon: Stethoscope, head: 'Dr. V. Desai' },
    'Dermatology': { desc: 'Skin, hair, and nail conditions', icon: Activity, head: 'Dr. P. Joshi' },
    'Ophthalmology': { desc: 'Eye and vision care', icon: Eye, head: 'Dr. K. Iyer' },
    'ENT': { desc: 'Ear, nose, and throat issues', icon: Ear, head: 'Dr. L. Mehta' },
    'Psychiatry': { desc: 'Mental health and counseling', icon: Headset, head: 'Dr. B. Das' },
    'Gynecology': { desc: "Women's health and pregnancy", icon: UserSquare2, head: 'Dr. S. Reddy' },
    'Oncology': { desc: 'Cancer treatment and care', icon: Ribbon, head: 'Dr. A. Banerjee' },
};

const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const createIcon = (color) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color:${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

const getMarkerIcon = (type) => {
    if (type === 'hospital') return createIcon('#EF4444');
    if (type === 'clinic') return createIcon('#F59E0B');
    return createIcon('#10B981');
};

const Department = () => {
    const { name } = useParams();
    const navigate = useNavigate();
    
    const info = DEPT_INFO[name] || DEPT_INFO['GeneralMedicine'];
    const Icon = info.icon;
    const deptName = info.label || name;

    const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 });
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [bookingState, setBookingState] = useState(null); // null -> 'booking' -> {token, qrPayload}

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            }, () => {
                console.log("Geolocation permission denied.");
            });
        }
    }, []);

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const p1 = lat1 * Math.PI/180;
        const p2 = lat2 * Math.PI/180;
        const dp = (lat2-lat1) * Math.PI/180;
        const dl = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    useEffect(() => {
        const fetchFacilities = async () => {
            setLoading(true);
            try {
                const radiusMeters = 10000; // 10km radius
                const query = `[out:json];(node["amenity"="hospital"](around:${radiusMeters},${location.lat},${location.lng});node["amenity"="clinic"](around:${radiusMeters},${location.lat},${location.lng}););out center;`;
                const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
                
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch from Overpass API");
                const data = await response.json();
                
                const allFacs = [];
                data.elements.forEach(el => {
                    if (!el.lat || !el.lon) return;
                    
                    const dist = getDistance(location.lat, location.lng, el.lat, el.lon);
                    if (dist > radiusMeters) return;
                    
                    const type = el.tags.amenity;
                    allFacs.push({
                        id: el.id.toString(),
                        lat: el.lat,
                        lng: el.lon,
                        name: el.tags.name || `Unnamed ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                        type: type,
                        distance: dist,
                        rating: (3.5 + Math.random() * 1.5).toFixed(1),
                        department: type === 'hospital' ? (el.tags.healthcare || 'General') : 'N/A'
                    });
                });

                // Pick the closest 15 facilities for this department
                allFacs.sort((a,b) => a.distance - b.distance);
                const filtered = allFacs.slice(0, 15);
                
                const enhancedFiltered = filtered.map(f => {
                    const seed = f.name.length + (f.lat * 100);
                    const docNames = ['Sharma', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Desai', 'Joshi', 'Iyer', 'Mehta', 'Das', 'Reddy', 'Banerjee'];
                    const randDoc = docNames[Math.floor(Math.abs(seed)) % docNames.length];
                    return {
                        ...f,
                        doctor: `Dr. ${randDoc}`,
                        charges: `₹${Math.floor((Math.abs(seed) % 6) + 4) * 100}`,
                        timings: (seed % 2 === 0) ? "09:00 AM - 05:00 PM" : "10:00 AM - 08:00 PM"
                    };
                });

                setFacilities(enhancedFiltered);
            } catch (err) {
                console.error("Error fetching real-time data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFacilities();
    }, [location.lat, location.lng, name, deptName]);

    const handleBookAppointment = () => {
        navigate('/payment', { state: { facility: selectedFacility, deptName } });
    };



    return (
        <div className="container animate-fade-in">
            <button className="btn" style={{ background: 'transparent', color: 'var(--text-main)', padding: '0', marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>
                <ArrowLeft style={{ marginRight: '8px' }} /> Back
            </button>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
                    <Icon size={48} color="var(--primary)" />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{deptName}</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{info.desc}</p>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1.5rem', gridTemplateColumns: '1fr 400px', transition: 'var(--transition)' }}>
                {/* Map Section */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', height: '600px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} color="var(--primary)"/> Facilities & Specialists</h3>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'var(--background)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                                {loading ? 'Loading...' : `${facilities.length} found`}
                            </span>
                        </div>
                        <LocationAutocomplete onLocationSelect={(lat, lng) => setLocation({ lat, lng })} placeholder="Change location..." />
                    </div>
                    
                    <div style={{ flexGrow: 1, position: 'relative' }}>
                        <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            <TileLayer url="http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={20} />
                            <MapUpdater center={[location.lat, location.lng]} zoom={13} />
                            
                            <CircleMarker center={[location.lat, location.lng]} radius={8} pathOptions={{ color: 'var(--primary)', fillColor: '#4F46E5', fillOpacity: 0.5 }}>
                                <Popup>Your Location</Popup>
                            </CircleMarker>

                            {facilities.map(f => (
                                <Marker 
                                    key={f.id} 
                                    position={[f.lat, f.lng]} 
                                    icon={getMarkerIcon(f.type)}
                                    eventHandlers={{ click: () => { setSelectedFacility(f); setBookingState(null); } }}
                                >
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>

                {/* Details / Booking Section */}
                <div className="card animate-fade-in" style={{ height: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                    
                    {!selectedFacility ? (
                        <>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Hospital size={20} color="var(--primary)" /> Available Facilities
                            </h3>
                            {facilities.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                                    {loading ? 'Loading...' : 'No facilities found.'}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {facilities.map(f => (
                                        <div 
                                            key={f.id} 
                                            style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.75rem', background: 'var(--surface)', cursor: 'pointer', transition: 'var(--transition)' }} 
                                            onClick={() => setSelectedFacility(f)}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</h4>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.doctor}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={12} /> {f.distance < 1000 ? Math.round(f.distance) + ' m' : (f.distance / 1000).toFixed(1) + ' km'} away
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 'bold', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '1rem' }}>
                                                <Star size={14} fill="currentColor" /> {f.rating}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '0.75rem', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                    <Hospital size={32} />
                                </div>
                                <button onClick={() => setSelectedFacility(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }}/>
                                </button>
                            </div>

                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)', lineHeight: '1.3' }}>{selectedFacility.name}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '1rem', fontWeight: '600' }}>
                                        {selectedFacility.type.charAt(0).toUpperCase() + selectedFacility.type.slice(1)}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#F59E0B', fontWeight: '600' }}>
                                        <Star size={14} fill="currentColor" /> {selectedFacility.rating}
                                    </span>
                                </div>

                                <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid var(--border)' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Doctor</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                            <User size={20} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{selectedFacility.doctor}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{deptName} Specialist</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ flex: 1, background: 'var(--background)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                        <Clock size={20} color="#F59E0B" style={{ marginBottom: '0.5rem' }} />
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Timings</div>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selectedFacility.timings}</div>
                                    </div>
                                    <div style={{ flex: 1, background: 'var(--background)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                        <Banknote size={20} color="var(--secondary)" style={{ marginBottom: '0.5rem' }} />
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Charges</div>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selectedFacility.charges}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <MapPin size={18} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                                    <div>
                                        <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>Distance</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {selectedFacility.distance < 1000 ? Math.round(selectedFacility.distance) + ' m' : (selectedFacility.distance / 1000).toFixed(1) + ' km'} away from you.
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lng}`} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="btn btn-secondary glass" 
                                        style={{ width: '100%', textDecoration: 'none', color: 'var(--text-main)' }}
                                    >
                                        Get Directions
                                    </a>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', fontWeight: 'bold' }}
                                        onClick={handleBookAppointment}
                                    >
                                        Proceed to Booking
                                    </button>
                                </div>
                            </>
                        )}
                </div>
            </div>
        </div>
    );
};

export default Department;
