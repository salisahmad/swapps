import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-md border border-stone-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-stone-700 shadow-sm transition duration-150 ease-in-out hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:opacity-25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:focus:ring-offset-stone-900 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
