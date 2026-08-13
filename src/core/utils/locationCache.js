const CACHE_KEY = 'gps_location';
const TTL_MS = 30 * 60 * 1000;

// lấy vị trí GPS đã lưu trong sessionStorage 
export function getCachedLocation() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lat, long, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > TTL_MS) return null;
    return { lat, long };
  } catch {
    return null;
  }
}

// lưu vị trí GPS vào sessionStorage với thời gian sống (TTL) 30 phút
export function setCachedLocation(lat, long) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ lat, long, timestamp: Date.now() }));
  } catch {
    // Location caching is optional when session storage is unavailable.
  }
}
