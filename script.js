const chatContainer = document.getElementById('chatContainer');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const welcomeScreen = document.getElementById('welcomeScreen');
const typingIndicator = document.getElementById('typingIndicator');
const suggestionChips = document.querySelectorAll('.chip');
const imageUpload = document.getElementById('imageUpload');

let isLoading = false;
let selectedImage = null;

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    messageInput.focus();
});

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

clearBtn.addEventListener('click', clearChat);

suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
        messageInput.value = chip.dataset.prompt;
        sendMessage();
    });
});

imageUpload.addEventListener('change', handleImageUpload);

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        selectedImage = event.target.result;
        welcomeScreen.style.display = 'none';
        
        addMessage('🖼️ Image', 'user', selectedImage);
        
        sendImageForAnalysis(selectedImage);
    };
    reader.readAsDataURL(file);
    imageUpload.value = '';
}

async function sendImageForAnalysis(imageData) {
    if (isLoading) return;
    
    isLoading = true;
    showTypingIndicator();
    
    try {
        const response = await getAIResponse('Analyze this image and describe what you see', imageData);
        hideTypingIndicator();
        addMessage(response, 'bot');
    } catch (error) {
        hideTypingIndicator();
        addMessage('I can see your image! However, I need a public image URL to analyze it. Please paste an image URL instead, or describe what you want me to help with.', 'bot', true);
    }
    
    isLoading = false;
    saveChatHistory();
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    if (isLoading) return;

    isLoading = true;
    welcomeScreen.style.display = 'none';
    
    const imageUrl = extractImageUrl(message);
    
    if (imageUrl) {
        addMessage(message, 'user', imageUrl);
    } else {
        addMessage(message, 'user');
    }
    
    messageInput.value = '';
    
    showTypingIndicator();

    try {
        const prompt = message;
        const response = await getAIResponse(prompt, imageUrl);
        hideTypingIndicator();
        addMessage(response, 'bot');
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
    }

    isLoading = false;
    saveChatHistory();
}

function extractImageUrl(text) {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
}

async function getAIResponse(message, imageUrl = null) {
    let url = `https://kryptonite-api-library.onrender.com/api/gemini-lite?prompt=${encodeURIComponent(message)}&uid=kate-ai-${Date.now()}&apikey=AIzaSyChJDkYqSzxFHJtAxd65yoDaMP-45BGRtA`;
    
    if (imageUrl) {
        url += `&imgUrl=${encodeURIComponent(imageUrl)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    if (!data.status) throw new Error(data.error || 'API error');
    
    return data.response;
}

function addMessage(text, sender, imageUrl = null, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}${isError ? ' error' : ''}`;
    
    const senderName = document.createElement('div');
    senderName.className = 'message-sender';
    senderName.textContent = sender === 'user' ? 'You' : 'Kate AI';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (text && text !== '🖼️ Image') {
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = formatText(text);
        bubble.appendChild(textDiv);
    }
    
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        img.alt = 'Image';
        img.onclick = () => window.open(imageUrl, '_blank');
        bubble.appendChild(img);
    }
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.appendChild(senderName);
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(time);
    messagesContainer.appendChild(messageDiv);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatText(text) {
    let formatted = text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    messagesContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function clearChat() {
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'flex';
    localStorage.removeItem('kateChat');
    messageInput.focus();
}

function saveChatHistory() {
    const messages = [];
    document.querySelectorAll('.message').forEach(msg => {
        const hasImage = msg.querySelector('.message-image');
        if (hasImage) return;
        
        messages.push({
            sender: msg.classList.contains('user') ? 'user' : 'bot',
            text: msg.querySelector('.message-bubble').textContent,
            time: msg.querySelector('.message-time').textContent
        });
    });
    if (messages.length > 0) {
        localStorage.setItem('kateChat', JSON.stringify(messages));
    }
}

function loadChatHistory() {
    const saved = localStorage.getItem('kateChat');
    if (!saved) return;
    
    try {
        const messages = JSON.parse(saved);
        if (messages.length > 0) {
            welcomeScreen.style.display = 'none';
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.sender}`;
                
                const senderName = document.createElement('div');
                senderName.className = 'message-sender';
                senderName.textContent = msg.sender === 'user' ? 'You' : 'Kate AI';
                
                const bubble = document.createElement('div');
                bubble.className = 'message-bubble';
                bubble.innerHTML = formatText(msg.text);
                
                const time = document.createElement('div');
                time.className = 'message-time';
                time.textContent = msg.time;
                
                messageDiv.appendChild(senderName);
                messageDiv.appendChild(bubble);
                messageDiv.appendChild(time);
                messagesContainer.appendChild(messageDiv);
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    } catch (e) {
        console.error('Error loading chat:', e);
    }
}

window.addEventListener('resize', () => {
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
});
