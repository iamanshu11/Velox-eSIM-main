import db from './config/database';
import logger from './utils/logger';

async function updateCredentials() {
  try {
    logger.warn('⚠️ WARNING: This script is for DEVELOPMENT ONLY');
    logger.warn('⚠️ In production, use the admin API endpoint to set credentials');
    logger.warn('⚠️ Never commit credentials to source code!');
    const esimAccessCode = process.env.ESIM_ACCESS_CODE;
    const esimSecretKey = process.env.ESIM_SECRET_KEY;

    if (!esimAccessCode || !esimSecretKey) {
      logger.error('❌ Missing credentials in environment variables');
      logger.error('Set ESIM_ACCESS_CODE and ESIM_SECRET_KEY in your .env file');
      process.exit(1);
    }

    logger.info('Updating eSIMaccess credentials from environment variables');
    const updated = await db.settings.upsert({
      where: { id: 'default' }, 
      create: {
        id: 'default',
        esimAccessCode: esimAccessCode,
        esimSecretKey: esimSecretKey,
        profitMargin: 1.2,
        currency: 'USD'
      },
      update: {
        esimAccessCode: esimAccessCode,
        esimSecretKey: esimSecretKey
      }
    });
    
    logger.success('Credentials updated successfully', { 
      updatedAt: updated.updatedAt, 
      hasAccessCode: !!updated.esimAccessCode,
      hasSecretKey: !!updated.esimSecretKey
    });
    
  } catch (error) {
    logger.error('Error updating credentials', error instanceof Error ? error : new Error(String(error)));
  } finally {
    await db.$disconnect();
  }
}

updateCredentials();
