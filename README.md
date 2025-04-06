# AI Tour Guide

AI Tour Guide is an innovative PWA application that provides real-time tour guide services through camera and AI technology. Wherever you are in the world, simply take a photo and ask a question, and the AI will introduce you to nearby attractions, history, and culture.

## Key Features

- 📸 **Real-time Camera Integration**: Capture surrounding attractions with your phone camera
- 🗣️ **Voice Interaction**: Support for voice input for natural questioning
- 🌍 **Geolocation**: Precise location tracking for relevant place information
- 🤖 **AI Analysis**: Advanced AI technology for analyzing photos and location data
- 🏛️ **Attraction Information**: Rich historical background and cultural insights
- 📱 **PWA Support**: Installable on home screen with offline capabilities

## Technical Highlights

- **Frontend Framework**: Built with Next.js 15 and React 19
- **AI Integration**: Incorporates Google AI and Cloud Vision API
- **Map Services**: Utilizes Google Maps and Places API
- **PWA**: Supports offline functionality and home screen installation
- **Voice Recognition**: Implements Web Speech API
- **Location Services**: Integrates Geolocation API
- **Responsive Design**: Supports various device sizes

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Then fill in the required API keys in `.env.local`.

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) to use the application.

## Deployment

This project is deployed on the Vercel platform: [https://tour-guide-ai-iota.vercel.app](https://tour-guide-ai-iota.vercel.app)

## License

This project is licensed under the MIT License.