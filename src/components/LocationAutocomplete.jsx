import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';

const LocationAutocomplete = ({ onLocationSelect, placeholder = "Search city or area..." }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced fetch
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query.trim() || query.length < 3) {
                setSuggestions([]);
                return;
            }
            
            setIsLoading(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
                const response = await fetch(url);
                const data = await response.json();
                setSuggestions(data);
                setShowDropdown(true);
            } catch (err) {
                console.error("Error fetching location suggestions:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (item) => {
        setQuery(item.display_name.split(',')[0]); // Set to main name
        setShowDropdown(false);
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (onLocationSelect) {
            onLocationSelect(lat, lng);
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '250px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                    type="text" 
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length < 3) setShowDropdown(false);
                    }}
                    onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                    style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.3rem', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)' }}
                />
                {isLoading && (
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                )}
            </div>

            {showDropdown && suggestions.length > 0 && (
                <div className="card animate-fade-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', padding: '0.5rem 0', zIndex: 1000, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    {suggestions.map((item, index) => {
                        const parts = item.display_name.split(', ');
                        const mainText = parts[0];
                        const subText = parts.slice(1).join(', ');

                        return (
                            <div 
                                key={item.place_id || index}
                                onClick={() => handleSelect(item)}
                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', borderBottom: index < suggestions.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <MapPin size={16} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {mainText}
                                    </div>
                                    {subText && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                            {subText}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LocationAutocomplete;
