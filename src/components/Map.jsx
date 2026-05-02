import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Stethoscope, Pill, Hospital, Star, CornerDownRight, Search } from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

// Custom Map Updater component
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

const icons = {
    'hospital': createIcon('#EF4444'),
    'clinic': createIcon('#F59E0B'),
    'pharmacy': createIcon('#10B981')
};

const Map = () => {
    const [facilities, setFacilities] = useState({ hospitals: [], clinics: [], medicalStores: [] });
    const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 });
    const [radius, setRadius] = useState(0);
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(false);
    const [debouncedRadius, setDebouncedRadius] = useState(0);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
            }, () => {
                console.log("Geolocation permission denied.");
            });
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedRadius(radius);
        }, 800);
        return () => clearTimeout(timer);
    }, [radius]);

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
            if (debouncedRadius === 0) {
                setFacilities({ hospitals: [], clinics: [], medicalStores: [] });
                return;
            }

            setLoading(true);
            try {
                const radiusMeters = debouncedRadius * 1000;
                
                // Using Overpass API for real-world OpenStreetMap data
                const query = `[out:json];(node["amenity"="hospital"](around:${radiusMeters},${location.lat},${location.lng});node["amenity"="clinic"](around:${radiusMeters},${location.lat},${location.lng});node["amenity"="pharmacy"](around:${radiusMeters},${location.lat},${location.lng}););out center;`;
                const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
                
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch from Overpass API");
                const data = await response.json();
                
                const realData = { hospitals: [], clinics: [], medicalStores: [] };
                
                data.elements.forEach(el => {
                    if (!el.lat || !el.lon) return;
                    
                    const dist = getDistance(location.lat, location.lng, el.lat, el.lon);
                    if (dist > radiusMeters) return;
                    
                    const type = el.tags.amenity; // 'hospital', 'clinic', 'pharmacy'
                    const f = {
                        id: el.id.toString(),
                        lat: el.lat,
                        lng: el.lon,
                        name: el.tags.name || `Unnamed ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                        type: type,
                        distance: dist,
                        rating: (3.5 + Math.random() * 1.5).toFixed(1), // Mock rating since OSM rarely has ratings
                        department: type === 'hospital' ? (el.tags.healthcare || 'General') : 'N/A'
                    };
                    
                    if (type === 'hospital') realData.hospitals.push(f);
                    else if (type === 'clinic') realData.clinics.push(f);
                    else if (type === 'pharmacy') realData.medicalStores.push(f);
                });
                
                realData.hospitals.sort((a,b) => a.distance - b.distance);
                realData.clinics.sort((a,b) => a.distance - b.distance);
                realData.medicalStores.sort((a,b) => a.distance - b.distance);
                
                setFacilities(realData);
            } catch (err) {
                console.error("Error fetching real-time data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFacilities();
    }, [location.lat, location.lng, debouncedRadius]);

    const renderCard = (f, color, IconComp) => {
        const distText = f.distance < 1000 ? Math.round(f.distance) + ' m' : (f.distance / 1000).toFixed(1) + ' km';
        const displayType = f.type === 'pharmacy' ? 'Medical Store' : f.type.charAt(0).toUpperCase() + f.type.slice(1);
        
        return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface)', cursor: 'pointer', marginBottom: '0.75rem' }} onClick={() => setLocation({lat: f.lat, lng: f.lng})}>
                <div style={{ background: `${color}20`, color: color, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', flexShrink: 0 }}>
                    <IconComp size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} title="Get Directions">
                            {f.name} <CornerDownRight size={14} />
                        </a>
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{displayType}{f.department !== 'N/A' && ` • ${f.department}`}</div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '1rem', flexShrink: 0 }}>
                    <div style={{ fontWeight: 'bold', color: '#F59E0B', marginBottom: '0.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <Star size={14} fill="currentColor" /> {f.rating}
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{distText}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>away</div>
                </div>
            </div>
        );
    };

    const allMarkers = [
        ...facilities.hospitals.map(f => ({ ...f, icon: icons['hospital'] })),
        ...facilities.clinics.map(f => ({ ...f, icon: icons['clinic'] })),
        ...facilities.medicalStores.map(f => ({ ...f, icon: icons['pharmacy'] }))
    ];

    return (
        <div className="card mb-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}>Find Facilities</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <LocationAutocomplete onLocationSelect={(lat, lng) => setLocation({ lat, lng })} placeholder="Search city or area..." />
                    
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-control" style={{ padding: '0.5rem', width: 'auto' }}>
                        <option value="all">All Facilities</option>
                        <option value="hospitals">Hospitals</option>
                        <option value="clinics">Clinics</option>
                        <option value="pharmacies">Medical Stores</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Distance:</label>
                        <input type="range" min="0" max="50" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="form-control" style={{ width: '100px', padding: 0 }} />
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', width: '50px' }}>{radius} km</span>
                    </div>
                </div>
            </div>

            <div style={{ height: '400px', borderRadius: '1rem', overflow: 'hidden', marginBottom: '1.5rem', zIndex: 0, position: 'relative' }}>
                <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={20} />
                    <MapUpdater center={[location.lat, location.lng]} zoom={13} />
                    
                    <CircleMarker center={[location.lat, location.lng]} radius={8} pathOptions={{ color: 'var(--primary)', fillColor: '#4F46E5', fillOpacity: 0.5 }}>
                        <Popup>Your Location</Popup>
                    </CircleMarker>

                    {allMarkers.map(f => (
                        <Marker key={f.id} position={[f.lat, f.lng]} icon={f.icon}>
                            <Popup>
                                <b>{f.name}</b><br/>
                                Type: {f.type === 'pharmacy' ? 'Medical Store' : f.type.charAt(0).toUpperCase() + f.type.slice(1)}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {radius === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                    Adjust the distance slider to find facilities near you.
                </div>
            ) : loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                    Loading facilities...
                </div>
            ) : (
                <div id="facility-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {(filterType === 'all' || filterType === 'hospitals') && (
                        <div>
                            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Hospital size={18} color="#EF4444" /> Hospitals
                            </h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {facilities.hospitals.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No hospitals found.</div> : facilities.hospitals.map(f => renderCard(f, '#EF4444', Hospital))}
                            </div>
                        </div>
                    )}

                    {(filterType === 'all' || filterType === 'clinics') && (
                        <div>
                            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Stethoscope size={18} color="#F59E0B" /> Clinics
                            </h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {facilities.clinics.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No clinics found.</div> : facilities.clinics.map(f => renderCard(f, '#F59E0B', Stethoscope))}
                            </div>
                        </div>
                    )}

                    {(filterType === 'all' || filterType === 'pharmacies') && (
                        <div>
                            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Pill size={18} color="#10B981" /> Medical Stores
                            </h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {facilities.medicalStores.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No medical stores found.</div> : facilities.medicalStores.map(f => renderCard(f, '#10B981', Pill))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Map;
