import React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "flat" | "outline" | "glass";
  className?: string;
  onClick?: () => void;
}

export const Card = ({
  children,
  variant = "elevated",
  className = "",
  onClick,
}: CardProps) => {
  const variants = {
    elevated: `${className.includes('bg-') ? '' : 'bg-surface-container-lowest'} shadow-ambient border border-outline-variant/10`,
    flat: `${className.includes('bg-') ? '' : 'bg-surface-container-low'}`,
    outline: `${className.includes('bg-') ? '' : 'bg-surface-container-lowest'} border border-outline-variant/30`,
    glass: "bg-surface/80 backdrop-blur-xl border border-primary/10 shadow-ambient",
  };

  return (
    <div
      className={`rounded-xl transition-all ${variants[variant]} ${
        !className.includes('p-') ? 'p-6' : ''
      } ${
        onClick ? "cursor-pointer active:scale-[0.99] hover:border-primary-container/50" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
