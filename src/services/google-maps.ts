import { Loader } from "@googlemaps/js-api-loader";

// Create a shared Loader instance
export const mapsLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  version: "weekly",
  libraries: ["places", "geometry", "geocoding"],
});

// Initialize all required Google Maps services
export const initializeGoogleMaps = async (): Promise<{
  places: google.maps.PlacesLibrary;
  geometry: google.maps.GeometryLibrary;
  geocoding: google.maps.GeocodingLibrary;
} | null> => {
  try {
    const [places, geometry, geocoding] = await Promise.all([
      mapsLoader.importLibrary("places"),
      mapsLoader.importLibrary("geometry"),
      mapsLoader.importLibrary("geocoding"),
    ]);
    return { places, geometry, geocoding };
  } catch (error) {
    console.error("Failed to initialize Google Maps:", error);
    return null;
  }
};
