import React, { useCallback, useEffect, useRef } from "react";
import { Button } from "./Button";

/** Vite client env; also supports legacy NEXT_PUBLIC_ at build time if defined in env files. */
function cloudinaryCloudName(): string | undefined {
  return (
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    (import.meta.env as Record<string, string | undefined>)
      .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  );
}

function uploadPreset(): string {
  return (
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    (import.meta.env as Record<string, string | undefined>)
      .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    "healbook_uploads"
  );
}

interface CloudinaryUploadProps {
  onSuccess: (url: string, publicId: string) => void;
  folder?: string;
  label?: string;
  icon?: string;
  className?: string;
}

type UploadWidgetInstance = { open: () => void; destroy: () => void };

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: { event: string; info?: { secure_url: string; public_id: string } }) => void
      ) => UploadWidgetInstance;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCloudinaryScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.cloudinary?.createUploadWidget) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cloudinary-upload-widget="1"]'
    );
    if (existing) {
      if (window.cloudinary?.createUploadWidget) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Cloudinary script failed"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.dataset.cloudinaryUploadWidget = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cloudinary upload widget"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onSuccess,
  folder = "medical_records",
  label = "Upload File",
  icon = "cloud_upload",
  className = "",
}) => {
  const widgetRef = useRef<UploadWidgetInstance | null>(null);

  useEffect(() => {
    return () => {
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, []);

  const openWidget = useCallback(async () => {
    const cloudName = cloudinaryCloudName();
    if (!cloudName) {
      console.error(
        "Missing VITE_CLOUDINARY_CLOUD_NAME (or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) for uploads."
      );
      return;
    }
    await loadCloudinaryScript();
    if (!window.cloudinary?.createUploadWidget) return;

    widgetRef.current?.destroy();

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset: uploadPreset(),
        sources: ["local", "url", "camera", "google_drive", "dropbox"],
        multiple: false,
        folder,
        clientAllowedFormats: ["png", "jpg", "jpeg", "pdf"],
        maxFileSize: 10000000,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#BEC7D1",
            tabIcon: "#006492",
            menuIcons: "#3F4850",
            textDark: "#191C1D",
            textLight: "#FFFFFF",
            link: "#006492",
            action: "#006492",
            inactiveTabIcon: "#BEC7D1",
            error: "#BA1A1A",
            inProgress: "#2D9CDB",
            complete: "#006492",
            sourceBg: "#F2F4F5",
          },
          fonts: {
            default: null,
            "'Poppins', sans-serif": {
              url: "https://fonts.googleapis.com/css?family=Poppins",
              active: true,
            },
          },
        },
        text: {
          en: {
            menu: {
              files: "My Archives",
              camera: "Capture",
              google_drive: "Drive",
              dropbox: "Dropbox",
            },
            local: {
              browse: "Select from Device",
              dd_title_single: "Drag & Drop Medical Record",
              dd_title_multi: "Drag & Drop Documents",
            },
          },
        },
      },
      (_error, result) => {
        if (result?.event === "success" && result.info) {
          onSuccess(result.info.secure_url, result.info.public_id);
        }
      }
    );
    widgetRef.current.open();
  }, [folder, onSuccess]);

  return (
    <Button
      onClick={() => void openWidget()}
      className={`flex items-center gap-2 rounded-2xl ${className}`}
      type="button"
    >
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </Button>
  );
};
