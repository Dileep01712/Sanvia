import { useEffect, useState } from "react";

const FALLBACK_COLOR = "rgb(9, 9, 11)";

const extractDominantColor = (img: HTMLImageElement): string => {
    const SAMPLE_SIZE = 150;
    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");
    if (!ctx) return FALLBACK_COLOR;

    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    let data: Uint8ClampedArray;
    try {
        data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
    } catch (error) {
        console.warn("useImageColor: Unable to read image data (CORS?)", error);
        return FALLBACK_COLOR;
    }

    const bins = new Map<string, { r: number, g: number, b: number, count: number }>();
    const MIN_BRIGHTNESS = 40;

    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 128) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness = (r + g + b) / 3;
        if (brightness < MIN_BRIGHTNESS) continue;

        const qR = r & 248;
        const qG = g & 248;
        const qB = b & 248;
        const key = `${qR},${qG},${qB}`;

        const existingBin = bins.get(key);
        if (existingBin) {
            existingBin.count++;
        } else {
            bins.set(key, { r: qR, g: qG, b: qB, count: 1 });
        }
    }

    const sortedBins = Array.from(bins.values()).sort((a, b) => b.count - a.count);
    const selectedBins: { r: number, g: number, b: number, count: number }[] = [];
    const DISTANCE_THRESHOLD = 50;

    for (const bin of sortedBins) {
        if (selectedBins.length >= 5) break;

        const isDistinct = selectedBins.every(
            (selected) =>
                Math.sqrt((bin.r - selected.r) ** 2 + (bin.g - selected.g) ** 2 + (bin.b - selected.b) ** 2) >= DISTANCE_THRESHOLD
        );

        if (isDistinct) selectedBins.push(bin);
    }

    if (selectedBins.length === 0 && sortedBins.length > 0) {
        selectedBins.push(sortedBins[0]);
    }

    if (selectedBins.length === 0) return FALLBACK_COLOR;

    let totalWeight = 0;
    let blendedR = 0, blendedG = 0, blendedB = 0;

    for (const bin of selectedBins) {
        const weight = Math.sqrt(bin.count);
        blendedR += bin.r * weight;
        blendedG += bin.g * weight;
        blendedB += bin.b * weight;
        totalWeight += weight;
    }

    const clamp = (val: number) => Math.min(255, Math.max(MIN_BRIGHTNESS, val));

    return `rgb(${Math.round(clamp(blendedR / totalWeight))}, ${Math.round(clamp(blendedG / totalWeight))}, ${Math.round(clamp(blendedB / totalWeight))})`;
};

export const useImageColor = (imageUrl: string) => {
    const [color, setColor] = useState(FALLBACK_COLOR);

    useEffect(() => {
        if (!imageUrl) {
            setColor(FALLBACK_COLOR);
            return;
        }

        let isActive = true;
        const img = new Image();
        img.crossOrigin = "anonymous";

        const handleLoad = () => {
            if (!isActive) return;
            setColor(extractDominantColor(img));
        };

        img.onload = handleLoad;

        img.onerror = () => {
            if (isActive) setColor(FALLBACK_COLOR);
        };

        const cacheBuster = imageUrl.includes("?") ? "&_cb=" : "?_cb=";
        img.src = `${imageUrl}${cacheBuster}${Date.now()}`;

        if (img.complete) {
            handleLoad();
        }

        return () => {
            isActive = false;
        };
    }, [imageUrl]);

    return color;
};