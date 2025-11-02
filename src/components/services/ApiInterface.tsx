// Imports for different API calls
import {getWeatherForecast} from "./WeatherAPIResponse.tsx";

// Imports for switch case
import {APICALL_NAME_WEATHER} from "./variables/apiCallNames.ts";


// Execute API call by switching cases based on apiCall.name
// This allows for a single interface to call different APIs
// Passed parameters are dependent on the specific API being called and therefore passed as a list
export const executeApiCall = async (name: string, ...params: any[]): Promise<any | null> => {

    // Switch case for different API calls based on apiCall.name (to be checked in apiCallNames.ts)
    switch ( name ) {
        case APICALL_NAME_WEATHER:
            // Validate parameter count
            if (params.length < 2) {
                throw new Error(`${APICALL_NAME_WEATHER} requires 2 parameters (latitude, longitude)`);
            }
            // Validate parameter types 'number' that is expected from getWeatherForecast
            if (typeof params[0] !== 'number' || typeof params[1] !== 'number') {
                throw new Error(`${APICALL_NAME_WEATHER} parameters must be numbers`);
            }

            // awaits Weather type return (defined in envTypes.ts)
            return await getWeatherForecast(params[0], params[1]);
        default:
            break;
    }
    return null;
};
