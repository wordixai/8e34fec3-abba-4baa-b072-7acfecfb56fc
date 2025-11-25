# Bao Retro Camera 📷

A beautiful retro-styled camera web app that captures photos from your webcam, develops them with a vintage Polaroid effect, and generates AI-powered captions.

## Features

✨ **Retro Aesthetic**: Handwritten font and vintage camera design
📸 **Webcam Integration**: Live viewfinder in the camera lens
🎞️ **Polaroid Effect**: Photos eject and develop with realistic animation
🤖 **AI Captions**: Gemini Flash generates warm, personalized messages
🖱️ **Drag & Drop**: Arrange photos freely on the wall
✏️ **Editable Text**: Double-click or use edit icon to customize captions
🔄 **Regenerate**: Get new AI-generated captions with one click
💾 **Download**: Export entire Polaroid card as image
🗑️ **Delete**: Remove unwanted photos

## Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Add your Gemini API key:
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your key
VITE_GEMINI_API_KEY=your_key_here
```

Get your free API key at: https://aistudio.google.com/app/apikey

**Note**: The app includes a fallback API key for testing, but it's recommended to use your own for production.

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and allow camera access when prompted

## How to Use

1. **Take a Photo**: Click the camera button (circular area on the left)
2. **Watch it Develop**: The photo ejects upward and develops from blurry to clear
3. **Drag to Wall**: Click and drag the photo anywhere on screen
4. **Edit Caption**: Hover over text to see edit/regenerate icons, or double-click text
5. **Manage Photos**: Hover over photo to see download/delete toolbar

## Technologies

- React + TypeScript
- Vite
- Tailwind CSS
- Google Generative AI (Gemini Flash)
- html2canvas
- Lucide React Icons

## Browser Requirements

- Modern browser with webcam support
- Camera permissions enabled
- Recommended: Chrome, Firefox, Safari (latest versions)

Enjoy capturing and sharing beautiful retro memories! 🎨✨
