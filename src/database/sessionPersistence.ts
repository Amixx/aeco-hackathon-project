const SESSION_DB_KEY = 'app:db';

/**
 * Load a previously saved db snapshot from sessionStorage
 * and shallowly copy its top-level keys into the provided db object.
 */
export function hydrateDbFromSession(db: Record<string, unknown>): boolean {
	if (typeof window === 'undefined') return false;
	try {
		const raw = window.sessionStorage.getItem(SESSION_DB_KEY);
		if (!raw) return false;
		const snapshot = JSON.parse(raw);
		if (!snapshot || typeof snapshot !== 'object') return false;

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
 * Save the current db snapshot to sessionStorage immediately.
 */
export function saveDbToSession(db: unknown): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(SESSION_DB_KEY, JSON.stringify(db));
	} catch {
		// ignore quota/serialization errors in this simple approach
	}
}

/**
 * Start a lightweight autosave loop and lifecycle event flush for the db.
 * Ensures it runs only once per session/tab.
 */
export function startSessionAutosave(db: unknown, intervalMs: number = 1000): void {
	if (typeof window === 'undefined') return;

	// Avoid multiple registrations
	const w = window as unknown as { __DB_AUTOSAVE__?: { handle: number } };
	if (w.__DB_AUTOSAVE__) return;

	// Periodic snapshot
	const handle = window.setInterval(() => {
		saveDbToSession(db);
	}, intervalMs);

	// Flush on lifecycle events
	window.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			saveDbToSession(db);
		}
	});
	window.addEventListener('beforeunload', () => {
		saveDbToSession(db);
	});

	w.__DB_AUTOSAVE__ = { handle };
}
