# 🏸 Badminton Buddy

A modern, full-stack web application for managing badminton sessions, tracking players, and organizing games with beautiful UI and device-based privacy.

![Badminton Buddy](./public/Favicon.png)

## ✨ Features

### 🎯 **Session Management**
- Create and manage badminton sessions with specific dates
- Add multiple players to each session
- Generate random or manual team pairings
- Track game scores and completion status
- Export session data to CSV format
- Share sessions with others via shareable links

### 👥 **Player Management**
- Add and manage player profiles
- Device-based privacy (your players are private to your device)
- Legacy data migration support
- Clean, intuitive player selection interface

### 🎮 **Game Tracking**
- Automatic random team pairing generation
- Manual team pairing for custom matchups
- Real-time score tracking and editing
- Game completion status monitoring
- Delete/modify games as needed

### 📊 **Statistics & Analytics**
- Session completion tracking
- Player participation statistics
- Game outcome analysis
- Beautiful data visualization

### 🔒 **Privacy & Security**
- **Device-based data isolation** - Your data stays on your device
- No user accounts required
- Automatic device ID generation and management
- Legacy data preservation during migrations
- Optional session sharing when desired

### 🎨 **Modern UI/UX**
- Beautiful gradient-based design system
- Responsive design for all devices
- Dark/Light theme support
- Smooth animations and transitions
- Elevated card layouts with shadows and blur effects
- Professional typography with custom fonts

## 🚀 Technology Stack

### **Frontend**
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### **Backend & Database**
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security** - Database-level privacy controls
- **Device-based authentication** - No sign-up required

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📁 Project Structure

```
badminton-buddy/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Home page
│   ├── players/                 # Player management
│   │   └── page.tsx            # Players list and creation
│   ├── sessions/               # Session management
│   │   ├── page.tsx           # Sessions list and creation
│   │   └── [id]/              # Dynamic session routes
│   │       └── page.tsx       # Session detail page
│   ├── shared/                # Shared session viewing
│   │   └── [id]/
│   │       └── page.tsx       # Public session view
│   └── stats/                 # Statistics and analytics
│       └── page.tsx           # Stats dashboard
├── components/                # Reusable UI components
│   ├── navigation.tsx         # Main navigation
│   ├── theme-provider.tsx     # Theme management
│   └── ui/                    # shadcn/ui components
├── lib/                       # Utility libraries
│   ├── supabase.ts           # Database client and services
│   └── utils.ts              # Helper functions
├── public/                    # Static assets
│   └── Favicon.png           # App favicon
└── styles/                    # Additional stylesheets
```

## 🛠️ Installation & Setup

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)

### **1. Clone the Repository**
```bash
git clone https://github.com/1110JY/BadmintonBuddyV2.git
cd BadmintonBuddyV2
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Set Up Environment Variables**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **4. Set Up Database**
1. Create a new project in [Supabase](https://supabase.com)
2. Run the database migration script:
```sql
-- Run the SQL commands in database-migration.sql
-- This creates the required tables with device_id columns
```

### **5. Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📊 Database Schema

The application uses a simple but effective schema:

### **Players Table**
```sql
players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT -- For privacy isolation
)
```

### **Sessions Table**
```sql
sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  players TEXT[] NOT NULL,
  games JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT -- For privacy isolation
)
```

## 🔐 Privacy Features

### **Device-Based Isolation**
- Each device gets a unique, persistent identifier
- Players and sessions are isolated per device
- No cross-device data sharing unless explicitly shared
- Legacy data is preserved during migrations

### **Sharing Mechanism**
- Sessions can be optionally shared via secure links
- Shared sessions are viewable but not editable by others
- Original device retains full control

## 🎯 Usage Guide

### **Creating Players**
1. Navigate to "Players" page
2. Click "Add Player"
3. Enter player name and save
4. Players are automatically associated with your device

### **Managing Sessions**
1. Go to "Sessions" page
2. Click "Create Session"
3. Select date and add players
4. Generate random pairings or create manual teams
5. Track scores and manage games

### **Scoring Games**
1. Open a session detail page
2. Click "Score" or "Edit" on any game
3. Enter final scores for both teams
4. Game automatically marks as completed

### **Sharing Sessions**
1. Open session detail page
2. Click "Share Session"
3. Copy the generated link
4. Share with others for viewing

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Other Platforms**
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS
- Google Cloud Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues

- Favicon may require hard refresh to appear due to browser caching
- CSV export filename includes session date for better organization
- Legacy data migration preserves all existing players and sessions

## 🔮 Roadmap

- [ ] Tournament bracket generation
- [ ] Player statistics and rankings  
- [ ] Advanced game scheduling
- [ ] Mobile app development
- [ ] Real-time collaborative scoring
- [ ] Advanced analytics dashboard

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing GitHub issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

## 🏆 Acknowledgments

- Built with [v0.dev](https://v0.dev) for rapid prototyping
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Database powered by [Supabase](https://supabase.com)
- Hosted on [Vercel](https://vercel.com)

---

**Made with ❤️ for the badminton community** 🏸