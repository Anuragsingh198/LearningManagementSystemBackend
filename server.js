const app = require('./src/app');

const PORT = process.env.PORT || 5000;
require('dotenv').config();

// console.log('All env vars:', process.env);  // This will show all loaded env vars
// console.log('MONGO_URI:', process.env.MONGO_URL); // Should NOT be undefined
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
