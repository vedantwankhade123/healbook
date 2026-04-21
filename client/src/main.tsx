import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { LocationPromptManager } from "./components/ui/LocationPromptManager";
import { PrakritiProvider } from "./context/PrakritiContext";
import { PrakritiSidebar } from "./components/prakriti/PrakritiSidebar";
import { NotificationProvider } from "./context/NotificationContext";
import App from "./App";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <PrakritiProvider>
            <ToastProvider>
              <NotificationProvider>
                <div className="flex flex-row min-h-screen bg-surface">
                  <main className="flex-1 w-full flex flex-col min-w-0">
                    <App />
                  </main>
                  <PrakritiSidebar />
                </div>
                <LocationPromptManager />
              </NotificationProvider>
            </ToastProvider>
          </PrakritiProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
