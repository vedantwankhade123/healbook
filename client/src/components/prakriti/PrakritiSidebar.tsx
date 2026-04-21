"use client";

import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { usePrakriti } from "@/context/PrakritiContext";
import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useNotifications } from "@/context/NotificationContext";
import { PrakritiChatPaymentCard, type ChatPaymentPrompt } from "@/components/prakriti/PrakritiChatPaymentCard";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  paymentPrompts?: ChatPaymentPrompt[];
};

export const PrakritiSidebar = () => {
  const { isOpen, togglePrakriti } = usePrakriti();
  const { user, loading } = useAuth();
  const chatKey = useMemo(() => user?.uid || "guest", [user?.uid]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-on-surface/5 transition-opacity duration-500"
          onClick={togglePrakriti}
          aria-hidden
        />
      )}

      <div
        className={`fixed top-0 right-0 z-[9999] flex h-screen w-screen md:w-[450px] max-w-full flex-col overflow-hidden border-l border-outline-variant/10 bg-surface shadow-[-20px_0_40px_rgba(0,0,0,0.03)] transition-transform duration-500 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {!loading && (
          <PrakritiChatContent key={chatKey} user={user} isOpen={isOpen} togglePrakriti={togglePrakriti} />
        )}
      </div>
    </>
  );
};

const PrakritiChatContent = ({
  user,
  isOpen,
  togglePrakriti,
}: {
  user: { uid?: string; name?: string; profilePhoto?: string } | null;
  isOpen: boolean;
  togglePrakriti: () => void;
}) => {
  const { initialQuery, setInitialQuery } = usePrakriti();
  const { success, error: toastError } = useToast();
  const { refreshNotifications } = useNotifications();
  const [localInput, setLocalInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidInChat, setPaidInChat] = useState<Set<string>>(() => new Set());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const userDisplayName = user?.name?.trim() || "You";
  const userInitial = userDisplayName.charAt(0).toUpperCase() || "Y";

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 100);
    textareaRef.current.style.height = `${nextHeight}px`;
  }, [localInput]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      const welcomeText = user?.uid
        ? `Namaste ${user.name || "friend"}! I am Prakriti. I can find doctors, book visits, collect the consultation fee right here in chat, and help with your records. What would you like to do?`
        : "Namaste! I am Prakriti. Sign in to let me book appointments and access your HealBook data. I can still answer general health questions.";
      return [{ id: "welcome", role: "assistant", text: welcomeText }];
    });
  }, [isOpen, user?.uid, user?.name]);

  const handleChatPaymentPaid = useCallback(
    (appointmentId: string) => {
      setPaidInChat((prev) => new Set(prev).add(appointmentId));
      void refreshNotifications();
      success("Payment successful. Your appointment is confirmed.");
    },
    [refreshNotifications, success],
  );

  const sendAgent = useCallback(async (text: string) => {
      setError(null);
      setStreaming(true);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
      };
      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", text: "" }]);

      const prior = messagesRef.current.filter((m) => m.id !== "welcome");
      const payloadMessages = [...prior, userMsg].map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        text: m.text,
      }));

      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: payloadMessages,
            userId: user?.uid || "",
          }),
          signal: ac.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || res.statusText);
        }

        const data = (await res.json()) as { text?: string; paymentPrompts?: ChatPaymentPrompt[] };
        const reply = data.text?.trim() || "";
        if (!reply) {
          throw new Error("Empty response from Prakriti. Please try again.");
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: reply, paymentPrompts: data.paymentPrompts }
              : m,
          ),
        );
      } catch (e: unknown) {
        if ((e as Error).name === "AbortError") return;
        
        let errorMessage = e instanceof Error ? e.message : "Something went wrong";
        if (errorMessage.includes("503") || errorMessage.includes("Service Unavailable") || errorMessage.includes("high demand")) {
          errorMessage = "Prakriti is currently busy helping other patients. Please try again in a moment, as this is usually temporary.";
        }
        
        setError(errorMessage);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setStreaming(false);
      }
  }, [user?.uid]);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = (localInput || initialQuery).trim();
    if (!text || streaming) return;

    setLocalInput("");
    if (initialQuery) setInitialQuery("");

    await sendAgent(text);
  };

  const renderInlineFormatting = (text: string) => {
    const segments = text.split(/(\*\*.*?\*\*)/g);
    return segments.map((segment, index) => {
      if (segment.startsWith("**") && segment.endsWith("**")) {
        return (
          <strong key={`${segment}-${index}`} className="font-bold text-on-surface">
            {segment.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={`${segment}-${index}`}>{segment}</React.Fragment>;
    });
  };

  const renderAssistantText = (text: string, keyPrefix: string) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line, index) => {
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={`${keyPrefix}-ordered-${index}`} className="flex gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
            <span className="font-bold text-primary">{line.match(/^\d+\./)?.[0]}</span>
            <p className="text-on-surface-variant">{renderInlineFormatting(line.replace(/^\d+\.\s/, ""))}</p>
          </div>
        );
      }
      if (/^[-*]\s/.test(line)) {
        return (
          <div key={`${keyPrefix}-bullet-${index}`} className="flex gap-3 px-1 py-1">
            <span className="mt-1 text-primary">•</span>
            <p className="text-on-surface-variant">{renderInlineFormatting(line.replace(/^[-*]\s/, ""))}</p>
          </div>
        );
      }
      if (line.endsWith(":") || (line.length < 60 && !line.includes("."))) {
        return (
          <h4 key={`${keyPrefix}-heading-${index}`} className="pt-2 text-sm font-bold tracking-wide text-on-surface">
            {line.replace(/:$/, "")}
          </h4>
        );
      }
      return (
        <p key={`${keyPrefix}-paragraph-${index}`} className="text-on-surface-variant leading-7">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  const renderMessage = (m: ChatMessage) => {
    if (m.role === "user") {
      return (
        <div key={m.id} className="flex items-end justify-end gap-3">
          <div className="max-w-[84%] rounded-[1.5rem] rounded-br-md bg-primary px-4 py-3 text-[13px] leading-7 text-white shadow-sm whitespace-pre-wrap break-words">
            {m.text}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white shadow-sm">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={userDisplayName} className="h-full w-full object-cover" />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={m.id} className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container shadow-sm">
          <img src="/Image-Assets/prakriti.png" alt="Prakriti AI" width={36} height={36} className="h-full w-full object-cover" />
        </div>
        <div className="w-full max-w-[88%] px-1 py-1 break-words">
          <div className="mb-1 text-[11px] font-semibold tracking-wide text-primary/70">Prakriti</div>
          <div className="space-y-3 font-poppins text-[14px]">
            {m.text ? (
              renderAssistantText(m.text, m.id)
            ) : (
              <div className="inline-block rounded-2xl bg-surface-container/60 px-4 py-3">
                <div className="flex justify-center gap-1.5">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>
          {m.paymentPrompts && m.paymentPrompts.length > 0 && (
            <div className="space-y-2">
              {m.paymentPrompts.map((p) => (
                <PrakritiChatPaymentCard
                  key={p.appointmentId}
                  prompt={p}
                  isPaid={paidInChat.has(p.appointmentId)}
                  onPaid={handleChatPaymentPaid}
                  onError={(msg) => toastError(msg)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (initialQuery) setInitialQuery("");
      setLocalInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
  };

  const composerValue = localInput || initialQuery;

  return (
    <div className="flex h-full w-full md:w-[450px] max-w-full flex-col">
      <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest p-4 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center overflow-hidden rounded-xl md:rounded-2xl border border-outline-variant/10 bg-surface-container">
            <img src="/Image-Assets/prakriti.png" alt="Prakriti AI" width={48} height={48} className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-poppins text-lg md:text-xl font-bold text-on-surface">Prakriti AI</h2>
            <p className="text-[11px] font-bold tracking-wider text-primary/70">Personal Ai Assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={togglePrakriti}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container transition-all hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto p-4 md:p-6 slim-scrollbar" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-3">
            {renderMessage(m)}
          </div>
        ))}

        {error && (
          <div className="self-start rounded-2xl border border-error/20 bg-error-container p-4 text-xs font-poppins text-on-error-container">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-outline-variant/10 bg-surface-container-lowest p-4 md:p-6">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-3 md:pb-4 hide-scrollbar snap-x">
          {[
            "I have had a fever since yesterday.",
            "Find the best doctor for chest pain.",
            "What kind of doctor should I see for skin rash?",
            "Suggest affordable doctors for migraine.",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setLocalInput(prompt)}
              className="snap-start whitespace-nowrap rounded-xl border border-outline-variant/5 bg-surface-container-low px-3 md:px-4 py-2 md:py-2.5 text-[11px] font-bold text-on-surface-variant shadow-sm transition-all hover:bg-primary hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            void handleFormSubmit(e);
          }}
          className="flex flex-col"
        >
          <div className="group relative flex items-end gap-1 rounded-[1.25rem] md:rounded-[1.75rem] border border-outline-variant/20 bg-on-surface/[0.04] pl-3 md:pl-4 pr-2 py-2 shadow-sm transition-all focus-within:bg-surface focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/20">
            <textarea
              ref={textareaRef}
              rows={1}
              className="max-h-[100px] min-h-[44px] flex-1 min-w-0 resize-none overflow-y-auto bg-transparent py-2.5 md:py-3 text-[14px] md:text-[15px] leading-relaxed font-medium text-on-surface transition-all placeholder:text-on-surface-variant/40 focus:outline-none"
              value={composerValue}
              onChange={(event) => {
                if (initialQuery) setInitialQuery("");
                setLocalInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleFormSubmit();
                }
              }}
              placeholder="Ask anything"
              disabled={streaming}
            />
            <div className="flex items-center gap-1.5 pb-0.5">
              <button
                type="button"
                onClick={toggleListening}
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant/60 hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-xl">mic</span>
              </button>
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
                disabled={streaming || !composerValue.trim()}
              >
                {streaming ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <span className="material-symbols-outlined text-xl font-bold">arrow_upward</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
