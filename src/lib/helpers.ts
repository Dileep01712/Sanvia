import { Song } from "@/lib/songTypes";

export const extractArtistsFromSong = (song: Song): string[] => {
    return song.artists?.primary?.map(artist => artist.name) ?? [];
};

export function decodeHTMLEntities(text: string): string {
    const txt = document.createElement("textarea");
    txt.innerHTML = text;
    return txt.value;
}

export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export interface QualityObject {
    quality: string;
    url: string;
}

export function getBestQualityImage(image: string | QualityObject[] | undefined): string {
    if (!image) return '';

    if (typeof image === 'string') return image;

    if (Array.isArray(image)) {
        const img500 = image.find((img) => img.quality === '500x500');
        return img500?.url || image[0]?.url || '';
    }

    return '';
}

export function getBestQualityDownload(downloadUrl: string | QualityObject[] | undefined): string {
    if (!downloadUrl) return '';

    if (typeof downloadUrl === 'string') return downloadUrl;

    if (Array.isArray(downloadUrl)) {
        const url320 = downloadUrl.find((q) => q.quality === '320kbps');
        return url320?.url || downloadUrl[0]?.url || '';
    }

    return '';
}

export function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[\(\[]([^\)\]]*?)(mix|edit|acoustic|live|instrumental)[^\)\]]*?[\)\]]/gi, '')
        .replace(/[\(\[].*?[\)\]]/g, '')
        .replace(/(with).*/gi, '')
        .replace(/[-–—].*/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function formatFollowerCount(
    value: number | string | null | undefined,
    locale: string = 'en',
    options?: Intl.NumberFormatOptions
): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
        return '0';
    }

    const defaultOptions: Intl.NumberFormatOptions = {
        notation: 'compact',
        maximumFractionDigits: 1,
    };

    const formatOptions = { ...defaultOptions, ...options };

    try {
        return new Intl.NumberFormat(locale, formatOptions).format(num);
    } catch {
        return new Intl.NumberFormat('en', defaultOptions).format(num);
    }
}