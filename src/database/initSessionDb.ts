import { db } from "./api";
import {
	hydrateDbFromSession,
	installSessionResetGuard,
	saveDbToSession,
	startSessionAutosave,
} from "./sessionPersistence";

// Hydrate once at startup from localStorage if present
hydrateDbFromSession(db);

// Ensure clear() will stop autosave before wiping storage
installSessionResetGuard();

// Start small autosave loop for the session and flush once immediately
startSessionAutosave(db, 1000);
saveDbToSession(db);
