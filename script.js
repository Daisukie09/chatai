const API_BASE_URL = '/api/chat';

const chatContainer = document.getElementById('chatContainer');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const welcomeScreen = document.getElementById('welcomeScreen');
const typingIndicator = document.getElementById('typingIndicator');
const suggestionChips = document.querySelectorAll('.chip');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');

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

uploadBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedImage = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
});

removeImageBtn.addEventListener('click', () => {
    selectedImage = null;
    imageInput.value = '';
    imagePreview.style.display = 'none';
});

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message && !selectedImage) return;
    if (isLoading) return;

    isLoading = true;
    welcomeScreen.style.display = 'none';
    
    const imageData = selectedImage ? previewImg.src : null;
    addMessage(message || '🖼️', 'user', false, imageData);
    
    messageInput.value = '';
    selectedImage = null;
    imageInput.value = '';
    imagePreview.style.display = 'none';
    
    showTypingIndicator();

    try {
        const prompt = message ? message : 'Describe this image';
        const response = await getAIResponse(prompt);
        hideTypingIndicator();
        addMessage(response, 'bot');
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
    }

    isLoading = false;
    saveChatHistory();
}

async function getAIResponse(message) {
    const url = `${API_BASE_URL}?prompt=${encodeURIComponent(message)}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    if (data.error) throw new Error(data.message);
    
    return data.result || data;
}

function addMessage(text, sender, isError = false, imageData = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}${isError ? ' error' : ''}`;
    
    const senderName = document.createElement('div');
    senderName.className = 'message-sender';
    senderName.textContent = sender === 'user' ? 'You' : 'Kate AI';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (text && text !== '🖼️') {
        bubble.innerHTML = formatText(text);
    }
    
    if (imageData) {
        const img = document.createElement('img');
        img.src = imageData;
        img.className = 'message-image';
        img.alt = 'Uploaded image';
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
    return text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/\n/g, '<br>');
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
