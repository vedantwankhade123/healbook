"use client";

import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { usePrakriti } from "@/context/PrakritiContext";
import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useNotifications } from "@/context/NotificationContext";
import { PrakritiChatPaymentCard, type ChatPaymentPrompt } from "@/components/prakriti/PrakritiChatPaymentCard";
import { PrakritiGeneratedCards, type PrakritiUiCard } from "@/components/prakriti/PrakritiGeneratedCards";
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  paymentPrompts?: ChatPaymentPrompt[];
  uiCards?: PrakritiUiCard[];
};
type AgentReplyResult = {
  assistantId: string;
  text: string;
  paymentPrompts: ChatPaymentPrompt[];
  uiCards: PrakritiUiCard[];
};

type SpeakLanguage = "auto" | "en-IN" | "hi-IN" | "mr-IN" | "ta-IN";
type SpeakVoice = "prakriti" | "ayush";
const AUTO_LISTEN_DELAY_MS = 2300;
const SPEECH_SILENCE_MS = 2400;

const LANG_LABEL: Record<SpeakLanguage, string> = {
  auto: "Auto",
  "en-IN": "English (India)",
  "hi-IN": "Hindi",
  "mr-IN": "Marathi",
  "ta-IN": "Tamil",
};

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [enabled, onOutside, ref]);
}

function Dropdown<T extends string>({
  value,
  onChange,
  options,
  label,
  direction = "down",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  direction?: "up" | "down";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(
    wrapRef,
    () => setOpen(false),
    open,
  );

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={wrapRef} className="relative">
      <div className="text-[11px] font-bold tracking-wider text-on-surface-variant/70 mb-2">{label}</div>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-outline-variant/10 bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label}</span>
        <span className="material-symbols-outlined text-base text-on-surface-variant">expand_more</span>
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-[10000] w-full overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${
            direction === "up" ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs font-bold transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "bg-transparent text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const [mode, setMode] = useState<"text" | "speak">("text");
  const [speakLang, setSpeakLang] = useState<SpeakLanguage>("auto");
  const [speakVoice, setSpeakVoice] = useState<SpeakVoice>("prakriti");
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "speaking" | "processing">("idle");
  const [voiceLoopEnabled, setVoiceLoopEnabled] = useState(false);
  const [levelUser, setLevelUser] = useState(0);
  const [levelAi, setLevelAi] = useState(0);
  const [debugStep, setDebugStep] = useState<string>("");
  const [debugTranscript, setDebugTranscript] = useState<string>("");
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [lastLanguage, setLastLanguage] = useState<string | undefined>(undefined);
  const voiceMenuRef = useRef<HTMLDivElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);
  const typingTargetWordsRef = useRef(0);
  const typingCurrentWordsRef = useRef(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const aiAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [speakError, setSpeakError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const typingRafRef = useRef<number | null>(null);
  const lastDetectedLangRef = useRef<SpeakLanguage>("en-IN");
  const voiceLoopEnabledRef = useRef(false);
  voiceLoopEnabledRef.current = voiceLoopEnabled;

  const userDisplayName = user?.name?.trim() || "You";
  const userInitial = userDisplayName.charAt(0).toUpperCase() || "Y";
  useOutsideClick(voiceMenuRef, () => setVoiceMenuOpen(false), voiceMenuOpen);

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
      let welcomeText = "";
      if (!user?.uid) {
        welcomeText = "Namaste! I am Prakriti. Sign in to let me book appointments and access your HealBook data. I can still answer general health questions.";
      } else if ((user as any).role === "doctor") {
        welcomeText = `Namaste Dr. ${user.name || "Specialist"}! I am Prakriti, your AI clinical assistant. I can help you manage your schedule, look up patient medical history, and help with your clinic records. How can I assist you today?`;
      } else {
        welcomeText = `Namaste ${user.name || "friend"}! I am Prakriti. I can find doctors, book visits, collect the consultation fee right here in chat, and help with your records. What would you like to do?`;
      }
      return [{ id: "welcome", role: "assistant", text: welcomeText }];
    });
  }, [isOpen, user?.uid, user?.name]);

  const stopAllVoice = useCallback(() => {
    setSpeakError(null);
    setVoiceStatus("idle");

    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionRef.current = null;

    try {
      ttsAbortRef.current?.abort();
    } catch {
      // ignore
    }
    ttsAbortRef.current = null;

    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        // ignore
      }
      audioRef.current.src = "";
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    micAnalyserRef.current = null;
    aiAnalyserRef.current = null;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (typingRafRef.current) {
      cancelAnimationFrame(typingRafRef.current);
      typingRafRef.current = null;
    }
    typingTargetWordsRef.current = 0;
    typingCurrentWordsRef.current = 0;

    if (audioCtxRef.current) {
      // Do not close the context (it can race with re-init and cause warnings).
      // Suspending is enough to stop processing; a fresh context can still be
      // created later if the browser closes it.
      void audioCtxRef.current.suspend().catch(() => {});
    }
    setLevelUser(0);
    setLevelAi(0);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    return () => stopAllVoice();
  }, [isOpen, stopAllVoice]);

  // Auto-start listening when entering Speak mode.
  useEffect(() => {
    if (!isOpen) return;
    if (mode !== "speak") return;
    setVoiceLoopEnabled(true);
    voiceLoopEnabledRef.current = true;
    stopAllVoice();
    void runSpeakTurn({ skipDelay: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isOpen]);

  const handleChatPaymentPaid = useCallback(
    (appointmentId: string) => {
      setPaidInChat((prev) => new Set(prev).add(appointmentId));
      void refreshNotifications();
      success("Payment successful. Your appointment is confirmed.");
    },
    [refreshNotifications, success],
  );

  const setAssistantMessage = useCallback(
    (
      assistantId: string,
      updater: (m: ChatMessage) => ChatMessage,
    ) => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? updater(m) : m)));
    },
    [],
  );

  const sendAgent = useCallback(async (text: string, opts?: { deferAssistantRender?: boolean; requestedLanguage?: string }): Promise<AgentReplyResult | undefined> => {
      setError(null);
      setStreaming(true);
      setLastMessage(text);
      setLastLanguage(opts?.requestedLanguage);
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
            language: opts?.requestedLanguage,
          }),
          signal: ac.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || res.statusText);
        }

        const data = (await res.json()) as { text?: string; paymentPrompts?: ChatPaymentPrompt[]; uiCards?: PrakritiUiCard[] };
        const reply = data.text?.trim() || "";
        if (!reply) {
          throw new Error("Empty response from Prakriti. Please try again.");
        }
        const prompts = data.paymentPrompts || [];
        const uiCards = data.uiCards || [];
        if (!opts?.deferAssistantRender) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, text: reply, paymentPrompts: prompts, uiCards }
                : m,
            ),
          );
        }
        return { assistantId, text: reply, paymentPrompts: prompts, uiCards };
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
          {m.uiCards && m.uiCards.length > 0 && <PrakritiGeneratedCards cards={m.uiCards} />}
        </div>
      </div>
    );
  };

  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "closed") {
        audioCtxRef.current = null;
      } else {
        return audioCtxRef.current;
      }
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    audioCtxRef.current = new Ctx();
    return audioCtxRef.current;
  }, []);

  const startMeters = useCallback(async () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    // mic level (user)
    if (!micStreamRef.current) {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    const micSource = ctx.createMediaStreamSource(micStreamRef.current);
    const micAnalyser = ctx.createAnalyser();
    micAnalyser.fftSize = 512;
    micSource.connect(micAnalyser);
    micAnalyserRef.current = micAnalyser;

    // ai level (assistant audio)
    if (audioRef.current) {
      const aiAnalyser = ctx.createAnalyser();
      aiAnalyser.fftSize = 512;
      try {
        const node = ctx.createMediaElementSource(audioRef.current);
        node.connect(aiAnalyser);
        aiAnalyser.connect(ctx.destination);
        aiAnalyserRef.current = aiAnalyser;
      } catch {
        // MediaElementSource can only be created once per element; ignore
      }
    }

    const buf = new Uint8Array(256);
    const tick = () => {
      const micA = micAnalyserRef.current;
      const aiA = aiAnalyserRef.current;

      if (micA) {
        micA.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        setLevelUser(Math.min(1, Math.sqrt(sum / buf.length) * 3.5));
      }

      if (aiA) {
        aiA.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        setLevelAi(Math.min(1, Math.sqrt(sum / buf.length) * 3.5));
      } else {
        setLevelAi(0);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [ensureAudioContext]);

  const getSpeechRecognitionCtor = () =>
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;

  const looksLikeMarathi = (text: string) => {
    const t = (text || "").toLowerCase();
    // Marathi-specific hints in Devanagari and common latin transliteration.
    if (/[ळ]/.test(t)) return true;
    const mrDevanagariHints = ["मला", "आहे", "तुम्ही", "काय", "पाहिजे", "मध्ये", "आणि", "साठी"];
    const mrLatinHints = ["mala", "aahe", "ahe", "tumhi", "pahije", "sathi", "aani", "madhe"];
    return mrDevanagariHints.some((w) => t.includes(w)) || mrLatinHints.some((w) => t.includes(w));
  };

  const detectLangFromText = (text: string): SpeakLanguage => {
    const t = text || "";
    if (/[\u0B80-\u0BFF]/.test(t)) return "ta-IN"; // Tamil block
    if (/[\u0900-\u097F]/.test(t)) {
      return looksLikeMarathi(t) ? "mr-IN" : "hi-IN";
    }
    if (looksLikeMarathi(t)) return "mr-IN";
    return "en-IN";
  };

  const toSpeechFriendlyText = (raw: string, paymentPrompts?: ChatPaymentPrompt[]) => {
    let text = raw
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/\s+/g, " ")
      .replace(/\bAppointment\s*\d+\s*:/gi, "")
      .replace(/[-*]\s+/g, "")
      .replace(/\d+\.\s+/g, "")
      .replace(/·/g, ", ")
      .trim();

    // Keep full context but normalize "UI-ish" artifacts into natural speech.
    const normalized = text
      .replace(/\bPay now\b/gi, "pay now")
      .replace(/\bINR\s*/gi, "rupees ")
      .replace(/₹\s*/g, "rupees ")
      .replace(/\bDr\.\s*/g, "Doctor ")
      .trim();

    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Use a fuller spoken response (first 4 sentences max), not just a tiny summary.
    let spoken = sentences.slice(0, 4).join(" ");
    if (!spoken) spoken = normalized;

    // Keep TTS practical for realtime while preserving context.
    if (spoken.length > 520) {
      spoken = `${spoken.slice(0, 517).trim()}...`;
    }

    if (paymentPrompts && paymentPrompts.length > 0) {
      const p = paymentPrompts[0];
      spoken += ` You have an appointment with ${p.doctorName} on ${p.date} at ${p.time}. Tap Pay now to confirm it.`;
    }

    return spoken;
  };

  const speakWithFallback = useCallback(
    async (
      text: string,
      opts?: {
        forcedLang?: SpeakLanguage;
        onProgress?: (ratio: number) => void;
      },
    ): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      setSpeakError(null);
      setVoiceStatus("speaking");

      const chosenLang: SpeakLanguage = opts?.forcedLang
        ? opts.forcedLang
        : speakLang === "auto"
          ? detectLangFromText(trimmed)
          : speakLang;

      // Try server Gemini TTS first (returns base64 audio).
      const ac = new AbortController();
      ttsAbortRef.current?.abort();
      ttsAbortRef.current = ac;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            languageCode: chosenLang === "auto" ? undefined : chosenLang,
            // Map product names -> Gemini prebuilt voice names (best-effort)
            // Requested Indian-friendly voices (one male/one female)
            // Female: Kore (shown as Prakriti), Male: Puck (shown as Ayush)
            voiceName: speakVoice === "ayush" ? "Puck" : "Kore",
          }),
          signal: ac.signal,
        });

        if (res.ok) {
          const data = (await res.json()) as { audioBase64: string; mimeType?: string };
          const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
          const blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
          const url = URL.createObjectURL(blob);

          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          const a = audioRef.current;
          a.src = url;

          const ctx = ensureAudioContext();
          if (ctx && ctx.state === "suspended") await ctx.resume().catch(() => {});
          await startMeters();

          let syncRaf: number | null = null;
          await new Promise<void>((resolve, reject) => {
            const onEnd = () => resolve();
            const onErr = () => reject(new Error("Audio playback failed"));
            a.onended = onEnd;
            a.onerror = onErr;
            a.ontimeupdate = () => {
              const d = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : 0;
              if (d > 0 && opts?.onProgress) opts.onProgress(Math.min(1, a.currentTime / d));
            };
            a.onloadedmetadata = () => {
              if (!opts?.onProgress) return;
              const tick = () => {
                const d = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : 0;
                if (d > 0) opts.onProgress(Math.min(1, a.currentTime / d));
                syncRaf = requestAnimationFrame(tick);
              };
              syncRaf = requestAnimationFrame(tick);
            };
            void a.play().catch(onErr);
          });
          if (syncRaf) cancelAnimationFrame(syncRaf);
          if (opts?.onProgress) opts.onProgress(1);

          URL.revokeObjectURL(url);
          return true;
        }
        const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        const serverMsg = err.error || err.message || "";

        // Map server errors to user-friendly messages.
        let friendlyMsg: string;
        if (res.status === 429 || /rate.?limit|quota|too many/i.test(serverMsg)) {
          friendlyMsg = "Prakriti's voice is experiencing high demand. Please try again in a moment.";
        } else if (res.status === 501 || res.status === 404) {
          friendlyMsg = "Voice feature is currently unavailable. Please try again later.";
        } else if (res.status >= 500) {
          friendlyMsg = "Prakriti's voice service hit a temporary issue. Please try again.";
        } else {
          friendlyMsg = "Could not generate voice response. Please try again.";
        }

        setSpeakError(friendlyMsg);
        setVoiceStatus("idle");
        return false;
      } catch (e) {
        if ((e as Error).name === "AbortError") return false;

        const raw = e instanceof Error ? e.message : "";
        let friendlyMsg: string;
        if (/fetch|network|failed to fetch|ERR_CONNECTION/i.test(raw)) {
          friendlyMsg = "Could not connect to voice service. Please check your connection and try again.";
        } else if (/timeout|timed out/i.test(raw)) {
          friendlyMsg = "Voice service took too long to respond. Please try again.";
        } else if (/Audio playback/i.test(raw)) {
          friendlyMsg = "Audio playback failed. Please try again.";
        } else {
          friendlyMsg = "Something went wrong with voice. Please try again.";
        }

        setSpeakError(friendlyMsg);
        setVoiceStatus("idle");
        return false;
      }
    },
    [ensureAudioContext, speakLang, speakVoice, startMeters],
  );

  const startListeningOnce = useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSpeakError("Voice input is not supported in this browser.");
      setVoiceStatus("idle");
      return null;
    }

    const ctx = ensureAudioContext();
    if (ctx && ctx.state === "suspended") await ctx.resume().catch(() => {});
    await startMeters().catch(() => {});

    setVoiceStatus("listening");
    setSpeakError(null);

    const listenOne = async (lang: SpeakLanguage, reportError: boolean) => {
      const rec = new Ctor();
      recognitionRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = lang;

      return await new Promise<string>((resolve) => {
        let finalText = "";
        let ended = false;
        let silenceTimer: number | null = null;
        let hardTimer: number | null = null;

        const clearTimers = () => {
          if (silenceTimer) {
            window.clearTimeout(silenceTimer);
            silenceTimer = null;
          }
          if (hardTimer) {
            window.clearTimeout(hardTimer);
            hardTimer = null;
          }
        };

        const finish = () => {
          if (ended) return;
          ended = true;
          clearTimers();
          try {
            rec.stop();
          } catch {
            // ignore
          }
          resolve(finalText.trim());
        };

        const armSilenceTimer = () => {
          if (silenceTimer) window.clearTimeout(silenceTimer);
          silenceTimer = window.setTimeout(() => finish(), SPEECH_SILENCE_MS);
        };

        hardTimer = window.setTimeout(() => finish(), 20000);

        rec.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i];
            const part = r?.[0]?.transcript || "";
            if (!part) continue;
            if (r.isFinal) {
              finalText = `${finalText} ${part}`.trim();
            } else {
              interim = `${interim} ${part}`.trim();
            }
          }
          if (!finalText && interim) {
            finalText = interim;
          }
          armSilenceTimer();
        };
        rec.onerror = (e: any) => {
          const err = String(e?.error || "");
          if (err === "not-allowed" || err === "permission-denied") {
            setSpeakError("Microphone access denied. Please enable it in your browser settings.");
            ended = true;
            resolve("ERROR_PERMISSION_DENIED");
            return;
          }
          if (reportError) {
            const msg = e?.error ? `Mic error: ${String(e.error)}` : "Mic error";
            setSpeakError(msg);
          }
          finish();
        };
        rec.onend = () => {
          if (ended) return;
          if (finalText.trim()) {
            finish();
          } else {
            armSilenceTimer();
          }
        };
        try {
          rec.start();
          armSilenceTimer();
        } catch {
          finish();
        }
      });
    };

    let transcript = "";
    if (speakLang !== "auto") {
      transcript = await listenOne(speakLang, true);
    } else {
      // Auto mode: try likely languages in priority order.
      const tried = new Set<SpeakLanguage>();
      const preferred: SpeakLanguage[] = [
        lastDetectedLangRef.current,
        "mr-IN",
        "hi-IN",
        "en-IN",
        "ta-IN",
      ];
      for (const lang of preferred) {
        if (tried.has(lang)) continue;
        tried.add(lang);
        const out = (await listenOne(lang, false)).trim();
        if (out === "ERROR_PERMISSION_DENIED") break;
        if (out.length >= 2) {
          transcript = out;
          lastDetectedLangRef.current = detectLangFromText(out);
          break;
        }
      }
      if (!transcript) {
        // Final visible error only after all attempts fail.
        setSpeakError("Could not detect speech. Try again and speak a little slower.");
      }
    }

    recognitionRef.current = null;
    return transcript.trim();
  }, [ensureAudioContext, speakLang, startMeters]);

  const runSpeakTurn = useCallback(async (opts?: { skipDelay?: boolean; overriddenText?: string }) => {
    if (!voiceLoopEnabledRef.current && !opts?.overriddenText) {
      setVoiceStatus("idle");
      return;
    }
    if (streaming) return;
    setSpeakError(null);

    if (!opts?.skipDelay) {
      setDebugStep("Getting ready to listen…");
      await new Promise((r) => setTimeout(r, AUTO_LISTEN_DELAY_MS));
      if (!voiceLoopEnabledRef.current) {
        setVoiceStatus("idle");
        return;
      }
    }

    setDebugStep("Listening…");
    const userText = opts?.overriddenText || (await startListeningOnce());

    if (!voiceLoopEnabledRef.current && !opts?.overriddenText) {
      setVoiceStatus("idle");
      return;
    }
    if (!userText) {
      setDebugStep("No speech detected (try again).");
      setVoiceStatus("idle");
      return;
    }
    setDebugTranscript(userText);

    setVoiceStatus("processing");
    setDebugStep("Understanding your request…");
    await new Promise((r) => setTimeout(r, 120));
    setDebugStep("Querying database and tools…");

    // If language is Auto, detect it from the user's voice input.
    const requestedLang = speakLang === "auto" ? detectLangFromText(userText) : speakLang;

    const result = await sendAgent(userText, { 
      deferAssistantRender: true,
      requestedLanguage: requestedLang 
    });
    if (!voiceLoopEnabledRef.current) {
      setVoiceStatus("idle");
      return;
    }
    if (!result?.text) {
      setDebugStep("No reply from /api/chat.");
      setVoiceStatus("idle");
      return;
    }

    // Start with empty assistant bubble and type while speaking.
    setAssistantMessage(result.assistantId, (m) => ({ ...m, text: "", paymentPrompts: [], uiCards: [] }));

    // Use the same language for the voice response.
    const forced = requestedLang;
    setDebugStep("Preparing voice response…");
    const spokenText = toSpeechFriendlyText(result.text, result.paymentPrompts);
    const totalChars = spokenText.length;
    setDebugStep("Speaking and typing response…");
    // Refs repurposed for character-level tracking (smooth typing).
    typingCurrentWordsRef.current = 0;
    typingTargetWordsRef.current = 0;
    if (typingRafRef.current) {
      cancelAnimationFrame(typingRafRef.current);
      typingRafRef.current = null;
    }

    const pumpTyping = () => {
      const target = typingTargetWordsRef.current;
      const current = typingCurrentWordsRef.current;
      if (current < target) {
        // Smooth character reveal: advance several chars per frame for catch-up.
        const gap = target - current;
        const step = Math.min(12, Math.max(1, Math.ceil(gap / 4)));
        typingCurrentWordsRef.current = Math.min(target, current + step);
        const partial = spokenText.slice(0, typingCurrentWordsRef.current);
        setAssistantMessage(result.assistantId, (m) => ({ ...m, text: partial }));
      }
      if (typingCurrentWordsRef.current < totalChars) {
        typingRafRef.current = requestAnimationFrame(pumpTyping);
      } else {
        typingRafRef.current = null;
      }
    };

    typingRafRef.current = requestAnimationFrame(pumpTyping);
    const spoke = await speakWithFallback(spokenText, {
      forcedLang: forced,
      onProgress: (ratio) => {
        // Keep target char index in sync with speech progress.
        typingTargetWordsRef.current = Math.min(
          totalChars,
          Math.max(1, Math.floor(totalChars * ratio)),
        );
      },
    });
    // Instantly reveal any remaining text.
    typingTargetWordsRef.current = totalChars;
    if (!typingRafRef.current) {
      typingRafRef.current = requestAnimationFrame(pumpTyping);
    }
    if (!voiceLoopEnabledRef.current) {
      setVoiceStatus("idle");
      return;
    }
    // After synced speech finishes, replace with full rich response.
    setAssistantMessage(result.assistantId, (m) => ({
      ...m,
      text: result.text,
      paymentPrompts: result.paymentPrompts,
      uiCards: result.uiCards,
    }));

    // If TTS failed, stop the loop so the user can see the error and retry.
    if (!spoke) {
      setDebugStep("Voice unavailable — text shown above.");
      setVoiceStatus("idle");
      return;
    }

    setDebugStep("Done.");

    // Auto-continue conversation (hands free) if still in speak mode.
    if (mode === "speak" && voiceLoopEnabledRef.current) {
      void runSpeakTurn();
    } else {
      setVoiceStatus("idle");
    }
  }, [mode, sendAgent, setAssistantMessage, speakWithFallback, startListeningOnce, streaming]);

  const toggleMicLoop = useCallback(() => {
    const isActive =
      voiceLoopEnabledRef.current ||
      voiceStatus === "listening" ||
      voiceStatus === "processing" ||
      voiceStatus === "speaking";

    if (isActive) {
      setVoiceLoopEnabled(false);
      stopAllVoice();
      setDebugStep("Mic stopped.");
      return;
    }

    setVoiceLoopEnabled(true);
    voiceLoopEnabledRef.current = true;
    stopAllVoice();
    setDebugStep("Starting mic…");
    void runSpeakTurn({ skipDelay: true });
  }, [runSpeakTurn, stopAllVoice, voiceStatus]);

  const toggleListening = () => {
    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
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
      <style>{`
        @keyframes prakritiMicEq {
          0%, 100% { transform: scaleY(0.35); opacity: 0.75; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
      <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest px-4 py-3 md:px-5 md:py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container">
            <img src="/Image-Assets/prakriti.png" alt="Prakriti AI" width={40} height={40} className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-poppins text-lg font-bold leading-tight text-on-surface">Prakriti AI</h2>
            <p className="text-[11px] font-bold tracking-wider text-primary/70">Personal Ai Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "speak" && (
            <div ref={voiceMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setVoiceMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container transition-all hover:bg-surface-container-high"
                aria-label="Voice options"
                title="Voice options"
              >
                <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
              </button>
              {voiceMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-[10001] w-40 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                  {[
                    { value: "prakriti" as const, label: "Prakriti (Female)" },
                    { value: "ayush" as const, label: "Ayush (Male)" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSpeakVoice(opt.value);
                        setVoiceMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold ${
                        speakVoice === opt.value
                          ? "bg-primary text-white"
                          : "text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={togglePrakriti}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container transition-all hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto p-4 md:p-6 slim-scrollbar" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-3">
            {renderMessage(m)}
          </div>
        ))}

        {(speakError || error) && (
          <div className="flex flex-col gap-2 self-start max-w-[90%]">
            <div className="rounded-2xl border border-error/20 bg-error-container p-4 text-xs font-poppins text-on-error-container shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-lg mt-0.5">error</span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Response Error</p>
                  <p className="opacity-80 leading-relaxed">{speakError || error}</p>
                </div>
              </div>
            </div>
            {lastMessage && (
              <button
                onClick={() => {
                  setError(null);
                  setSpeakError(null);
                  if (mode === "speak") {
                    void runSpeakTurn({ skipDelay: true, overriddenText: lastMessage });
                  } else {
                    void sendAgent(lastMessage, { requestedLanguage: lastLanguage });
                  }
                }}
                disabled={streaming}
                className="flex items-center gap-2 self-start rounded-xl bg-surface-container-high px-4 py-2 text-[11px] font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-white active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Retry sending message
              </button>
            )}
          </div>
        )}

        {mode === "speak" && (
          <div className="text-[11px] font-semibold text-on-surface-variant/70">
            {debugStep}
            {debugTranscript ? ` — "${debugTranscript}"` : ""}
          </div>
        )}
      </div>

      <div className="border-t border-outline-variant/10 bg-surface-container-lowest p-4 md:p-6">
        {mode === "speak" && (
          <div className="mb-3 w-full md:w-[200px]">
            <button
              type="button"
              onClick={() => {
                setVoiceLoopEnabled(false);
                stopAllVoice();
                setMode((m) => (m === "text" ? "speak" : "text"));
              }}
              className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                mode === "speak"
                  ? "bg-primary text-white border-primary/20"
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">chat</span>
              Chat mode
            </button>
          </div>
        )}

        <div className="flex flex-row items-center justify-between gap-2">
          {mode === "speak" ? (
            <div className="flex-1 min-w-0 max-w-[140px] md:max-w-[200px]">
              <Dropdown<SpeakLanguage>
                label="Language"
                value={speakLang}
                onChange={setSpeakLang}
                direction="up"
                options={(Object.entries(LANG_LABEL) as [SpeakLanguage, string][]).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setVoiceLoopEnabled(true);
                stopAllVoice();
                setMode("speak");
              }}
              className="w-full md:w-auto flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-base">graphic_eq</span>
              Speak mode
            </button>
          )}

          {mode === "speak" && (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={toggleMicLoop}
                className={`flex h-10 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/10 hover:bg-primary-hover active:scale-[0.99] ${
                  voiceStatus === "listening" ? "px-3 gap-2" : "w-10"
                }`}
                aria-label="Start listening"
                title={
                  voiceLoopEnabled || voiceStatus === "listening" || voiceStatus === "processing" || voiceStatus === "speaking"
                    ? "Stop listening"
                    : "Start listening"
                }
              >
                {voiceStatus === "listening" && (
                  <div
                    className="flex items-end gap-[3px] h-5"
                    aria-hidden
                  >
                    {Array.from({ length: 7 }).map((_, i) => {
                      const base = 6 + (i % 4);
                      const boost = Math.round((levelUser || 0) * 12);
                      const h = Math.min(18, base + boost);
                      return (
                        <div
                          key={i}
                          className="w-[3px] rounded-full bg-white origin-bottom"
                          style={{
                            height: `${h}px`,
                            animation: "prakritiMicEq 780ms ease-in-out infinite",
                            animationDelay: `${i * 90}ms`,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceLoopEnabled(false);
                  stopAllVoice();
                  setDebugStep("Mic stopped.");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-outline-variant/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                aria-label="Stop"
                title="Stop"
              >
                <span className="material-symbols-outlined">stop</span>
              </button>
            </div>
          )}
        </div>

        {mode === "text" && (
          <>
            <div className="mt-3 mb-2 flex gap-2 overflow-x-auto pb-3 md:pb-4 hide-scrollbar snap-x">
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
          </>
        )}
      </div>
    </div>
  );
};
