import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-md border-stone-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-rose-400 dark:focus:ring-rose-500/40 ' +
                className
            }
            ref={localRef}
        />
    );
});
