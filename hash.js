const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash("12345", 10);
  console.log("Hashed Password:", hash);
})();
