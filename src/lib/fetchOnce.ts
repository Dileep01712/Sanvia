const requests = new Map<string, Promise<unknown>>();

export function fetchOnce<T>(key: string, load: () => Promise<T>): Promise<T> {
    const existing = requests.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const request = load().catch((err) => {
        requests.delete(key);
        throw err;
    });
    requests.set(key, request);
    return request;
}