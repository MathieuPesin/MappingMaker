// Supprime les avertissements WebSocket en développement
export const suppressWebSocketWarnings = () => {
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('WebSocket') || args[0].includes('ws://'))
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
  }
};
