# FairwayLive 🏌️‍♂️

Real-time golf scoring app with social betting using Pride Points. Turn every round into a live sports broadcast for your friends!

## Features

- **Automatic Course Detection**: GPS-based course identification and hole tracking
- **Voice-First Scoring**: One-tap voice recording with AI transcription
- **Live Leaderboard**: Real-time scoring updates with trend indicators
- **Pride Points Betting**: Virtual currency betting system (no real money)
- **Social Commentary**: Voice notes and reactions during rounds
- **Advanced Analytics**: Shot tracking, improvement recommendations, and insights

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Real-time**: Socket.io, WebSocket
- **AI/ML**: OpenAI Whisper (voice), MCP tools
- **Mobile**: React Native (iOS/Android)
- **Infrastructure**: Docker, MCP servers

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/fairwaylive.git
cd fairwaylive

# Run the quick start script
./quickstart.sh

# Or manually:
npm install
docker-compose up -d postgres redis
npm run dev
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your API keys:

```env
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=fairwaylive-media
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/verify` - Verify token

### Rounds
- `POST /api/rounds` - Create new round
- `GET /api/rounds/active` - Get active rounds
- `GET /api/rounds/:id` - Get round details
- `POST /api/rounds/:id/scores` - Submit score
- `POST /api/rounds/:id/complete` - Complete round

### Betting
- `GET /api/betting/balance` - Get Pride Points balance
- `POST /api/betting/place` - Place bet
- `GET /api/betting/odds` - Get betting odds
- `GET /api/betting/rounds/:id/leaderboard` - Betting leaderboard

### Analytics
- `GET /api/analytics/dashboard` - User analytics
- `GET /api/analytics/rounds/:id` - Round analytics
- `GET /api/analytics/recommendations` - Improvement tips

## WebSocket Events

### Client → Server
- `round:join` - Join a round
- `score:update` - Update score
- `location:update` - Update GPS location
- `voice:send` - Send voice note
- `bet:place` - Place Pride Points bet

### Server → Client
- `score:updated` - Score update broadcast
- `leaderboard:update` - Leaderboard changes
- `voice:received` - Voice note broadcast
- `bet:placed` - Bet notification
- `user:joined` - User joined round

## MCP Tools

The app uses Model Context Protocol (MCP) for advanced features:

- **Course Detection**: GPS geofencing and course identification
- **Voice Transcription**: Golf-specific vocabulary processing
- **Score Parsing**: Natural language score extraction
- **Betting Engine**: Odds calculation and bet resolution
- **Real-time Updates**: WebSocket broadcasting
- **Analytics Collection**: Performance tracking and insights

## Mobile App

The React Native app is in the `mobile` directory:

```bash
cd mobile
npm install

# iOS
npx pod-install
npm run ios

# Android
npm run android
```

## Production Deployment

```bash
# Set environment variables
export JWT_SECRET=...
export OPENAI_API_KEY=...
# ... other vars

# Deploy
./deploy.sh
```

## Docker Compose

The app includes a complete Docker setup:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- auth.test.js

# Run with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file

## Support

- Documentation: [docs.fairwaylive.com](https://docs.fairwaylive.com)
- Issues: [GitHub Issues](https://github.com/yourusername/fairwaylive/issues)
- Discord: [Join our community](https://discord.gg/fairwaylive)

---

Built with ❤️ for golfers who can't always play together