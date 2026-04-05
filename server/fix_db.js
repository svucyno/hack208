const sequelize = require('./db');
const Profile = require('./models/Profile');

async function fix() {
  await sequelize.sync();
  // Set all current profiles to 'veg' for testing
  await Profile.update({ dietaryPreference: 'veg' }, { where: {} });
  console.log('All profiles updated to veg');
  process.exit(0);
}

fix();
