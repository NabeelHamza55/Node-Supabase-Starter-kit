import app from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';

const startServer = () => {
  try {
    app.listen(config.PORT, () => {
      logger.info(`🚀 API Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server:');
    process.exit(1);
  }
};

startServer();
