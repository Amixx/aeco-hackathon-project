import { db } from './api';
import { hydrateDbFromSession, startSessionAutosave, saveDbToSession } from './sessionPersistence';

// Hydrate once at startup from sessionStorage if present
hydrateDbFromSession(db);

// Start small autosave loop for the session and flush once immediately
startSessionAutosave(db, 1000);
saveDbToSession(db);
