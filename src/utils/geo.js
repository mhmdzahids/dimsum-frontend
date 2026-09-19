// Koordinat Outlet Cabang Utama Makan Dimsum (Bekasi Timur)
export const OUTLET_COORDS = {
  latitude: -6.2491776,
  longitude: 106.9768225,
  name: 'Makan Dimsum Cabang Utama'
};

// Hitung jarak Haversine dalam kilometer (murni kalkulasi matematika tanpa dependensi peta)
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
