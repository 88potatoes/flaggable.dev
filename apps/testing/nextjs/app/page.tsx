"use client";

import { useState } from "react";
import {
  Bookmark,
  Compass,
  Heart,
  Home,
  MessageCircle,
  Music,
  Plus,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";

interface MockPost {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  description: string;
  music: string;
  likes: number;
  comments: number;
  bookmarks: number;
  shares: number;
  tags: string[];
  gradient: string;
  badge?: string;
  stickerText: string;
}

const MOCK_POSTS: MockPost[] = [
  {
    id: "1",
    username: "Alex Morgan",
    handle: "@alexmorgan",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Testing out our new feature release today! What do you all think? 🚀✨",
    music: "Original Sound - alexmorgan • 1.2M videos",
    likes: 142300,
    comments: 2420,
    bookmarks: 18400,
    shares: 8930,
    tags: ["#coding", "#featureflags", "#nextjs", "#buildinpublic"],
    gradient: "from-purple-900 via-indigo-950 to-black",
    badge: "PRO",
    stickerText: "FEATURE DROP ⚡️",
  },
  {
    id: "2",
    username: "Devin Codes",
    handle: "@devincodes",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    description: "POV: You ship on Friday evening without feature flags 💀 vs with Flaggable 👑",
    music: "Synthwave Beats - Chill Radio • 450K videos",
    likes: 389200,
    comments: 5120,
    bookmarks: 45200,
    shares: 21400,
    tags: ["#devhumor", "#tech", "#programmerlife", "#webdev"],
    gradient: "from-rose-900 via-zinc-950 to-black",
    badge: "VERIFIED",
    stickerText: "FRIDAY DEPLOY 🚨",
  },
  {
    id: "3",
    username: "Sarah Chen",
    handle: "@sarah_tech",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    description:
      "Day in the life of a design technologist in SF ☕️📱 Switching features in real time!",
    music: "Aesthetic Morning Lofi - Sarah • 89K videos",
    likes: 95400,
    comments: 1120,
    bookmarks: 12300,
    shares: 4510,
    tags: ["#dayinthelife", "#techlife", "#design", "#ux"],
    gradient: "from-emerald-950 via-teal-950 to-black",
    badge: "CREATOR",
    stickerText: "SF VLOG 🌁",
  },
];

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default function FlagTokPage() {
  const [activeTab, setActiveTab] = useState<"following" | "foryou">("foryou");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<Record<string, string[]>>({
    "1": ["Looks super clean!", "Can't wait to test this prompt out 🔥", "Is this on Flaggable?"],
    "2": ["Never deploy on Friday unless you have flags 😂", "Real talk!!"],
    "3": ["Aesthetic vibes ☕️", "Love the UI layout"],
  });
  const [newComment, setNewComment] = useState("");

  const currentPost = MOCK_POSTS[currentIndex] || MOCK_POSTS[0];
  const isCurrentLiked = Boolean(likedPosts[currentPost.id]);
  const isCurrentBookmarked = Boolean(bookmarkedPosts[currentPost.id]);

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeCommentsPostId) return;
    setCommentsList((prev) => ({
      ...prev,
      [activeCommentsPostId]: [newComment.trim(), ...(prev[activeCommentsPostId] || [])],
    }));
    setNewComment("");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white">
      {/* Left Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-900 px-4 py-5 justify-between">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 via-red-500 to-pink-500 font-black text-lg text-white shadow-md">
              F
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Flag<span className="text-rose-500">Tok</span>
              </span>
              <p className="text-[10px] text-zinc-400 -mt-1 font-mono">Next.js Demo App</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              type="button"
              className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-semibold text-rose-500 bg-zinc-900/80 transition-colors"
            >
              <Home className="size-5" />
              <span>For You</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-colors"
            >
              <Compass className="size-5" />
              <span>Explore</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-colors"
            >
              <TrendingUp className="size-5" />
              <span>Trending</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-colors"
            >
              <User className="size-5" />
              <span>Profile</span>
            </button>
          </nav>

          {/* Prompt Testing Callout Banner */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>Flaggable Test Target</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This app is ready for testing your Flaggable AI Agent prompt. Follow the onboarding
              prompt to mount feature flags here!
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-600 px-3">
          <p>© 2025 FlagTok by Flaggable</p>
        </div>
      </aside>

      {/* Main Video Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center relative bg-zinc-950">
        {/* Top Header Floating Bar */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="lg:hidden flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-red-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white">
              F
            </div>
            <span className="font-bold text-base">FlagTok</span>
          </div>

          <div className="flex items-center gap-5 mx-auto">
            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className={`text-sm font-semibold transition-colors ${
                activeTab === "following"
                  ? "text-white scale-105 border-b-2 border-white pb-1"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Following
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("foryou")}
              className={`text-sm font-semibold transition-colors ${
                activeTab === "foryou"
                  ? "text-white scale-105 border-b-2 border-white pb-1"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              For You
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-zinc-300 hover:text-white"
            aria-label="Toggle audio mute"
          >
            {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </header>

        {/* Video Card Container */}
        <div className="relative h-full w-full max-w-[440px] max-h-[860px] my-auto rounded-none sm:rounded-3xl overflow-hidden border-0 sm:border border-zinc-800 shadow-2xl bg-black">
          {/* Mock Video Simulated Canvas */}
          <div
            className={`h-full w-full bg-gradient-to-br ${currentPost.gradient} flex flex-col justify-between p-6 relative`}
          >
            {/* Background Simulated Animation Lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Top Badge Overlay */}
            <div className="pt-12 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
                <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                {currentPost.stickerText}
              </div>
            </div>

            {/* Center Visual Wave / Post Number */}
            <div className="my-auto text-center z-10 select-none space-y-4">
              <div className="size-24 mx-auto rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner animate-pulse">
                🎬
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white/90">
                  {currentPost.username}
                </span>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentPost.handle}</p>
              </div>
            </div>

            {/* Bottom Details Overlay */}
            <div className="space-y-3 z-10 pb-12 sm:pb-4 pr-16">
              <div className="flex items-center gap-2">
                <img
                  src={currentPost.avatar}
                  alt={currentPost.username}
                  className="size-10 rounded-full border-2 border-white object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">{currentPost.username}</span>
                    {currentPost.badge && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded">
                        {currentPost.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{currentPost.handle}</span>
                </div>
              </div>

              <p className="text-sm text-white/90 leading-snug">{currentPost.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {currentPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold text-cyan-300 hover:underline cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Music className="size-3.5 animate-spin-slow shrink-0" />
                <span className="truncate">{currentPost.music}</span>
              </div>
            </div>

            {/* Right Action Floating Column */}
            <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
              {/* Creator Avatar with follow + */}
              <div className="relative pb-2">
                <img
                  src={currentPost.avatar}
                  alt=""
                  className="size-11 rounded-full border-2 border-white object-cover"
                />
                <button
                  type="button"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 size-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform shadow-md"
                  aria-label="Follow creator"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              {/* Like Button */}
              <button
                type="button"
                onClick={() => toggleLike(currentPost.id)}
                className="flex flex-col items-center group"
                aria-label="Like video"
              >
                <div
                  className={`size-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    isCurrentLiked
                      ? "bg-rose-500/30 text-rose-500 scale-110"
                      : "bg-zinc-900/60 text-white hover:bg-zinc-800"
                  }`}
                >
                  <Heart className={`size-6 ${isCurrentLiked ? "fill-rose-500" : ""}`} />
                </div>
                <span className="text-xs font-semibold mt-1">
                  {formatCount(currentPost.likes + (isCurrentLiked ? 1 : 0))}
                </span>
              </button>

              {/* Comment Button */}
              <button
                type="button"
                onClick={() => setActiveCommentsPostId(currentPost.id)}
                className="flex flex-col items-center group"
                aria-label="Open comments"
              >
                <div className="size-11 rounded-full bg-zinc-900/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                  <MessageCircle className="size-6" />
                </div>
                <span className="text-xs font-semibold mt-1">
                  {formatCount((commentsList[currentPost.id] || []).length + currentPost.comments)}
                </span>
              </button>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={() => toggleBookmark(currentPost.id)}
                className="flex flex-col items-center group"
                aria-label="Save video"
              >
                <div
                  className={`size-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    isCurrentBookmarked
                      ? "bg-amber-500/30 text-amber-400 scale-110"
                      : "bg-zinc-900/60 text-white hover:bg-zinc-800"
                  }`}
                >
                  <Bookmark className={`size-6 ${isCurrentBookmarked ? "fill-amber-400" : ""}`} />
                </div>
                <span className="text-xs font-semibold mt-1">
                  {formatCount(currentPost.bookmarks + (isCurrentBookmarked ? 1 : 0))}
                </span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={() => alert("Share link copied!")}
                className="flex flex-col items-center group"
                aria-label="Share video"
              >
                <div className="size-11 rounded-full bg-zinc-900/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                  <Share2 className="size-6" />
                </div>
                <span className="text-xs font-semibold mt-1">
                  {formatCount(currentPost.shares)}
                </span>
              </button>

              {/* Spinning Disc */}
              <div className="size-10 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center animate-spin-slow">
                <div className="size-3 rounded-full bg-zinc-400" />
              </div>
            </div>

            {/* Video Switching Controls (Prev / Next Buttons) */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="size-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/60 transition-colors"
                aria-label="Previous video"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={currentIndex === MOCK_POSTS.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(MOCK_POSTS.length - 1, prev + 1))}
                className="size-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/60 transition-colors"
                aria-label="Next video"
              >
                ▼
              </button>
            </div>
          </div>
        </div>

        {/* Comment Drawer Overlay */}
        {activeCommentsPostId && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
            <div className="w-full max-w-[440px] h-[65vh] bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-800 flex flex-col p-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-sm">
                  Comments ({(commentsList[activeCommentsPostId] || []).length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveCommentsPostId(null)}
                  className="text-zinc-400 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {(commentsList[activeCommentsPostId] || []).map((comment, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="size-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shrink-0">
                      U{i + 1}
                    </div>
                    <div className="flex-1 bg-zinc-800/60 p-2.5 rounded-xl">
                      <span className="font-semibold text-zinc-300 block mb-0.5">user_{i + 1}</span>
                      <p className="text-zinc-100">{comment}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddComment}
                className="pt-2 border-t border-zinc-800 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="size-8 rounded-full bg-rose-600 text-white flex items-center justify-center disabled:opacity-40"
                  aria-label="Post comment"
                >
                  <Send className="size-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
