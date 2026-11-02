import { useEffect, useMemo, useState } from "react";
import { Song } from "@/lib/songTypes";
import { decodeHTMLEntities, getBestQualityDownload } from "@/lib/helpers";

export type ExtendedSong = Song & {
    duration?: string | number;
    artists?: {
        primary?: Array<{ id?: string; name: string; role?: string }>;
        all?: Array<{ id?: string; name: string; role?: string }>;
    };
};

export interface SongInfo {
    name: string;
    artist: string;
    quality: string;
    size: string;
    duration: string;
}

interface SongMeta {
    duration: number;
    bitrate: number;
    mediaUrl: string;
    artists: string;
}

interface MetaState {
    status: "loading" | "ready" | "error";
    meta: SongMeta | null;
}

interface ApiSong {
    duration?: number | string;
    downloadUrl?: Array<{ quality?: string; url?: string }>;
    artists?: { primary?: Array<{ name?: string }> };
}

const metaCache = new Map<string, SongMeta>();

function isDirectMediaUrl(url: string): boolean {
    return /\.(?:mp4|mp3|m4a)(?:\?|$)/i.test(url);
}

export function extractMediaUrl(song: ExtendedSong): string {
    const candidates: Array<string | undefined> = [
        getBestQualityDownload(song.downloadUrl),
        typeof song.downloadUrl === "string" ? song.downloadUrl : undefined,
        song.streamingUrl,
    ];
    return candidates.find((u): u is string => !!u && isDirectMediaUrl(u)) ?? "";
}

function cleanArtists(raw: string): string {
    return raw.split(" - ")[0].trim();
}

export function extractArtistName(song: ExtendedSong): string {
    if (song.primaryArtists && typeof song.primaryArtists === "string" && song.primaryArtists.trim()) {
        return decodeHTMLEntities(cleanArtists(song.primaryArtists));
    }

    const primaryList = song.artists?.primary;
    if (Array.isArray(primaryList) && primaryList.length > 0) {
        const names = primaryList.map((a) => a.name).filter(Boolean);
        if (names.length > 0) {
            return decodeHTMLEntities(Array.from(new Set(names)).join(", "));
        }
    }

    const allList = song.artists?.all;
    if (Array.isArray(allList) && allList.length > 0) {
        const names = allList.map((a) => a.name).filter(Boolean);
        if (names.length > 0) {
            return decodeHTMLEntities(Array.from(new Set(names)).slice(0, 3).join(", "));
        }
    }

    return "Unknown Artist";
}

export async function fetchSongMeta(id: string, signal?: AbortSignal): Promise<SongMeta> {
    const cached = metaCache.get(id);
    if (cached) return cached;

    const res = await fetch(`${process.env.NEXT_PUBLIC_SONG_BY_ID_API_URL}${encodeURIComponent(id)}`, { signal });
    if (!res.ok) throw new Error(`Song details request failed (${res.status})`);

    const json = (await res.json()) as { data?: ApiSong[] | ApiSong };
    const item = Array.isArray(json.data) ? json.data[0] : json.data;

    const best = (item?.downloadUrl ?? [])
        .filter((d) => !!d?.url)
        .sort((a, b) => parseInt(a.quality ?? "0", 10) - parseInt(b.quality ?? "0", 10))
        .pop();
    const duration = Number(item?.duration);

    if (!best?.url || !Number.isFinite(duration) || duration <= 0) {
        throw new Error("Song details are incomplete");
    }

    const names = (item?.artists?.primary ?? [])
        .map((a) => a.name)
        .filter((n): n is string => !!n);

    const meta: SongMeta = {
        duration,
        bitrate: parseInt(best.quality ?? "", 10) || 320,
        mediaUrl: best.url,
        artists: decodeHTMLEntities(Array.from(new Set(names)).join(", ")),
    };

    metaCache.set(id, meta);
    return meta;
}

function getLocalMeta(song: ExtendedSong): SongMeta | null {
    const duration = Number(song.duration);
    const url = extractMediaUrl(song);
    if (!Number.isFinite(duration) || duration <= 0 || !url) return null;

    const bitrate = Number(/_(\d{2,3})\.(?:mp4|mp3|m4a)/i.exec(url)?.[1]) || 320;
    return { duration, bitrate, mediaUrl: url, artists: "" };
}

export function useSongMeta(song: ExtendedSong): MetaState {
    const local = useMemo(() => getLocalMeta(song), [song]);
    const [remote, setRemote] = useState<MetaState>({ status: "loading", meta: null });

    useEffect(() => {
        if (local) return;

        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, 10000);

        fetchSongMeta(song.id, controller.signal)
            .then((meta) => {
                if (!controller.signal.aborted) setRemote({ status: "ready", meta });
            })
            .catch(() => {
                if (timedOut || !controller.signal.aborted) {
                    setRemote({ status: "error", meta: null });
                }
            })
            .finally(() => clearTimeout(timer));

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [local, song.id]);

    return useMemo<MetaState>(
        () => (local ? { status: "ready", meta: local } : remote),
        [local, remote]
    );
}

export function getSongInfo(rawSong: Song, state: MetaState): SongInfo | null {
    const song = rawSong as ExtendedSong;
    const name = decodeHTMLEntities(song.name ?? "").trim();
    if (!name) return null;

    const meta = state.meta;
    const artist = meta?.artists || extractArtistName(song);

    if (!meta) {
        const pending = state.status === "error" ? "Unavailable" : "Loading...";
        return { name, artist, quality: "320K", size: pending, duration: pending };
    }

    const mins = Math.floor(meta.duration / 60);
    const rem = Math.floor(meta.duration % 60);
    const audioBytes = ((meta.bitrate * 1000) / 8) * meta.duration;
    const metadataOverheadBytes = 360 * 1024;
    const totalMb = (audioBytes + metadataOverheadBytes) / (1024 * 1024);

    return {
        name,
        artist,
        quality: `${meta.bitrate}K`,
        size: `≈ ${totalMb.toFixed(1)} MB`,
        duration: `${mins}:${String(rem).padStart(2, "0")}`,
    };
}