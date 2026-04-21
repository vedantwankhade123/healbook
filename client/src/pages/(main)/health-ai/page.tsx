"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface Message {
  role: "user" | "model";
  text: string;
}

const quickPrompts = [
  "I have a sharp headache.",
  "Suggest a cardiologist.",
  "What are the symptoms of flu?",
  "How to manage stress?"
];

export default function HealthAIPage() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const newMsg: Message = { role: "user", text };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Map history to parts format for Gemini
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          history,
          userId: user?.uid || ""
        }),
      });

      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: "model", text: data.text }]);
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (error: any) {
      showError(error.message || "Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] space-y-6">
      <section className="flex-shrink-0">
        <h1 className="text-3xl lg:text-5xl font-bold text-on-surface font-poppins tracking-tight mb-2">
            AI <span className="text-primary">Assistance</span>
        </h1>
        <p className="text-on-surface-variant font-body text-lg">Your intelligent, clinical-grade health companion.</p>
      </section>

      <Card variant="outline" className="flex-1 flex flex-col p-0 overflow-hidden relative border-none shadow-ambient">
        {/* Banner */}
        <div className="p-4 bg-tertiary-container text-on-tertiary-container text-xs font-bold text-center tracking-widest font-poppins z-10">
            Clinical AI Beta: Consult a human doctor for medical emergencies.
        </div>

        {/* Chat Area */}
        <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 hide-scrollbar scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-5xl animate-pulse">smart_toy</span>
              </div>
              <h3 className="text-2xl font-bold font-poppins">Hello, {user?.name?.split(" ")[0]}</h3>
              <p className="text-on-surface-variant font-body">
                I am HealBot. Describe your symptoms or ask health questions to begin your journey.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                {quickPrompts.map(p => (
                    <button 
                        key={p} 
                        onClick={() => sendMessage(p)}
                        className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs font-bold font-poppins hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        {p}
                    </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                    max-w-[85%] md:max-w-[70%] p-6 rounded-3xl font-body leading-relaxed text-sm shadow-sm
                    ${m.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/10'}
                `}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-container-high p-6 rounded-3xl rounded-tl-none animate-pulse">
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-outline-variant rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-outline-variant rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-outline-variant rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/10">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-4 items-end"
          >
            <textarea
                rows={1}
                placeholder="Message HealBot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                    }
                }}
                className="flex-1 min-h-[56px] py-4 px-6 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-body text-sm"
            />
            <Button 
                type="submit" 
                size="lg" 
                className="w-14 h-14 rounded-full flex-shrink-0"
                disabled={isLoading || !input.trim()}
            >
              <span className="material-symbols-outlined fill-1">send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
