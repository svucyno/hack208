const sequelize = require('./db');

async function checkSchema() {
  try {
    const [results] = await sequelize.query("PRAGMA table_info(Profiles)");
    console.log('Profile Table Columns:', JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Failed to check schema:', err);
    process.exit(1);
  }
}

checkSchema();
