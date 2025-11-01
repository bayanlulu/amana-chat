# 💬 Amana Chat

A real-time chat application built with Next.js, React, TypeScript, and Ably for seamless multi-user communication.

## 🌟 Features

- ✅ Real-time messaging between multiple users
- ✅ Online presence tracking
- ✅ Secure token-based authentication
- ✅ Modern gradient UI with smooth animations
- ✅ Connection status indicators
- ✅ Responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Ably account ([sign up here](https://ably.com/sign-up))

### Installation

```bash
# Clone the repository
git clone <your-repository-url>
cd amana-chat

# Install dependencies
npm install

# Create environment file
echo "ABLY_API_KEY=your_ably_api_key_here" > .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and test with multiple browser windows.

## 📁 Project Structure

```
amana-chat/
├── app/
│   ├── api/ably-auth/route.ts    # Server-side authentication
│   └── page.tsx                   # Main chat interface
├── .env.local                     # Environment variables
```

## 🔒 Security

The app uses secure token-based authentication:
- API key stored server-side only (`.env.local`)
- Client receives temporary tokens from `/api/ably-auth`
- API key never exposed to browser

## 🌐 Deploy to Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# Deploy on Vercel
# 1. Import your GitHub repo at vercel.com
# 2. Add environment variable: ABLY_API_KEY
# 3. Deploy
```

## 🧪 Testing

**Multi-User Test:**
1. Open 2-3 browser windows
2. Join with different usernames
3. Send messages and verify real-time delivery
4. Check online users list updates

## 🛠️ Technology Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Real-time:** Ably SDK
- **Styling:** Tailwind CSS

## 🐛 Troubleshooting

**Connection issues?**
- Verify Ably API key is correct in `.env.local`
- Check browser console for errors
- Restart development server after changing env variables

**Messages not syncing?**
- Ensure all windows use different usernames
- Check internet connection
- Verify Ably service status

## 📄 Assignment Requirements

This project fulfills the Amana Bootcamp final assignment:
- ✅ Ably API integration
- ✅ Secure environment variable setup
- ✅ Multi-user real-time chat
- ✅ Deployed and functional

## 👥 Authors

**Bayan Lulu** - Amana Bootcamp Student

## 🙏 Acknowledgments

Built with ❤️ for Amana Bootcamp using [Ably](https://ably.com), [Next.js](https://nextjs.org), and [Tailwind CSS](https://tailwindcss.com).