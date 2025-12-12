/**
 * Decode Google Maps polyline format into lat/lng coordinates
 * Based on the Google Polyline Algorithm
 */
export function decodePolyline(encoded: string): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

/**
 * Encode coordinates to Google Maps polyline format
 */
export function encodePolyline(coordinates: Array<[number, number]>): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lat, lng] of coordinates) {
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);

    const deltaLat = latE5 - prevLat;
    const deltaLng = lngE5 - prevLng;

    prevLat = latE5;
    prevLng = lngE5;

    encoded += encodeValue(deltaLat);
    encoded += encodeValue(deltaLng);
  }

  return encoded;
}

function encodeValue(value: number): string {
  let encoded = '';
  let v = value < 0 ? ~(value << 1) : (value << 1);

  while (v >= 0x20) {
    encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }

  encoded += String.fromCharCode(v + 63);
  return encoded;
}
