import React, { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface ChatPanelProps {
    context: any[]; // The candidates results
}

const ChatPanel: React.FC<ChatPanelProps> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleOpen = () => setIsOpen(true);

    const handleClose = () => {
        setIsOpen(false);
        setMessages([]); // Delete history on close
    };

    const handleRestart = () => {
        setMessages([]);
    };

    const decodeStream = async (body: ReadableStream<Uint8Array>) => {
        const reader = body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let buffer = '';

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // keep incomplete line

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            const textChunk = parsed.text || '';

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                const lastIndex = newMessages.length - 1;
                                if (lastIndex >= 0 && newMessages[lastIndex].role === 'model') {
                                    newMessages[lastIndex].content += textChunk;
                                }
                                return newMessages;
                            });
                        } catch (e) {
                            console.error('Failed to parse SSE chunk', e, dataStr);
                        }
                    }
                }
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage: Message = { role: 'user', content: inputValue };
        const currentHistory = [...messages];

        // Optimistic UI update
        setMessages([...currentHistory, userMessage, { role: 'model', content: '' }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('http://0.0.0.0:8000/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: userMessage.content,
                    context: context,
                    history: currentHistory,
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (response.body) {
                await decodeStream(response.body);
            } else {
                await response.json();
            }
        } catch (error) {
            console.error('Error in chat:', error);
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (lastIndex >= 0 && newMessages[lastIndex].role === 'model') {
                    newMessages[lastIndex].content = 'Error connecting to the chat API.';
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button className="chat-fab-button" onClick={handleOpen}>
                Start Chat
            </button>
        );
    }

    return (
        <div className="chat-panel">
            <div className="chat-panel-header">
                <h3>Recruiter Assistant Chat</h3>
                <div className="chat-panel-actions">
                    <button className="chat-btn-restart" onClick={handleRestart} title="Restart Chat">♻</button>
                    <button className="chat-btn-close" onClick={handleClose} title="Close Chat">X</button>
                </div>
            </div>

            <div className="chat-panel-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">Ask me questions about the candidates. For example: "Which candidate has the most Python experience?"</div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.role}`}>
                            <div className="chat-bubble">
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-panel-input" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !inputValue.trim()}>
                    {isLoading ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default ChatPanel;
