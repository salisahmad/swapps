import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-[#faf9f7] pt-6 text-stone-800 dark:bg-stone-950 dark:text-stone-100 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo
                        variant="vertical"
                        className="h-24 w-auto object-contain"
                    />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden border border-stone-100 bg-white px-6 py-4 shadow-md dark:border-stone-800 dark:bg-stone-900 dark:shadow-none sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
