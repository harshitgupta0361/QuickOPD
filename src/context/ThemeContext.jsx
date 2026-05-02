import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Read theme from localStorage on load
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        let initialTheme = 'light';
        if (user && user.theme) {
            initialTheme = user.theme;
        } else if (localStorage.getItem('theme')) {
            initialTheme = localStorage.getItem('theme');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            initialTheme = 'dark';
        }
        
        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark-mode', initialTheme === 'dark');
    }, []);

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            document.documentElement.classList.toggle('dark-mode', newTheme === 'dark');
            
            // Sync with backend if logged in
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    user.theme = newTheme;
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    fetch('http://localhost:3000/api/user/theme', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id, theme: newTheme })
                    }).catch(err => console.error("Failed to sync theme to backend", err));
                } catch (e) {
                    console.error(e);
                }
            }
            
            return newTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
