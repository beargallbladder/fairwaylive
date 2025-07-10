# FairwayLive UX Flow - Fast & Dirty Golf

## Core Philosophy
- **ONE TAP EVERYTHING** - If it takes more than one tap, it's bullshit
- **NO LOADING SCREENS** - Everything cached, everything instant
- **VOICE FIRST** - Nobody wants to type on the course
- **BATTERY SAVER** - GPS only when needed, minimal background activity

## User Journey

### 1. LANDING (First Touch)
```
[Logo]
"Live golf betting with your boys"

[START ROUND] <- Big ass button
[WATCH LIVE]  <- Join friends' rounds

"Sign in" <- tiny link at bottom
```

### 2. INSTANT START (No Login Required)
```
GPS: "Pebble Beach detected"
     "Not right? [Change]"

[RECORD ROUND] <- One tap, we're rolling
```

### 3. MAIN SCREEN (During Round)
```
Hole 1 | Par 4 | 385 yds
----------------------
[🎙️] <- HUGE voice button (60% of screen)

"Hold to talk trash or call your shot"

[Quick Score: - 3 4 5 6 7 +]

Friends Watching: 🔥 Mike, Tom, 3 others
Bets on You: 💰 $230 pride points
```

### 4. VOICE FLOW (The Magic)
User holds button:
"Just crushed it 280 down the middle, Mike's in the trees again"

Instant transcription shows:
✓ Drive: 280 yards
✓ Mike: In trouble
[POST IT]

### 5. BETTING TICKER (Bottom 20% of screen)
```
LIVE BETS                          
Mike → birdie this hole    2.5x 💰
Tom → breaks 80           4.2x 💰
You → next 3 holes -1     3.0x 💰
[QUICK BET: 10 25 50 100 ALL-IN]
```

### 6. FRIEND VIEW (Watching Mode)
```
TOM'S ROUND - Hole 7
-------------------
Last update: "Fuck this hole" -0:23s

Score: +4 (trending 📈)
         
[💰 BET ON TOM]
[🎙️ SEND VOICE NOTE]

Chat:
Mike: "You're done bro" 🔥
John: "That's a snowman coming"
```

## Navigation Structure

```
/              → Landing/Quick Start
/round         → Active round screen
/watch/:id     → Watch friend's round  
/leaderboard   → Live leaderboard
/profile       → Stats & settings (hidden)
```

## Key UI Components

### 1. Voice Button (Center Stage)
- 50-60% of screen real estate
- Glowing when friends are listening
- One tap to record, release to send
- Visual feedback (pulsing, waveform)

### 2. Score Entry (Dead Simple)
- Horizontal number picker
- Defaults to par
- Swipe or tap to change
- Auto-advances to next hole

### 3. Betting Interface
- Fixed bottom ticker
- One-tap preset amounts  
- Shows live odds
- Glows when action happens

### 4. GPS/Battery Optimization
- GPS polls every 2 minutes (not constant)
- Uses course layout to predict location
- Caches everything locally
- Service worker for offline

## Interaction Patterns

### Voice Recording
```
PRESS → "Recording..." → RELEASE → "Sending..."
                ↓
        [Waveform visual]
                ↓  
        Instant transcription
                ↓
        Auto-parse scores
```

### Quick Betting
```
See bet → Tap amount → DONE
   ↓          ↓          ↓
"Mike"    "50 pts"   "Confirmed"
```

### Score Entry
```
Finish hole → Score picker appears
     ↓              ↓
"How'd you do?"  [3 4 5 6 7]
                    ↓
              Tap score → Next hole
```

## Visual Design

### Colors
- Background: Pure black (#000)
- Primary: Golf green (#00AA00)  
- Hot: Flame orange (#FF4500)
- Text: Clean white (#FFFFFF)
- Muted: Gray (#666666)

### Typography
- Big & Bold: SF Pro Display Heavy
- Body: System default (fast loading)
- Numbers: Tabular (consistent width)

### Layout
```
[Status Bar - Minimal]
[Main Action Area - 60%]
[Live Feed - 20%]  
[Betting Ticker - 20%]
```

## Performance Tricks

1. **Preload Everything**
   - Next 3 holes data
   - Friend avatars
   - Common voice responses

2. **Local First**
   - IndexedDB for rounds
   - Service worker caching
   - Optimistic updates

3. **Lazy GPS**
   - Only on hole changes
   - Fallback to manual selection
   - Background location off

4. **Compressed Data**
   - WebP images only
   - Brotli compression
   - Binary protocols

## The Vibe

- **Raw & Real**: No corporate polish
- **Trash Talk Central**: Voice notes are unfiltered  
- **Instant Gratification**: See bets win/lose in real-time
- **FOMO Factory**: "3 friends watching" notifications
- **Competitive Edge**: Everyone sees everything

## What We're NOT Building

❌ Swing analysis
❌ GPS distances to every tree
❌ 3D course flyovers  
❌ Statistics overload
❌ Social media features
❌ Instruction videos
❌ Equipment tracking
❌ Photo sharing
❌ Course reviews

## What We ARE Building

✅ One-tap voice shit talking
✅ Real-time pride point betting
✅ Instant score tracking
✅ Live friend stalking
✅ Battery-friendly GPS
✅ Works offline
✅ Fast as fuck
✅ Fun as hell