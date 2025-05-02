import { OrbisDB } from "@useorbis/db-sdk";

export function applyOrbisAuthPatches() {
  // No-op - Account Kit handles authentication
  console.log("Using Account Kit for authentication");
}

export function applyOrbisDBPatches(orbis: OrbisDB) {
  // No-op - Account Kit handles DB authentication
  console.log("Using Account Kit for DB operations");
}
