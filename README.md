# AI Nexus Chat

A modern, neon-gradient AI chat interface similar to ChatGPT, Claude, and Grok. Built with HTML, CSS, and vanilla JavaScript. Features a stunning neon/gradient design with full mobile responsiveness.

![AI Nexus Chat](https://img.shields.io/badge/AI-Nexus--Chat-8b5cf6?style=for-the-badge&logo=科技)

## ✨ Features

- 🎨 **Stunning Neon Design** - Beautiful gradient and neon effects
- 📱 **Mobile Friendly** - Fully responsive for all devices
- ⚡ **Fast & Lightweight** - Pure vanilla JS, no frameworks
- 💾 **Chat History** - Persists messages in localStorage
- 🔗 **API Integration** - Connects to AI API endpoint
- 🚀 **Vercel Ready** - Easy deployment to Vercel

## 🛠️ Tech Stack

- HTML5
- CSS3 (Custom Properties, Animations, Flexbox)
- JavaScript ES6+
- [Google Fonts](https://fonts.google.com) - Outfit & Orbitron

## 📁 Project Structure

```
chatai/
├── index.html      # Main HTML file
├── styles.css      # All styles
├── script.js       # Chat functionality
├── SPEC.md         # Detailed specifications
└── README.md       # This file
```

## 🚀 Deployment to Vercel

### Option 1: Deploy via Git (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/chatai.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a static site
   - Click "Deploy"!

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 3: Drag & Drop (Quickest)

1. Go to [vercel.com/drop](https://vercel.com/drop)
2. Drag the project folder onto the page
3. Done! 🎉

## 🔧 Configuration

### API Endpoint

The chat uses the AI API at `https://smfahim.xyz/ai/ai4chat`. To modify:

Edit [`script.js`](script.js:1):
```javascript
const API_BASE_URL = 'https://your-api-endpoint.com/chat';
```

### Customizing Colors

Edit CSS variables in [`styles.css`](styles.css:1):
```css
:root {
    --neon-cyan: #00f5ff;
    --neon-magenta: #ff00ff;
    --neon-purple: #8b5cf6;
}
```

## 📱 Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

## 🎯 Usage

1. Open `index.html` in a browser
2. Type a message in the input field
3. Press Enter or click the send button
4. Wait for the AI response
5. Chat history is saved automatically

## 🤝 Contributing

Feel free to fork this project and make it your own!

## 📄 License

MIT License

---

Built with ❤️ using HTML, CSS & JavaScript
