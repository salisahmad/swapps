import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-stone-300 text-rose-500 shadow-sm focus:ring-rose-400 dark:border-stone-700 dark:bg-stone-900 dark:focus:ring-rose-500 dark:focus:ring-offset-stone-900 ' +
                className
            }
        />
    );
}
