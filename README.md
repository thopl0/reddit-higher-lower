# Reddit Higher-Lower Game

A fun web-based game inspired by the classic **Higher or Lower** concept, but powered by real-time Reddit data.  
Players guess whether the next subreddit has **more** or **fewer subscribers** than the current one.

---

## 🎮 Features

- Live subreddit data from the Reddit API
- Clean UI with smooth animations
- Score tracking and leaderboards
- Streak bonuses for consecutive correct guesses
- Redis-backed caching for fast performance

---

## 🚀 How to Play

1. A subreddit is shown along with its subscriber count.
2. Another subreddit is revealed (without subscriber count).
3. Guess whether the new subreddit has **higher** or **lower** subscribers.
4. Keep guessing to build your streak and climb the leaderboard.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js + TailwindCSS
- **Backend:** Node.js (Express)
- **Database/Cache:** Redis
- **API:** Reddit API

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/thopl0/reddit-higher-lower.git
cd reddit-higher-lower
```
