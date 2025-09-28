/**
 * Utilitário para logging condicional baseado na variável de ambiente ENABLE_DEBUG
 */

export const debugLog = (...args: any[]) => {
  if (process.env['DEBUG'] === 'true' || process.env['ENABLE_DEBUG'] === 'true') {
    console.log('[DEBUG]', ...args);
  }
};

// Logs informativos que são mostrados independentemente do debug, para ajudar o usuário
export const infoLog = (...args: any[]) => {
  console.log(...args);
};

// Logs condicionais que dependem da variável ENABLE_DEBUG
export const conditionalLog = (...args: any[]) => {
  if (process.env['DEBUG'] === 'true' || process.env['ENABLE_DEBUG'] === 'true') {
    console.log(...args);
  }
};