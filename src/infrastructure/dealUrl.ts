// The active deal's id lives in the URL query (`?deal=<id>`) so each browser tab keeps
// its own deal across a refresh — independent of the shared `activeId` in localStorage
// (which any tab can overwrite). Distinct from the share link's `#deal=<csv>` hash.
const PARAM = "deal";

export function readDealIdFromUrl(): string | null {
  try {
    return new URL(location.href).searchParams.get(PARAM);
  } catch {
    return null;
  }
}

export function writeDealIdToUrl(id: string | null): void {
  try {
    const u = new URL(location.href);
    if (id) u.searchParams.set(PARAM, id);
    else u.searchParams.delete(PARAM);
    // replaceState (not push) so switching deals doesn't spam browser history.
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  } catch {
    /* ignore */
  }
}
