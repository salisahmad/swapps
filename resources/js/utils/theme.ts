import { useEffect } from 'react';

function prefersDarkTheme(): boolean {
    const storedTheme = localStorage.getItem('theme');

    return storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Public pages stay light while preserving the dashboard's theme preference. */
export function useLightTheme(): void {
    useEffect(() => {
        document.documentElement.classList.remove('dark');

        return () => {
            document.documentElement.classList.toggle('dark', prefersDarkTheme());
        };
    }, []);
}
