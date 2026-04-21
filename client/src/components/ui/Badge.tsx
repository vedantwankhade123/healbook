import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "error" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export const Badge = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) => {
  const variants = {
    primary: "bg-primary-fixed text-on-primary-fixed-variant",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary-container text-on-tertiary-container",
    error: "bg-error-container text-on-error-container",
    neutral: "bg-surface-container-high text-on-surface-variant",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center font-bold tracking-wider 
        rounded-full ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </span>
  );
};
