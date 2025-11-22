import { db } from "./api";
import { hydrateDbFromSession, saveDbToSession } from "./sessionPersistence";

// Hydrate once at startup from localStorage if present
hydrateDbFromSession(db);

// Flush once immediately
saveDbToSession(db);
