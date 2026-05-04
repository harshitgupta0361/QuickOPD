import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Get initial theme before rendering
    const getInitialTheme = () => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        let initialTheme = 'light'; // Default to light
        if (user && user.theme) {
            initialTheme = user.theme;
        } else if (localStorage.getItem('theme')) {
            initialTheme = localStorage.getItem('theme');
        }
        
        // Apply theme class immediately to prevent flash
        if (typeof window !== 'undefined') {
            document.documentElement.classList.remove('dark-mode', 'light-mode');
            if (initialTheme === 'dark') {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.add('light-mode');
            }
        }
        
        return initialTheme;
    };

    const [theme, setTheme] = useState(getInitialTheme());

    useEffect(() => {
        // Sync theme class with state
        document.documentElement.classList.remove('dark-mode', 'light-mode');
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.add('light-mode');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            
            // Update classes
            document.documentElement.classList.remove('dark-mode', 'light-mode');
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.add('light-mode');
            }
            
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
