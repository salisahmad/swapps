import { ImgHTMLAttributes } from 'react';

type LogoVariant = 'horizontal' | 'vertical' | 'mark';

type ApplicationLogoProps = ImgHTMLAttributes<HTMLImageElement> & {
    variant?: LogoVariant;
};

const logoSources: Record<LogoVariant, string> = {
    horizontal: '/brand/shofi-logo-horizontal.webp',
    vertical: '/brand/shofi-logo-vertical.webp',
    mark: '/brand/shofi-mark-192.png',
};

export default function ApplicationLogo({
    variant = 'horizontal',
    alt = 'Shofi Wedding',
    loading = 'eager',
    decoding = 'async',
    src,
    ...props
}: ApplicationLogoProps) {
    return (
        <img
            {...props}
            src={src || logoSources[variant]}
            alt={alt}
            loading={loading}
            decoding={decoding}
        />
    );
}
