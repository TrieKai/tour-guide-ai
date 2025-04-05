import { mapsLoader } from "./google-maps";

interface Landmark {
  name: string;
  type: string;
  distance: number; // meters
  address?: string;
}

interface PlaceResult extends google.maps.places.PlaceResult {
  geometry?: google.maps.places.PlaceGeometry;
  name?: string;
  types?: string[];
  vicinity?: string;
}

let placesService: google.maps.places.PlacesService | null = null;

const initializePlacesService =
  async (): Promise<google.maps.places.PlacesService | null> => {
    if (!placesService) {
      const { PlacesService } = await mapsLoader.importLibrary("places");
      placesService = new PlacesService(document.createElement("div"));
    }
    return placesService;
  };

export const getNearbyLandmarks = async (
  latitude: number,
  longitude: number,
  radius: number = 500 // Default 500 meters
): Promise<Landmark[]> => {
  try {
    const service = await initializePlacesService();
    if (!service) {
      throw new Error("無法初始化地標服務");
    }

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: { lat: latitude, lng: longitude },
        radius,
      };

      service.nearbySearch(
        request,
        (
          results: google.maps.places.PlaceResult[] | null,
          status: google.maps.places.PlacesServiceStatus
        ) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const landmarks: Landmark[] = results
              .filter((place) => place.rating)
              .slice(0, 10) // Only take the top 10 most relevant landmarks
              .map((place: PlaceResult) => {
                const location = place.geometry?.location;
                const distance = location
                  ? google.maps.geometry.spherical.computeDistanceBetween(
                      { lat: latitude, lng: longitude },
                      location
                    )
                  : 0;

                return {
                  name: place.name || "",
                  type: place.types?.[0] || "point_of_interest",
                  distance: Math.round(distance),
                  address: place.vicinity,
                };
              })
              .sort((a: Landmark, b: Landmark) => a.distance - b.distance);

            // If not enough landmarks, search for other types
            if (landmarks.length < 5) {
              const otherRequest: google.maps.places.PlaceSearchRequest = {
                ...request,
                type: "point_of_interest",
              };

              service.nearbySearch(
                otherRequest,
                (
                  moreResults: google.maps.places.PlaceResult[] | null,
                  moreStatus: google.maps.places.PlacesServiceStatus
                ) => {
                  if (
                    moreStatus === google.maps.places.PlacesServiceStatus.OK &&
                    moreResults
                  ) {
                    const moreLandmarks = moreResults
                      .slice(0, 5 - landmarks.length)
                      .map((place: PlaceResult) => {
                        const location = place.geometry?.location;
                        const distance = location
                          ? google.maps.geometry.spherical.computeDistanceBetween(
                              { lat: latitude, lng: longitude },
                              location
                            )
                          : 0;

                        return {
                          name: place.name || "",
                          type: place.types?.[0] || "point_of_interest",
                          distance: Math.round(distance),
                          address: place.vicinity,
                        };
                      });

                    resolve(
                      [...landmarks, ...moreLandmarks].sort(
                        (a, b) => a.distance - b.distance
                      )
                    );
                  } else {
                    resolve(landmarks);
                  }
                }
              );
            } else {
              resolve(landmarks);
            }
          } else {
            resolve([]); // If no landmarks are found, return an empty array
          }
        }
      );
    });
  } catch (error) {
    console.error("獲取地標失敗:", error);
    return [];
  }
};
