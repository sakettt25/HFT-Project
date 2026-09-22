# CryptoHFT Frontend

A beautiful, modern landing page and trading terminal for the CryptoHFT high-frequency trading platform.

## 🎭 Now Works Without Backend!

**New Feature**: The frontend now includes automatic **Mock Data Mode**! 

✅ **No backend required** - Full trading terminal with realistic data  
✅ **Automatic fallback** - Seamlessly switches to mock data  
✅ **Complete experience** - All features work without Java backend  
✅ **Perfect for demos** - Show the platform anytime, anywhere  

See [MOCK_DATA_MODE.md](./MOCK_DATA_MODE.md) for details.

## Features

### Landing Page
- **Modern Design**: Inspired by Microsoft Excel for Web with a sleek green color theme
- **Responsive Layout**: Works beautifully on desktop, tablet, and mobile devices
- **Animated Elements**: Smooth animations and gradient effects
- **Feature Showcase**: Highlights key platform capabilities
- **Architecture Overview**: Visual representation of system modules
- **Tech Stack Display**: Modern technology badges
- **Developer Credit**: Developed by Saket Saurav

### Trading Terminal
- Real-time market data visualization
- Order entry and management
- Position tracking and P&L monitoring
- WebSocket-based live updates
- Interactive order book
- Price charts and recent trades

## Getting Started

### Prerequisites
- Node.js 18+ or higher
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
hft-frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Beautiful landing page
│   │   └── LandingPage.css      # Landing page styles
│   ├── components/              # Trading terminal components
│   ├── services/                # API and WebSocket services
│   ├── hooks/                   # Custom React hooks
│   ├── App.jsx                  # Main application component
│   └── index.css                # Global styles
├── public/                      # Static assets
└── package.json                 # Project dependencies
```

## Color Theme

The design uses a professional green color scheme inspired by Microsoft Excel:

- **Primary Green**: `#00d97e` - Main accent color
- **Dark Green**: `#00b868` - Hover and active states
- **Blue Accent**: `#4f8ef7` - Secondary highlights
- **Dark Background**: `#08101e` - Main background
- **Light Background**: `#0f1925` - Cards and panels

## Technologies Used

- **React 19** - UI framework
- **Vite 8** - Build tool and dev server
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client
- **WebSocket** - Real-time communication

## Landing Page Sections

1. **Hero Section** - Eye-catching introduction with CTA buttons
2. **Features Grid** - Key platform capabilities
3. **Architecture Overview** - System modules and components
4. **Tech Stack** - Technologies powering the platform
5. **Call to Action** - Encouragement to start trading
6. **Footer** - Developer credit and navigation

## Developer

**Developed by Saket Saurav**

This project showcases enterprise-grade front-end development with modern React practices, beautiful animations, and responsive design principles.

## License

MIT License
