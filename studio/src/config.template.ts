/// <reference types="vite/client" />

/**
 * Configuration file for the Annotation Studio front-end.
 * Contains API endpoints and other environment-specific settings.
 */

export const config = {
    api: {
        // The base URL for the backend engine API
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',

        endpoints: {
            recommendations: '/api/recommendations',
            targets: '/api/documents/targets',
            export: '/api/documents/export',
        }
    },

    features: {
        useBackendParser: import.meta.env.VITE_USE_BACKEND_PARSER !== 'false', // Default to true unless explicitly disabled
    }

    // You can also add other configurations here, such as:
    // features: {
    //   enableExperimentalUI: import.meta.env.VITE_ENABLE_EXPERIMENTAL_UI === 'true',
    // }
};

/**
 * Helper function to construct full API URLs.
 */
export function getApiUrl(endpoint: keyof typeof config.api.endpoints): string {
    // Ensure no double slashes if baseUrl has trailing slash, etc, but simple concat works if well-formed
    const baseUrl = config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const path = config.api.endpoints[endpoint];

    return `${baseUrl}${path}`;
}
