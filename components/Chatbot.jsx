"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ChevronDown,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Hi! I'm **CareerBot**, your AI career assistant on CampusConnect.\n\nI can help you discover job opportunities, answer questions about the application process, and give you career advice. What would you like to know?",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  "What jobs are currently available?",
  "How do I apply for a job?",
  "Tips for writing a great resume?",
  "How does interview scheduling work?",
];

// ─── Utility: Render simple markdown-ish text ─────────────────────────────────
function RenderMessage({ content }) {
  // Bold (**text**), newlines → <br/>
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm max-w-[80%]"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-slate-600 to-slate-800"
            : "bg-gradient-to-br from-blue-600 to-indigo-600"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`px-4 py-2.5 text-sm leading-relaxed max-w-[78%] ${
          isUser
            ? "rounded-2xl rounded-br-sm text-white"
            : "rounded-2xl rounded-bl-sm text-gray-800"
        }`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                boxShadow: "0 4px 15px rgba(79,70,229,0.3)",
              }
            : {
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }
        }
      >
        <RenderMessage content={message.content} />
        <p className={`text-[10px] mt-1 ${isUser ? "text-blue-200" : "text-gray-400"}`}>
          {message.timestamp?.toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Chatbot Component ───────────────────────────────────────────────────
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom("instant");
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setShowScrollBtn(!isNearBottom);
  };

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    setInput("");
    setError(null);

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build history excluding the welcome message for API
      const history = [...messages, userMessage]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to get response");
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <>
      {/* ── Floating Chat Button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.button
              key="fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => setIsOpen(true)}
              aria-label="Open CareerBot chat"
              className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer group"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
              }}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping" />
              <MessageCircle className="w-6 h-6 text-white relative z-10" />
              {/* Tooltip */}
              <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                Chat with CareerBot ✨
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[370px] max-w-[calc(100vw-24px)] flex flex-col"
            style={{
              height: "min(580px, calc(100dvh - 80px))",
              borderRadius: "20px",
              background: "rgba(248, 250, 255, 0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow:
                "0 32px 64px rgba(79,70,229,0.18), 0 8px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                borderRadius: "20px 20px 0 0",
              }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">CareerBot</p>
                <p className="text-blue-200 text-xs">A Personalized Chat Assistant</p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close chat"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* ── Messages Area ── */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative"
              style={{ scrollbarWidth: "thin" }}
            >
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {isLoading && <TypingIndicator />}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-[72px] right-4 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors z-10"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Suggestion Chips (shown only on first interaction) ── */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* ── Input Area ── */}
            <div
              className="px-3 pb-3 pt-2 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div
                className="flex items-end gap-2 rounded-2xl px-3 py-2"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <textarea
                  ref={inputRef}
                  id="chatbot-input"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about jobs, careers…"
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 bg-transparent border-0 outline-none leading-5 py-0.5 max-h-24 disabled:opacity-50"
                  style={{ minHeight: "22px" }}
                />
                <button
                  id="chatbot-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background:
                      input.trim() && !isLoading
                        ? "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)"
                        : "#e5e7eb",
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                  ) : (
                    <Send
                      className={`w-4 h-4 ${input.trim() ? "text-white" : "text-gray-400"}`}
                    />
                  )}
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-1.5">
                CareerBot can make mistakes · Verify important info
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
