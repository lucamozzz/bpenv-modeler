import { PhysicalPlace } from '../../envTypes';
import {
    IAttributeProvider,
    ProviderMetadata,
    AttributeSchema,
    FetchAttributesOptions,
    AttributeFetchResult,
} from '../types';
import { HttpClient } from '../utils/httpClient';
import { flattenObject, prefixKeys } from '../utils/attributeHelpers';

export class WeatherAttributeProvider implements IAttributeProvider {
    public readonly metadata: ProviderMetadata = {
        id: 'weather',
        name: 'Weather Forecast Provider',
        description: 'Provides weather forecast data from NOAA (US locations only)',
        version: '1.0.0',
    };

    public readonly schema: AttributeSchema = {
        'weather.*': {
            type: 'object',
            description: 'Dynamic weather attributes from NOAA API (all fields from response)',
        },
    };

    private httpClient: HttpClient;
    private userAgent: string = '(bpenv-modeler, contact@example.com)';

    constructor() {
        this.httpClient = new HttpClient({
            baseURL: 'https://api.weather.gov',
            timeout: 10000,
        });
    }

    public async initialize(config: Record<string, any>): Promise<void> {
        if (config.userAgent) {
            this.userAgent = config.userAgent;
        }
        console.log('Weather provider initialized');
    }

    public canHandle(place: PhysicalPlace): boolean {
        if (!place.coordinates || place.coordinates.length === 0) {
            return false;
        }

        const [lon, lat] = place.coordinates[0];
        return lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66;
    }

    public async fetchAttributes(
        place: PhysicalPlace,
        _options?: FetchAttributesOptions
    ): Promise<AttributeFetchResult> {
        try {
            if (!this.canHandle(place)) {
                return {
                    success: false,
                    attributes: {},
                    error: 'Location is outside US bounds',
                };
            }

            const [lon, lat] = place.coordinates[0];

            // Step 1: Get grid point
            const pointsData = await this.httpClient.get<any>(
                `/points/${lat},${lon}`,
                { headers: { 'User-Agent': this.userAgent } }
            );

            // Step 2: Get forecast
            const forecastData = await this.httpClient.get<any>(
                pointsData.properties.forecast.replace('https://api.weather.gov', ''),
                { headers: { 'User-Agent': this.userAgent } }
            );

            // Take the first (current) forecast period and flatten it dynamically
            const currentPeriod = forecastData.properties.periods[0];

            // Flatten the nested structure
            const flattenedPeriod = flattenObject(currentPeriod);

            // Add some top-level properties that might be useful
            flattenedPeriod.updateTime = forecastData.properties.updateTime;
            flattenedPeriod.elevation = forecastData.properties.elevation?.value || forecastData.properties.elevation;

            // Prefix all keys with 'weather.'
            const attributes = prefixKeys(flattenedPeriod, 'weather');

            return {
                success: true,
                attributes,
                timestamp: Date.now(),
                providerId: this.metadata.id,
            };
        } catch (error) {
            console.error('Weather provider error:', error);
            return {
                success: false,
                attributes: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    public async destroy(): Promise<void> {
        console.log('Weather provider destroyed');
    }
}