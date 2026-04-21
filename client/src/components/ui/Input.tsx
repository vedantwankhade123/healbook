import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const Input = ({
  label,
  error,
  icon,
  className = "",
  type,
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative w-full group">
      {label && (
        <label className={`
          absolute left-3 -top-2 px-1 text-[11px] font-bold z-10 
          transition-all duration-200 pointer-events-none
          ${error ? "text-error" : "text-slate-700 group-focus-within:text-primary"}
          bg-white
        `}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={isPassword && showPassword ? "text" : type}
          className={`
            w-full md:h-12 h-11 px-4 ${icon ? "pl-12" : ""} ${isPassword ? "pr-12" : ""}
            bg-slate-50 border border-outline-variant/30
            rounded-xl focus:border-primary outline-none 
            transition-all duration-200 text-on-surface 
            placeholder:text-outline-variant/50
            focus:ring-4 focus:ring-primary/5
            ${error ? "border-error focus:border-error focus:ring-error/5" : ""}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-error ml-1 mt-1">{error}</p>}
    </div>
  );
};

export const TextArea = ({
  label,
  error,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-on-surface-variant ml-1">
          {label}
        </label>
      )}
      <textarea
        className={`
            w-full bg-surface-container-low border border-outline-variant/10 shadow-inner
            rounded-xl p-4 focus:border-primary-container outline-none 
            transition-all duration-200 text-on-surface 
            placeholder:text-outline-variant
            focus:ring-4 focus:ring-primary/10
            ${error ? "border-error focus:border-error focus:ring-error/10" : ""}
            ${className}
          `}
        {...props}
      />
      {error && <p className="text-xs font-medium text-error ml-1">{error}</p>}
    </div>
  );
};
