import { mapsLoader } from "./google-maps";

let geocoder: google.maps.Geocoder | null = null;

const initializeGeocoder = async () => {
  if (!geocoder) {
    const { Geocoder } = await mapsLoader.importLibrary("geocoding");
    geocoder = new Geocoder();
  }
  return geocoder;
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | undefined> => {
  try {
    const geocoder = await initializeGeocoder();
    if (!geocoder) {
      throw new Error("無法初始化地理編碼服務");
    }

    const response = await geocoder.geocode({
      location: { lat: latitude, lng: longitude },
    });

    if (response.results && response.results.length > 0) {
      return response.results[0].formatted_address;
    }
  } catch (error) {
    console.error("Error getting address:", error);
    throw error;
  }
};
