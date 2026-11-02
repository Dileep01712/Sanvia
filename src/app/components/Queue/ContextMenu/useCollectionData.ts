import { useEffect, useState } from "react";
import { Song } from "@/lib/songTypes";
import { fetchOnce } from "@/lib/fetchOnce";
import { decodeHTMLEntities } from "@/lib/helpers";

const ALBUM_URL = process.env.NEXT_PUBLIC_ALBUM_BY_LINK_API_URL;
const ARTIST_URL = process.env.NEXT_PUBLIC_ARTIST_BY_ID_API_URL;

export type CollectionKind = "album" | "artist";

interface ApiLink {
    quality?: string;
    url?: string;
}

interface ApiName {
    name?: string;
}

interface ApiSong {
    id?: string;
    name?: string;
    duration?: number | string;
    image?: ApiLink[];
    downloadUrl?: ApiLink[];
    artists?: { primary?: ApiName[] };
}

interface ApiData {
    year?: number | string;
    language?: string;
    songCount?: number;
    artists?: { primary?: ApiName[] };
    songs?: ApiSong[];
    dominantLanguage?: string;
    topSongs?: ApiSong[];
}

export interface MetaLine {
    label: string;
    value: string;
}

export interface Collection {
    artists?: string;
    meta: MetaLine[];
    songs: Song[];
}

function titleCase(value?: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function joinNames(list?: ApiName[]): string {
    const names = (list ?? []).map((a) => a.name).filter((n): n is string => !!n);
    return decodeHTMLEntities(Array.from(new Set(names)).join(", "));
}

function formatTotal(seconds: number): string {
    if (seconds <= 0) return "";
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

function toSong(s: ApiSong): Song | null {
    const best = (s.downloadUrl ?? [])
        .filter((d) => !!d.url)
        .sort((a, b) => parseInt(a.quality ?? "0", 10) - parseInt(b.quality ?? "0", 10))
        .pop();
    if (!s.id || !best?.url) return null;

    const image = (s.image ?? []).filter((i) => !!i.url).pop()?.url ?? "";

    return {
        id: s.id,
        name: s.name ?? "",
        primaryArtists: joinNames(s.artists?.primary),
        image,
        downloadUrl: best.url,
        streamingUrl: best.url,
        type: "song",
        duration: s.duration,
    } as unknown as Song;
}

function sumSeconds(songs?: ApiSong[]): number {
    return (songs ?? []).reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
}

function normalizeAlbum(api: ApiData): Collection {
    const songs = (api.songs ?? []).map(toSong).filter((s): s is Song => s !== null);
    const count = Number(api.songCount ?? api.songs?.length ?? songs.length) || 0;
    const artists = joinNames(api.artists?.primary);
    const duration = formatTotal(sumSeconds(api.songs));
    const year = api.year ? String(api.year).trim() : "";
    const language = titleCase(api.language);

    return {
        artists: artists || undefined,
        meta: [
            count > 0 && { label: count === 1 ? "Track" : "Tracks", value: String(count) },
            duration && { label: "Duration", value: duration.replace(" min", "m").replace(" sec", "s") },
            year && { label: "Year", value: year },
            language && { label: "Language", value: language },
        ].filter(Boolean) as MetaLine[],
        songs,
    };
}

function normalizeArtist(api: ApiData): Collection {
    const songs = (api.topSongs ?? []).map(toSong).filter((s): s is Song => s !== null);
    const duration = formatTotal(sumSeconds(api.topSongs));
    const language = titleCase(api.dominantLanguage);

    return {
        meta: [
            songs.length > 0 && { label: "Top Tracks", value: String(songs.length) },
            duration && { label: "Duration", value: duration.replace(" min", "m").replace(" sec", "s") },
            language && { label: "Language", value: language },
        ].filter(Boolean) as MetaLine[],
        songs,
    };
}

function buildRequestUrl(kind: CollectionKind, key: string): string {
    if (kind === "album") {
        return `${ALBUM_URL ?? ""}${encodeURIComponent(key)}`;
    }
    const cleanBase = (ARTIST_URL ?? "")
        .replace(/\/\d+(\?.*)?$/, "")
        .replace(/\/+$/, "");

    return `${cleanBase}/${encodeURIComponent(key)}?page=0&songCount=10&albumCount=10&sortBy=popularity&sortOrder=desc`;
}

function loadCollection(kind: CollectionKind, key?: string): Promise<Collection> {
    if (!key) return Promise.reject(new Error("Missing id or link"));

    return fetchOnce(`${kind}:${key}`, async () => {
        const url = buildRequestUrl(kind, key);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);

            const json = (await res.json()) as { data?: ApiData };
            if (!json.data) throw new Error("Empty response");

            return kind === "album" ? normalizeAlbum(json.data) : normalizeArtist(json.data);
        } finally {
            clearTimeout(timer);
        }
    });
}

export type CollectionLoadState =
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; data: Collection };

export function useCollectionData(kind: CollectionKind, key?: string): CollectionLoadState {
    const [state, setState] = useState<CollectionLoadState>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;
        setState({ status: "loading" });

        loadCollection(kind, key)
            .then((data) => {
                if (!cancelled) setState({ status: "ready", data });
            })
            .catch(() => {
                if (!cancelled) setState({ status: "error" });
            });

        return () => {
            cancelled = true;
        };
    }, [kind, key]);

    return state;
}