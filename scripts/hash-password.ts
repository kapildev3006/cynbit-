import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -- \"<password>\"");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nGenerated bcrypt hash:");
console.log(hash);
console.log("\nYou can set this hash in your database or environment variables.\n");
