import { Loader } from "@googlemaps/js-api-loader";

let geocoder: google.maps.Geocoder | null = null;

const initializeGeocoder = async () => {
  if (geocoder) return geocoder;

  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    version: "weekly",
  });

  try {
    const { Geocoder } = await loader.importLibrary("geocoding");
    geocoder = new Geocoder();
    return geocoder;
  } catch (error) {
    console.error("Failed to initialize geocoder:", error);
    throw error;
  }
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | undefined> => {
  try {
    const geocoderInstance = await initializeGeocoder();
    const response = await geocoderInstance.geocode({
      location: { lat: latitude, lng: longitude },
    });

    if (response.results && response.results.length > 0) {
      return response.results[0].formatted_address;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting address:", error);
    return undefined;
  }
};
