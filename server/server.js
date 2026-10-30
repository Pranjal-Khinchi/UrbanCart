require('dotenv').config();
const { connectDatabases } = require('./config/db');

async function main() {
  try {
    // Connect BOTH databases before anything else requires a model.
    // Models call getPrimaryConnection().model(...) at require-time, so the
    // primary connection must be open before ./app (and its routes/models)
    // is ever required.
    await connectDatabases();

    // Requiring app AFTER the DB connection is established is what makes
    // every model file's getPrimaryConnection() call safe.
    const app = require('./app');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`\n🚀 UrbanCart API server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Client URL (CORS): ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start UrbanCart server:', err.message);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

main();
