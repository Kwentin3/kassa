import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--brand-primary)] text-white shadow-lg shadow-black/10 active:scale-[0.99]',
    secondary: 'bg-white text-slate-900 border border-slate-200 shadow-sm active:scale-[0.99]',
    ghost: 'bg-transparent text-slate-800 border border-transparent hover:bg-black/5',
    danger: 'bg-red-600 text-white shadow-lg shadow-red-900/10 active:scale-[0.99]'
  };
  return (
    <button
      className={`touch-button inline-flex items-center justify-center gap-3 px-6 text-[20px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`min-h-[64px] rounded-lg border border-slate-300 bg-white px-5 text-[24px] font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 ${className}`}
    {...props}
  />
));

TextInput.displayName = 'TextInput';

export const Screen = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <main className={`h-screen w-screen overflow-hidden bg-[var(--brand-bg)] text-slate-900 ${className}`}>{children}</main>
);

export const ProductVisual = ({ tone, label }: { tone: string; label: string }) => (
  <div className={`product-art flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-black/5 ${tone}`}>
    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/80 text-[28px] font-black text-slate-800 shadow-sm">
      {label.slice(0, 2).toLocaleUpperCase('ru-RU')}
    </div>
  </div>
);

export const StatusPill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex min-h-9 items-center rounded-lg bg-slate-100 px-3 text-[16px] font-semibold text-slate-700">{children}</span>
);
