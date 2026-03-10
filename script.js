// AI Nexus Chat - JavaScript

// Determine API URL based on environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost 
    ? 'https://smfahim.xyz/ai/ai4chat'  // Direct API for local testing
    : '/api/chat';  // Vercel serverless function when deployed

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const welcomeScreen = document.getElementById('welcomeScreen');
const typingIndicator = document.getElementById('typingIndicator');
const suggestionChips = document.querySelectorAll('.chip');

// State
let isLoading = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
sendBtn.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', handleKeyPress);
clearBtn.addEventListener('click', clearChat);
suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        messageInput.value = prompt;
        handleSendMessage();
    });
});

// Initialize
function init() {
    loadChatHistory();
    messageInput.focus();
}

// Handle Enter Key
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

// Handle Send Message
async function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    // Hide welcome screen
    welcomeScreen.style.display = 'none';
    
    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Send to API
    try {
        const response = await sendToAPI(message);
        hideTypingIndicator();
        addMessage(response, 'bot');
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
        console.error('API Error:', error);
    }

    // Save to localStorage
    saveChatHistory();
}

// Send Message to API
async function sendToAPI(message) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
        // Direct API call for local development
        const url = `${API_BASE_URL}?action=chat&prompt=${encodeURIComponent(message)}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                const json = await response.json();
                data = json.output?.result || json;
            } else {
                data = await response.text();
            }
            
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    } else {
        // Use Vercel serverless function when deployed
        const url = `/api/chat?prompt=${encodeURIComponent(message)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message || data.error);
        }
        
        return data.result || data;
    }
}

// Add Message to Chat
function addMessage(text, sender, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}${isError ? ' error' : ''}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // Process text for code blocks and formatting
    bubble.innerHTML = formatMessage(text);
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(new Date());
    
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(time);
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
}

// Format Message Text
function formatMessage(text) {
    // Escape HTML
    let formatted = text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>');
    
    // Code blocks (```code```)
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text**)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic (*text*)
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Show Typing Indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}

// Hide Typing Indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Scroll to Bottom
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Format Time
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Clear Chat
function clearChat() {
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'flex';
    localStorage.removeItem('aiNexusChat');
    messageInput.focus();
}

// Save Chat History
function saveChatHistory() {
    const messages = [];
    document.querySelectorAll('.message').forEach(msg => {
        messages.push({
            sender: msg.classList.contains('user') ? 'user' : 'bot',
            text: msg.querySelector('.message-bubble').textContent,
            time: msg.querySelector('.message-time').textContent
        });
    });
    
    if (messages.length > 0) {
        localStorage.setItem('aiNexusChat', JSON.stringify(messages));
    }
}

// Load Chat History
function loadChatHistory() {
    const saved = localStorage.getItem('aiNexusChat');
    if (!saved) return;
    
    try {
        const messages = JSON.parse(saved);
        if (messages.length > 0) {
            welcomeScreen.style.display = 'none';
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.sender}`;
                
                const bubble = document.createElement('div');
                bubble.className = 'message-bubble';
                bubble.innerHTML = formatMessage(msg.text);
                
                const time = document.createElement('div');
                time.className = 'message-time';
                time.textContent = msg.time;
                
                messageDiv.appendChild(bubble);
                messageDiv.appendChild(time);
                messagesContainer.appendChild(messageDiv);
            });
            scrollToBottom();
        }
    } catch (e) {
        console.error('Error loading chat history:', e);
    }
}

// Handle window resize for mobile keyboard
window.addEventListener('resize', () => {
    setTimeout(scrollToBottom, 100);
});

// Prevent form submission on enter
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
    }
});
