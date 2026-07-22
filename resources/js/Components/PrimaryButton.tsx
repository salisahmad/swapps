import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-md border border-transparent bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-rose-600 focus:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 active:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400 dark:focus:bg-rose-400 dark:focus:ring-offset-stone-900 dark:active:bg-rose-600 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
