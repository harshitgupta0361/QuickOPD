import React, { createContext, useState, useEffect, useContext } from 'react';

const translations = {
    en: {
        'nav.home': 'Home',
        'nav.voice_agent': 'Voice Agent',
        'nav.nerve_ai': 'Nerve AI',
        'nav.logout': 'Logout',
        'home.hero.title': 'Skip the Waiting Line',
        'home.hero.subtitle': 'Get instant pre-triage, find the right department, and get your digital queue number before you even reach the hospital.',
        'home.btn.voice_triage': 'Start Voice Triage',
        'home.btn.nerve_ai': 'Nerve AI',
        'home.hospitals_near_you': 'Hospitals Near You',
        'home.departments': 'Departments',
        'home.btn.show_more': 'Show More',
        'home.btn.show_less': 'Show Less',
    },
    hi: {
        'nav.home': 'होम (Home)',
        'nav.voice_agent': 'वॉइस एजेंट (Voice Agent)',
        'nav.nerve_ai': 'नर्व एआई (Nerve AI)',
        'nav.logout': 'लॉगआउट (Logout)',
        'home.hero.title': 'वेटिंग लाइन छोड़ें',
        'home.hero.subtitle': 'अस्पताल पहुंचने से पहले ही तुरंत प्री-ट्रायज प्राप्त करें, सही विभाग खोजें, और अपना डिजिटल कतार नंबर प्राप्त करें।',
        'home.btn.voice_triage': 'वॉइस ट्रायज शुरू करें',
        'home.btn.nerve_ai': 'नर्व एआई',
        'home.hospitals_near_you': 'आपके पास के अस्पताल',
        'home.departments': 'विभाग (Departments)',
        'home.btn.show_more': 'और दिखाएं',
        'home.btn.show_less': 'कम दिखाएं',
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        // Read user's preferred language from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userObj = JSON.parse(storedUser);
                if (userObj.preferredLanguage) {
                    setLanguage(userObj.preferredLanguage);
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const t = (key) => {
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
