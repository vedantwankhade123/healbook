import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "error";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-headline font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-linear-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:shadow-primary/40",
    secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80",
    outline: "border border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
    ghost: "bg-transparent text-on-surface hover:bg-surface-container-low",
    error: "bg-error text-white hover:bg-error/90",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs rounded-md",
    md: "px-6 py-2.5 text-sm rounded-lg",
    lg: "px-8 py-4 text-base rounded-xl",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 mr-3 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
