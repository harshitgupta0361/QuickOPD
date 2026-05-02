import { useState, useRef, useEffect } from 'react';
import { generateLocalBotResponse } from '../utils/botLogic';
import { MessageSquarePlus, X, Send, MoreHorizontal } from 'lucide-react';

const FloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => {
        if (!isOpen && chatHistory.length === 0) {
            initChat();
        }
        setIsOpen(!isOpen);
    };

    const initChat = () => {
        const initialMessage = "Hello! I'm the QuickOPD AI Assistant. How can I help you today? Please describe any symptoms you are experiencing.";
        setChatHistory([{ role: 'bot', text: initialMessage, isUser: false }]);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatHistory, isOpen, isLoading]);

    const handleSend = async (textToUse) => {
        const text = typeof textToUse === 'string' ? textToUse : inputValue.trim();
        if (!text) return;

        const newHistory = [...chatHistory, { role: 'user', text: text, isUser: true }];
        setChatHistory(newHistory);
        setInputValue('');
        setIsLoading(true);

        try {
            const data = await generateLocalBotResponse(newHistory);
            
            const botMessage = {
                role: 'bot',
                text: data.message,
                isUser: false,
                quickReplies: data.quick_replies
            };

            setChatHistory(prev => [...prev, botMessage]);

            if (data.conclusion_reached) {
                setTimeout(() => {
                    setChatHistory(prev => [
                        ...prev,
                        {
                            role: 'bot',
                            text: "<strong>Session Complete.</strong> A summary has been noted. Please proceed to the nearest center.",
                            isUser: false
                        }
                    ]);
                }, 1500);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            setChatHistory(prev => [
                ...prev,
                { role: 'bot', text: `<strong>System Error:</strong> ${error.message}`, isUser: false }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div id="floating-chat-widget">
            <div id="chat-window" className={isOpen ? 'active' : ''}>
                <div className="fc-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquarePlus size={20} /> AI Health Assistant
                    </span>
                    <button onClick={toggleChat}><X size={20} /></button>
                </div>
                
                <div className="fc-messages">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`fc-msg ${msg.isUser ? 'user' : 'bot'}`}>
                            <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                            
                            {msg.quickReplies && msg.quickReplies.length > 0 && (
                                <div className="fc-quick-replies">
                                    {msg.quickReplies.map((reply, rIdx) => (
                                        <button 
                                            key={rIdx} 
                                            className="fc-qr-btn"
                                            onClick={() => handleSend(reply)}
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="fc-msg bot">
                            <MoreHorizontal className="animate-pulse" />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="fc-input-area">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your symptoms..." 
                        autoComplete="off" 
                    />
                    <button onClick={handleSend}>
                        <Send size={18} style={{marginLeft: '-2px'}}/>
                    </button>
                </div>
            </div>
            <button id="chat-toggle-btn" onClick={toggleChat}>
                {isOpen ? <X size={24} /> : <MessageSquarePlus size={24} />}
            </button>
        </div>
    );
};

export default FloatingChat;
