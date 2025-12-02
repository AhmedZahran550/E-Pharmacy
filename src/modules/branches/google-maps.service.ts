// src/google-maps/google-maps.service.ts
import { Injectable } from '@nestjs/common';
import {
  Client,
  PlacePhoto,
  PlacesNearbyRequest,
  PlaceType2,
} from '@googlemaps/google-maps-services-js';

@Injectable()
export class GoogleMapsService {
  private readonly client: Client;

  constructor() {
    this.client = new Client({});
  }

  async findNearbyMedicalPlaces(param: any) {
    const apiKey = process.env.GOOGLE_MAPS_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing GOOGLE_MAPS_PLACES_API_KEY environment variable',
      );
    }
    try {
      const apiParams: any = {
        location: {
          lat: parseFloat(param.lat),
          lng: parseFloat(param.lng),
        },
        radius: parseInt(param.radius, 10) || 5000,
        keyword: param.keyword || 'medical',
        type: param.type || PlaceType2.health,
        language: param.language || 'en',
        key: apiKey,
      };
      if (param.name) {
        apiParams.name = param.name;
      }
      if (param.opennow) {
        apiParams.opennow = String(param.opennow).toLowerCase() === 'true';
      }
      const response = await this.client.placesNearby({
        params: apiParams,
        timeout: 1000,
      });

      const places = response.data.results.map((place) => ({
        ...place,
      }));

      return places;
    } catch (error) {
      console.error('Google Maps API error:', error.message);
      throw new Error(error.message);
    }
  }

  private buildPhotoUrl(photo: PlacePhoto, apiKey: string): string {
    if (!photo?.photo_reference) return null;
    // يمكنك تغيير maxwidth=400 إلى الحجم الذي يناسبك
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${photo.width || 400}&maxheight=${photo.height || 400}&photoreference=${photo.photo_reference}&key=${apiKey}`;
  }
}
