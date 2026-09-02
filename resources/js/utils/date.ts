export function formatShortDate(value?: string | null): string {
    if (!value) return '-';

    const [datePart] = value.split(/[ T]/);
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return value;

    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatShortDateTime(value?: string | null): string {
    if (!value) return '-';

    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && (value.includes('T') || value.endsWith('Z'))) {
        return date.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const [datePart, timePart = ''] = value.replace('T', ' ').split(' ');
    const formattedDate = formatShortDate(datePart);
    const [hour, minute] = timePart.split(':');

    return `${formattedDate}${hour && minute ? ` ${hour}:${minute}` : ''}`;
}
