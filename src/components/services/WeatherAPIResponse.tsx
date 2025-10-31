import {Weather, WeatherApiResponse} from '../../envTypes.ts';
import {mapWeatherResponse} from './WeatherMapper.tsx';

// GET Request to api.weather.gov
export const getWeatherForecast = async (
    latitude: number,
    longitude: number
): Promise<Weather> => {
    try {
        // First, get the grid endpoint for the location
        const pointsResponse = await fetch(
            `https://api.weather.gov/points/${latitude},${longitude}`,
            {}
        );

        if (!pointsResponse.ok) {
            throw new Error(`HTTP error! status: ${pointsResponse.status}`);
        }

        const pointsData = await pointsResponse.json();
        const forecastUrl = pointsData.properties.forecast;

        // Then, get the forecast
        const forecastResponse = await fetch(forecastUrl, {
            headers: {
                'User-Agent': '(myweatherapp.com, contact@myweatherapp.com)',
            },
        });

        if (!forecastResponse.ok) {
            throw new Error(`HTTP error! status: ${forecastResponse.status}`);
        }

        const forecastData: WeatherApiResponse = await forecastResponse.json();
        return mapWeatherResponse(forecastData);
    } catch (error) {
        console.error('Error fetching weather forecast:', error);
        throw error;
    }
};