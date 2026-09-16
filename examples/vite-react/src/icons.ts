import { bakeIcons } from '@nyawave/baked-icons';

// Baked at build time into a plain object → safe to pick from at runtime.
export const weather = bakeIcons(['mdi:weather-sunny', 'mdi:weather-cloudy', 'mdi:weather-rainy']);
export type WeatherIcon = keyof typeof weather;
