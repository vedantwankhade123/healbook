"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const TRACKER_KEY = "healbook_location_tracker";
const GRANTED_KEY = "healbook_location_granted";
const LOCATION_DATA = "healbook_location_data";

export function LocationPromptManager() {
  const { user, loading } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only run on client, wait until auth is resolved
    if (loading || !user || user.role !== "patient") return;

    // Wait a brief moment after login/mount before showing modal
    const timer = setTimeout(() => {
      const isGranted = localStorage.getItem(GRANTED_KEY) === "true";
      if (isGranted) return;

      const todayStr = new Date().toISOString().split("T")[0];
      let trackerRaw = localStorage.getItem(TRACKER_KEY);
      let tracker = trackerRaw ? JSON.parse(trackerRaw) : null;

      // If it's a new day or no tracker exists
      if (!tracker || tracker.date !== todayStr) {
        tracker = {
          date: todayStr,
          promptCount: 0,
          maxPrompts: Math.random() < 0.5 ? 1 : 2, // 1 to 2 times randomly
        };
      }

      if (tracker.promptCount < tracker.maxPrompts) {
        setShowPrompt(true);
      } else {
        setShowPrompt(false);
      }

      // Save updated tracker state (we don't increment count until they act)
      localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, loading]);

  const handleSkip = () => {
    // Increment the count for today
    let tracker = JSON.parse(localStorage.getItem(TRACKER_KEY) || "{}");
    tracker.promptCount = (tracker.promptCount || 0) + 1;
    localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
    setShowPrompt(false);
  };

  const handleEnable = () => {
    setIsRequesting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      handleSkip();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success
        const { latitude, longitude } = position.coords;
        localStorage.setItem(GRANTED_KEY, "true");
        localStorage.setItem(LOCATION_DATA, JSON.stringify({ lat: latitude, lng: longitude }));
        setIsRequesting(false);
        setShowPrompt(false);
      },
      (error) => {
        // User denied from native prompt or error occurred
        console.error("Location error:", error);
        setIsRequesting(false);
        handleSkip(); // Treat as skip for now so it asks again later
      }
    );
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={handleSkip}></div>
      <Card className="relative z-10 w-full max-w-md p-8 shadow-2xl flex flex-col items-center text-center space-y-6 bg-surface animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-4xl">my_location</span>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-2xl font-bold font-poppins text-on-surface tracking-tight">Enable Location Access</h2>
            <p className="text-sm font-poppins text-on-surface-variant leading-relaxed px-2">
                We use your location to match you with the best nearby specialists and provide accurate, real-time driving directions from your location to clinics.
            </p>
        </div>

        <div className="w-full space-y-3 pt-4">
            <Button 
                onClick={handleEnable} 
                className="w-full rounded-xl py-6 font-poppins font-bold text-base shadow-lg shadow-primary/20"
                isLoading={isRequesting}
            >
                Enable Location
            </Button>
            <Button 
                variant="outline" 
                onClick={handleSkip} 
                className="w-full rounded-xl py-6 font-poppins font-bold text-base border-transparent bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all"
                disabled={isRequesting}
            >
                Skip for Now
            </Button>
        </div>
      </Card>
    </div>
  );
}
