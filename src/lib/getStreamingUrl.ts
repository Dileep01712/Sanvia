interface QualityUrl {
    quality: string;
    url: string;
}

interface Artist {
    id: string;
    name: string;
    role: string;
    image: string[];
    type: string;
    url: string;
}

interface AlbumSong {
    id: string;
    name: string;
    downloadUrl: QualityUrl[];
    artists: {
        primary: Artist[];
        featured: Artist[];
        all: Artist[];
    };
}

interface SongResponse {
    downloadUrl: QualityUrl[];
}

interface StreamingResult {
    url: string;
    name: string;
    primaryArtists: string;
}

export async function getStreamingUrlFromSaavn(id: string, name: string, downloadUrl: string): Promise<StreamingResult> {
    try {
        if (!downloadUrl) return { url: "", name: "", primaryArtists: "" };

        const encodedUrl = encodeURIComponent(downloadUrl);
        const songAPI = process.env.NEXT_PUBLIC_SONG_API_URL;
        const albumAPI = process.env.NEXT_PUBLIC_ALBUM_API_URL;

        if (downloadUrl.includes("/song/")) {
            const response = await fetch(`${songAPI}${encodedUrl}`);
            const json: { success: boolean; data: SongResponse[] } = await response.json();

            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                const song = json.data[0];

                const bestQuality = song.downloadUrl.find((q) => q.quality === "320kbps");
                return {
                    url: bestQuality?.url || "",
                    name: "",
                    primaryArtists: "",
                };
            }

        } else if (downloadUrl.includes("/album/")) {
            const response = await fetch(`${albumAPI}${encodedUrl}`);
            const json: { success: boolean; data: { songs: AlbumSong[] }; } = await response.json();

            if (json.success && Array.isArray(json.data.songs)) {
                const songs = json.data.songs;

                const match = songs.find((s) => s.id === id || s.name.trim().toLowerCase() === name?.trim().toLowerCase());
                const selected = match ?? songs[Math.floor(Math.random() * songs.length)];

                if (selected) {
                    const bestQuality = selected.downloadUrl.find((q) => q.quality === "320kbps");
                    return {
                        url: bestQuality?.url || "",
                        name: selected.name,
                        primaryArtists: selected.artists?.primary?.map((a: Artist) => a.name).join(", ") || "Unknown Artist"
                    };
                }
            }
        }

        return { url: "", name: "", primaryArtists: "" };
    } catch (error) {
        console.error("Error fetching streaming URL:", error);
        return { url: "", name: "", primaryArtists: "" };
    }
}
