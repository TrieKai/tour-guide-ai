export interface AnalysisResponse {
  text: string;
  error?: string;
}

export interface AnalysisRequest {
  image: string;
  prompt: string;
  location?: {
    address?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}
