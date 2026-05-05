import app from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { EmailService } from './services/email.service.js';

const startServer = () => {
  try {
    // Initialize services
    EmailService.initialize();

    app.listen(config.PORT, () => {
      logger.info(`🚀 API Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server:');
    process.exit(1);
  }
};

startServer();
