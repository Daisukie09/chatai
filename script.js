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

// Free image hosting services - multiple options for reliability
const IMAGE_HOSTS = [
    { url: 'https://0x0.st', format: 'form' },  // Simple, fast
    { url: 'https://file.io', format: 'form' },  // Fallback
    { url: 'https://litterbox.catbox.moe/resources/internals/api.php', format: 'form' }  // Temporary hosting
];

// Upload image to free hosting service
async function uploadImageToHost(base64Data, attempt = 0) {
    if (attempt >= IMAGE_HOSTS.length) {
        throw new Error('All image hosts failed');
    }
    
    const host = IMAGE_HOSTS[attempt];
    const hostUrl = host.url;
    
    try {
        // Convert base64 to blob
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        // Determine file type
        const fileType = blob.type || 'image/jpeg';
        const ext = fileType.split('/')[1] || 'jpg';
        
        // Create form data
        const formData = new FormData();
        formData.append('file', blob, `image.${ext}`);
        
        console.log('Trying to upload to:', hostUrl);
        
        // Upload
        const uploadResponse = await fetch(hostUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const data = await uploadResponse.text();
        console.log('Upload response:', data);
        
        // Different hosts return different formats
        let imageUrl;
        try {
            const json = JSON.parse(data);
            
            if (hostUrl.includes('file.io')) {
                if (!json.success) {
                    throw new Error('Upload failed');
                }
                imageUrl = json.link;
            } else if (hostUrl.includes('0x0.st')) {
                imageUrl = data.trim();
                if (!imageUrl.startsWith('http')) {
                    throw new Error('Invalid response');
                }
            } else if (hostUrl.includes('catbox')) {
                imageUrl = json;
            } else {
                imageUrl = data;
            }
        } catch (parseErr) {
            // Plain text response
            imageUrl = data.trim();
            if (!imageUrl.startsWith('http')) {
                throw new Error('Invalid URL returned: ' + imageUrl);
            }
        }
        
        console.log('Image uploaded successfully:', imageUrl);
        return imageUrl;
    } catch (error) {
        console.error(`Upload to ${hostUrl} failed:`, error);
        // Try next host
        return uploadImageToHost(base64Data, attempt + 1);
    }
}

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
        messageInput.placeholder = 'Ask about this image or press send to analyze...';
        messageInput.focus();
        
        welcomeScreen.style.display = 'none';
        addMessage('📷 Image attached - click send to analyze', 'user', selectedImage);
    };
    reader.readAsDataURL(file);
    imageUpload.value = '';
}

// Upload image to free hosting service
async function uploadImageToHost(base64Data) {
    try {
        // Convert base64 to blob
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        // Determine file type
        const fileType = blob.type || 'image/jpeg';
        
        // Create form data for file.io
        const formData = new FormData();
        formData.append('file', blob, `image.${fileType.split('/')[1] || 'jpg'}`);
        
        // Upload to file.io
        const uploadResponse = await fetch(IMAGE_HOST_API, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const data = await uploadResponse.json();
        if (!data.success) {
            throw new Error('Upload failed: ' + JSON.stringify(data));
        }
        
        console.log('Image uploaded successfully:', data.link);
        return data.link;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
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
        console.error('Analysis error:', error);
        addMessage('Sorry, I had trouble analyzing that image. The image hosting service or AI service might be temporarily unavailable. You can try: 1) Using a smaller image, 2) Trying again later, or 3) Describe what you want me to help with in text.', 'bot', true);
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
        addMessage(message || '📷 Analyze this image', 'user', selectedImage);
        messageInput.value = '';
        messageInput.placeholder = 'Message Kate AI... (or attach an image)';
        
        showTypingIndicator();
        
        try {
            // Upload image first to get URL
            let imageUrl = selectedImageUrl;
            
            if (!imageUrl) {
                // Show uploading message
                const uploadMsg = addMessage('⬆️ Uploading image...', 'bot');
                
                imageUrl = await uploadImageToHost(selectedImage);
                
                uploadMsg.remove();
                addMessage('✅ Image uploaded: ' + imageUrl.substring(0, 50) + '...', 'bot');
            }
            
            const prompt = message || 'Describe this image in detail';
            
            // Show what we're sending
            console.log('Sending to AI - Prompt:', prompt, 'Image URL:', imageUrl);
            
            const response = await getAIResponse(prompt, imageUrl);
            hideTypingIndicator();
            addMessage(response, 'bot');
            
            // Clear selected image after sending
            selectedImage = null;
            selectedImageUrl = null;
            imagePreview.style.display = 'none';
            previewImg.src = '';
        } catch (error) {
            hideTypingIndicator();
            console.error('Error details:', error);
            
            // Try again with just text if image failed
            if (message && message.length > 0) {
                addMessage('Image upload/analysis failed. Sending your message without the image...', 'bot');
                
                showTypingIndicator();
                try {
                    const response = await getAIResponse(message, null);
                    hideTypingIndicator();
                    addMessage(response, 'bot');
                } catch (textError) {
                    hideTypingIndicator();
                    addMessage('Error: ' + textError.message, 'bot', true);
                }
            } else {
                addMessage('Image service unavailable. Try sending a text message instead.', 'bot', true);
            }
            
            // Clear the image
            selectedImage = null;
            selectedImageUrl = null;
            imagePreview.style.display = 'none';
            previewImg.src = '';
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

// Google Gemini API direct - using the format you provided
const GEMINI_API_KEY = 'AIzaSyChJDkYqSzxFHJtAxd65yoDaMP-45BGRtA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

// Upload image to get public URL
async function uploadImageToHost(base64Data, attempt = 0) {
    if (attempt >= IMAGE_HOSTS.length) {
        throw new Error('All image hosts failed');
    }
    
    const host = IMAGE_HOSTS[attempt];
    const hostUrl = host.url;
    
    try {
        // Convert base64 to blob
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        // Determine file type
        const fileType = blob.type || 'image/jpeg';
        const ext = fileType.split('/')[1] || 'jpg';
        
        // Create form data
        const formData = new FormData();
        formData.append('file', blob, `image.${ext}`);
        
        console.log('Trying to upload to:', hostUrl);
        
        // Upload
        const uploadResponse = await fetch(hostUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const data = await uploadResponse.text();
        console.log('Upload response:', data);
        
        // Different hosts return different formats
        let imageUrl;
        try {
            const json = JSON.parse(data);
            
            if (hostUrl.includes('file.io')) {
                if (!json.success) {
                    throw new Error('Upload failed');
                }
                imageUrl = json.link;
            } else if (hostUrl.includes('0x0.st')) {
                imageUrl = data.trim();
                if (!imageUrl.startsWith('http')) {
                    throw new Error('Invalid response');
                }
            } else if (hostUrl.includes('catbox')) {
                imageUrl = json;
            } else {
                imageUrl = data;
            }
        } catch (parseErr) {
            // Plain text response
            imageUrl = data.trim();
            if (!imageUrl.startsWith('http')) {
                throw new Error('Invalid URL returned: ' + imageUrl);
            }
        }
        
        console.log('Image uploaded successfully:', imageUrl);
        return imageUrl;
    } catch (error) {
        console.error(`Upload to ${hostUrl} failed:`, error);
        // Try next host
        return uploadImageToHost(base64Data, attempt + 1);
    }
}

// Send to Google Gemini API directly using your format
async function getAIResponse(message, imageUrl = null) {
    let contents = [];
    
    if (imageUrl && imageUrl.startsWith('data:')) {
        // For image analysis - send base64 directly
        const base64Data = imageUrl.split(',')[1];
        contents = [{
            parts: [
                { text: message },
                { 
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data
                    }
                }
            ]
        }];
    } else if (imageUrl) {
        // For URL images, still use base64 format
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            const base64Data = await base64Promise;
            
            contents = [{
                parts: [
                    { text: message },
                    { 
                        inlineData: {
                            mimeType: blob.type || 'image/jpeg',
                            data: base64Data
                        }
                    }
                ]
            }];
        } catch (err) {
            // Fallback to text only if image fetch fails
            contents = [{
                parts: [
                    { text: message }
                ]
            }];
        }
    } else {
        // Text only
        contents = [{
            parts: [
                { text: message }
            ]
        }];
    }
    
    const requestBody = { contents };
    
    const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    console.log('API Request to:', url);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.error) {
        throw new Error(data.error.message || 'API error');
    }
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid API response - no content');
    }
    
    return data.candidates[0].content.parts[0].text;
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
