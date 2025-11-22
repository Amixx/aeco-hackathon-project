const SESSION_DB_KEY = "app:db";

/**
 * Load a previously saved db snapshot from localStorage
 * and shallowly copy its top-level keys into the provided db object.
 */
export function hydrateDbFromSession(db: Record<string, unknown>): boolean {
	if (typeof window === "undefined") return false;
	try {
		const raw = window.localStorage.getItem(SESSION_DB_KEY);
		if (!raw) return false;
		const snapshot = JSON.parse(raw);
		if (!snapshot || typeof snapshot !== "object") return false;

		// Shallow replace top-level keys to preserve object identity of db
		for (const key of Object.keys(snapshot)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			(db as any)[key] = (snapshot as any)[key];
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Save the current db snapshot to localStorage immediately.
 */
export function saveDbToSession(db: unknown): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(SESSION_DB_KEY, JSON.stringify(db));
	} catch {
		// ignore quota/serialization errors in this simple approach
	}
}

/**
 * Remove the db snapshot key from localStorage.
 */
export function clearSessionDb(): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(SESSION_DB_KEY);
	} catch {
		// ignore
	}
}
