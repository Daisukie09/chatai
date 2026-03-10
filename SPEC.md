# AI Chat - Neon Gradient Chat Interface

## 1. Project Overview

- **Project Name**: AI Nexus Chat
- **Project Type**: Single-page web application (Chat Interface)
- **Core Functionality**: A modern AI chat interface that connects to a custom API, featuring a stunning neon/gradient design with mobile-first responsive layout
- **Target Users**: Users who want to interact with AI through a visually striking, modern interface

## 2. UI/UX Specification

### Layout Structure

**Page Sections**:
1. **Header** - Fixed top navigation with logo and model selector
2. **Chat Container** - Main scrollable area for messages
3. **Input Area** - Fixed bottom message composer with send button

**Layout Specifications**:
- Full viewport height (`100vh`)
- Flexbox column layout for main structure
- Chat messages use flex layout with proper alignment
- Input area fixed at bottom with max-width constraint

**Responsive Breakpoints**:
- Mobile: < 640px (full width, compact padding)
- Tablet: 640px - 1024px (medium padding)
- Desktop: > 1024px (centered container, max-width 800px)

### Visual Design

**Color Palette**:
- Background Primary: `#0a0a0f` (Deep dark)
- Background Secondary: `#12121a` (Card/Input bg)
- Background Tertiary: `#1a1a25` (Message bubbles - bot)
- Neon Cyan: `#00f5ff` (Primary accent)
- Neon Magenta: `#ff00ff` (Secondary accent)
- Neon Purple: `#8b5cf6` (Tertiary accent)
- Neon Pink: `#ff1493` (Highlights)
- Gradient Primary: `linear-gradient(135deg, #00f5ff 0%, #8b5cf6 50%, #ff00ff 100%)`
- Text Primary: `#ffffff`
- Text Secondary: `#a0a0b0`
- Border Glow: `rgba(0, 245, 255, 0.3)`

**Typography**:
- Font Family: `'Outfit', sans-serif` (Google Fonts - modern geometric)
- Logo Font: `'Orbitron', sans-serif` (futuristic)
- Heading Sizes: 
  - Logo: 24px, weight 700
  - Model selector: 14px
- Body Text: 15px, weight 400
- Message Text: 15px, line-height 1.6
- Input Text: 15px

**Spacing System**:
- Container Padding: 16px (mobile), 24px (desktop)
- Message Gap: 16px
- Message Padding: 16px 20px
- Input Padding: 12px 16px
- Border Radius (cards): 16px
- Border Radius (buttons): 12px
- Border Radius (input): 24px

**Visual Effects**:
- Neon glow on buttons: `0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.2)`
- Gradient text for logo: Animated gradient shift
- Glass morphism on header: `backdrop-filter: blur(10px)`
- Subtle border glow on input focus
- Message appear animation: Fade in + slide up
- Typing indicator: Pulsing dots animation
- Scrollbar: Custom styled thin neon

### Components

**1. Header**
- Logo with gradient text effect
- Model selector dropdown (styled select)
- Subtle bottom border with gradient

**2. Chat Messages**
- User messages: Right-aligned, gradient background (cyan to purple)
- Bot messages: Left-aligned, dark card with subtle border glow
- Timestamp on hover (small text)
- Copy button on bot messages
- Code block support with syntax highlighting

**3. Typing Indicator**
- Three animated dots with staggered pulse
- Cyan glow effect

**4. Input Area**
- Dark input field with glowing border on focus
- Gradient send button with hover animation
- Voice input icon (decorative)
- Character counter (optional)

**5. Mobile Optimizations**
- Larger touch targets (min 44px)
- Swipe-friendly scroll
- Keyboard-aware viewport
- Collapsible header on scroll down

## 3. Functionality Specification

### Core Features

1. **Chat Display**
   - Display conversation history
   - Auto-scroll to newest message
   - Load previous messages on scroll up (if stored)
   - Clear chat button

2. **Message Input**
   - Text input with placeholder "Message AI Nexus..."
   - Send on Enter key (Shift+Enter for newline)
   - Send button click
   - Disable send while empty

3. **API Integration**
   - Endpoint: `https://smfahim.xyz/ai/ai4chat?action=chat&prompt={message}`
   - GET request (query parameter)
   - Loading state while waiting
   - Error handling with user-friendly message

4. **User Interactions**
   - Click to copy bot response
   - Clear all chat history
   - Smooth scroll animations

### Edge Cases
- Empty message: Prevent sending
- API error: Show error message in chat
- Network failure: Display retry option
- Very long messages: Proper word-wrap
- Rapid message sending: Queue or debounce

## 4. Acceptance Criteria

1. ✓ Page loads with dark neon theme
2. ✓ Logo displays with animated gradient
3. ✓ Messages can be sent and appear in chat
4. ✓ Bot responses appear from API
5. ✓ Typing indicator shows during loading
6. ✓ Mobile responsive at all breakpoints
7. ✓ Neon glow effects visible on interactive elements
8. ✓ Smooth animations on message send/receive
9. ✓ Input focuses properly on mobile
10. ✓ Can deploy to Vercel (static files)

## 5. Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, animations, flexbox
- **JavaScript (ES6+)** - Vanilla JS, no frameworks needed
- **Deployment**: Static files compatible with Vercel

## 6. File Structure

```
chatai/
├── index.html      # Main HTML file
├── styles.css      # All styles
├── script.js       # Chat functionality
└── README.md       # Deployment instructions
```
