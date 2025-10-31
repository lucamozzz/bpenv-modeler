import {Weather, WeatherApiResponse} from "../../envTypes.ts";

// Mapper function
export const mapWeatherResponse = (apiResponse: WeatherApiResponse): Weather => {
    return {
        location: {
            coordinates: apiResponse.geometry.coordinates,
        },
        forecast: {
            units: apiResponse.properties.units,
            generatedAt: apiResponse.properties.generatedAt,
            updateTime: apiResponse.properties.updateTime,
            elevation: apiResponse.properties.elevation.value,
            periods: apiResponse.properties.periods.map((period) => ({
                number: period.number,
                name: period.name,
                startTime: period.startTime,
                endTime: period.endTime,
                isDaytime: period.isDaytime,
                temperature: period.temperature,
                temperatureUnit: period.temperatureUnit,
                temperatureTrend: period.temperatureTrend,
                probabilityOfPrecipitation: period.probabilityOfPrecipitation.value,
                windSpeed: period.windSpeed,
                windDirection: period.windDirection,
                icon: period.icon,
                shortForecast: period.shortForecast,
                detailedForecast: period.detailedForecast,
            })),
        },
    };
};