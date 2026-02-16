/**
 * Environment Configuration
 * Type-safe access to environment variables with validation
 */

interface EnvConfig {
    // Supabase
    supabaseUrl: string;
    supabaseAnonKey: string;

    // App Config
    isDevelopment: boolean;
    isProduction: boolean;
    nodeEnv: string;
}

/**
 * Validates that required environment variables are present
 */
function validateEnv(): void {
    const required = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
    ];

    const missing = required.filter(key => !import.meta.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        console.error('Please check your .env file and ensure all required variables are set.');
    }
}

/**
 * Get environment configuration
 */
function getEnvConfig(): EnvConfig {
    // Validate on first access
    if (import.meta.env.DEV) {
        validateEnv();
    }

    return {
        // Supabase (required)
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

        // App Config
        isDevelopment: import.meta.env.DEV,
        isProduction: import.meta.env.PROD,
        nodeEnv: import.meta.env.MODE,
    };
}

// Export singleton config
export const env = getEnvConfig();

// Export validation function for manual use
export { validateEnv };
