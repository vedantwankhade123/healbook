"use client";

import React, { createContext, useContext, useState } from "react";

interface PrakritiContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  togglePrakriti: () => void;
  initialQuery: string;
  setInitialQuery: (query: string) => void;
  chatWithPrakriti: (query?: string) => void;
}

const PrakritiContext = createContext<PrakritiContextType | undefined>(undefined);

export const PrakritiProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const togglePrakriti = () => setIsOpen((prev) => !prev);

  const chatWithPrakriti = (query: string = "") => {
    setInitialQuery(query);
    setIsOpen(true);
  };

  return (
    <PrakritiContext.Provider value={{ isOpen, setIsOpen, togglePrakriti, initialQuery, setInitialQuery, chatWithPrakriti }}>
      {children}
    </PrakritiContext.Provider>
  );
};

export const usePrakriti = () => {
  const context = useContext(PrakritiContext);
  if (context === undefined) {
    throw new Error("usePrakriti must be used within a PrakritiProvider");
  }
  return context;
};
