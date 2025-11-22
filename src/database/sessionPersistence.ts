const SESSION_DB_KEY = "app:db";

type AutosaveState = {
	handle: number;
	onVisibilityChange: () => void;
	onBeforeUnload: () => void;
};

type AutosaveGlobals = Window & {
	__DB_AUTOSAVE__?: AutosaveState;
	__DB_AUTOSAVE_GUARD__?: boolean;
};

/**
 * Load a previously saved db snapshot from sessionStorage
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
 * Save the current db snapshot to sessionStorage immediately.
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
 * Stop the autosave loop and remove lifecycle flush handlers, if running.
 */
export function stopSessionAutosave(): void {
	if (typeof window === "undefined") return;
	const w = window as unknown as AutosaveGlobals;
	const state = w.__DB_AUTOSAVE__;
	if (!state) return;

	// Stop periodic snapshot
	clearInterval(state.handle);
	// Remove listeners
	window.removeEventListener("visibilitychange", state.onVisibilityChange);
	window.removeEventListener("beforeunload", state.onBeforeUnload);

	delete w.__DB_AUTOSAVE__;
}

/**
 * Start a lightweight autosave loop and lifecycle event flush for the db.
 * Ensures it runs only once per session/tab.
 */
export function startSessionAutosave(
	db: unknown,
	intervalMs: number = 1000,
): void {
	if (typeof window === "undefined") return;

	// Avoid multiple registrations
	const w = window as unknown as AutosaveGlobals;
	if (w.__DB_AUTOSAVE__) return;

	// Periodic snapshot
	const handle = window.setInterval(() => {
		saveDbToSession(db);
	}, intervalMs);

	// Flush on lifecycle events
	const onVisibilityChange = () => {
		if (document.visibilityState === "hidden") {
			saveDbToSession(db);
		}
	};
	const onBeforeUnload = () => {
		// In some flows we may intentionally reset the session;
		// this handler will be removed by stopSessionAutosave() in that case.
		saveDbToSession(db);
	};

	window.addEventListener("visibilitychange", onVisibilityChange);
	window.addEventListener("beforeunload", onBeforeUnload);

	w.__DB_AUTOSAVE__ = { handle, onVisibilityChange, onBeforeUnload };
}

/**
 * Remove the db snapshot key from sessionStorage.
 */
export function clearSessionDb(): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.removeItem(SESSION_DB_KEY);
	} catch {
		// ignore
	}
}

/**
 * Ensure that calling sessionStorage.clear() stops autosave first,
 * so no new snapshots are written between clear() and reload().
 */
export function installSessionResetGuard(): void {
	if (typeof window === "undefined") return;
	const w = window as unknown as AutosaveGlobals;
	if (w.__DB_AUTOSAVE_GUARD__) return;

	const originalClear = window.localStorage.clear.bind(window.localStorage);

	window.localStorage.clear = () => {
		// Stop autosave + flush handlers, then clear storage
		try {
			stopSessionAutosave();
		} finally {
			originalClear();
		}
	};

	w.__DB_AUTOSAVE_GUARD__ = true;
}
