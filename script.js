const chatContainer = document.getElementById('chatContainer');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const welcomeScreen = document.getElementById('welcomeScreen');
const typingIndicator = document.getElementById('typingIndicator');
const suggestionChips = document.querySelectorAll('.chip');
const imageUpload = document.getElementById('imageUpload');
const imageBtn = document.getElementById('imageBtn');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');

let isLoading = false;
let selectedImage = null;
let selectedImageUrl = null;

// Free image hosting service
const IMAGE_HOST_API = 'https://tmpfiles.org/api/v1/upload';

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

// Image button click handler
imageBtn.addEventListener('click', () => {
    imageUpload.click();
});

// Remove image button handler
removeImageBtn.addEventListener('click', () => {
    selectedImage = null;
    selectedImageUrl = null;
    imagePreview.style.display = 'none';
    previewImg.src = '';
});

imageUpload.addEventListener('change', handleImageUpload);

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        addMessage('Please select a valid image file (JPG, PNG, GIF, WebP)', 'bot', true);
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        addMessage('Image file is too large. Please select an image under 10MB.', 'bot', true);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        selectedImage = event.target.result;
        
        // Show preview in input area
        previewImg.src = selectedImage;
        imagePreview.style.display = 'flex';
        
        welcomeScreen.style.display = 'none';
        
        // Show image immediately with loading state
        const msgDiv = addMessage('📷 Image uploaded, analyzing...', 'user', selectedImage);
        
        try {
            // Upload image to get public URL
            const imageUrl = await uploadImageToHost(selectedImage);
            selectedImageUrl = imageUrl;
            
            // Remove loading message and add actual image
            msgDiv.remove();
            addMessage('📷 Image', 'user', selectedImage);
            
            // Send for analysis
            await sendImageForAnalysis(imageUrl);
        } catch (error) {
            console.error('Upload error:', error);
            msgDiv.remove();
            addMessage('📷 Image (upload failed - will analyze directly)', 'user', selectedImage);
            // Try anyway with data URL
            await sendImageForAnalysis(selectedImage);
        }
    };
    reader.readAsDataURL(file);
    imageUpload.value = '';
}

// Upload image to free hosting service
async function uploadImageToHost(base64Data) {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    
    // Upload to tmpfiles.org
    const uploadResponse = await fetch(IMAGE_HOST_API, {
        method: 'POST',
        body: formData
    });
    
    if (!uploadResponse.ok) {
        throw new Error('Upload failed');
    }
    
    const data = await uploadResponse.json();
    if (!data.success) {
        throw new Error('Upload failed');
    }
    
    return data.data.url;
}

async function sendImageForAnalysis(imageUrl) {
    if (isLoading) return;
    
    isLoading = true;
    showTypingIndicator();
    
    try {
        const response = await getAIResponse('Analyze this image and describe what you see in detail', imageUrl);
        hideTypingIndicator();
        addMessage(response, 'bot');
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error analyzing the image. Please try again or use a different image.', 'bot', true);
    }
    
    isLoading = false;
    saveChatHistory();
}

async function sendMessage() {
    const message = messageInput.value.trim();
    const hasImage = selectedImage !== null;
    
    if (!message && !hasImage) return;
    if (isLoading) return;

    isLoading = true;
    welcomeScreen.style.display = 'none';
    
    // Handle message with image
    if (hasImage) {
        addMessage(message || '📷 What do you see in this image?', 'user', selectedImage);
        messageInput.value = '';
        
        showTypingIndicator();
        
        try {
            // Upload image first to get URL
            let imageUrl = selectedImageUrl;
            if (!imageUrl) {
                imageUrl = await uploadImageToHost(selectedImage);
            }
            
            const prompt = message || 'Describe this image in detail';
            const response = await getAIResponse(prompt, imageUrl);
            hideTypingIndicator();
            addMessage(response, 'bot');
            
            // Clear selected image after sending
            selectedImage = null;
            selectedImageUrl = null;
        } catch (error) {
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error processing your image. Please try again.', 'bot', true);
        }
        
        isLoading = false;
        saveChatHistory();
        return;
    }
    
    // Handle text-only message
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
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '✨';
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';
    
    const senderName = document.createElement('div');
    senderName.className = 'message-sender';
    senderName.textContent = sender === 'user' ? 'You' : 'Kate AI';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (text && !text.includes('Image uploaded') && !text.includes('Image (upload failed')) {
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = formatText(text);
        bubble.appendChild(textDiv);
    }
    
    if (imageUrl) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'message-image-container';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        img.alt = 'Image';
        img.onclick = () => window.open(imageUrl, '_blank');
        img.onerror = () => {
            img.style.display = 'none';
            imgContainer.innerHTML = '<span class="image-error">⚠️ Image failed to load</span>';
        };
        
        imgContainer.appendChild(img);
        bubble.appendChild(imgContainer);
    }
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    contentWrapper.appendChild(senderName);
    contentWrapper.appendChild(bubble);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentWrapper);
    messageDiv.appendChild(time);
    messagesContainer.appendChild(messageDiv);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
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
                
                const avatar = document.createElement('div');
                avatar.className = 'message-avatar';
                avatar.textContent = msg.sender === 'user' ? '👤' : '✨';
                
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'message-content-wrapper';
                
                const senderName = document.createElement('div');
                senderName.className = 'message-sender';
                senderName.textContent = msg.sender === 'user' ? 'You' : 'Kate AI';
                
                const bubble = document.createElement('div');
                bubble.className = 'message-bubble';
                bubble.innerHTML = formatText(msg.text);
                
                const time = document.createElement('div');
                time.className = 'message-time';
                time.textContent = msg.time;
                
                contentWrapper.appendChild(senderName);
                contentWrapper.appendChild(bubble);
                
                messageDiv.appendChild(avatar);
                messageDiv.appendChild(contentWrapper);
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
