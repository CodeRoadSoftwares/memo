import { prisma } from "./src/core/db/prisma.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("\n🔑 [Memo CLI] Change Password Tool");
    console.log("=====================================");
    console.log("Usage:");
    console.log("  npx tsx change_password.ts <phone_number> <new_password>\n");
    console.log("Example:");
    console.log("  npx tsx change_password.ts +1234567890 myNewSecurePass123\n");
    process.exit(0);
  }

  const phone = args[0].trim();
  const newPassword = args[1].trim();

  if (newPassword.length < 6) {
    console.error("❌ Error: Password must be at least 6 characters long.");
    process.exit(1);
  }

  console.log(`🔍 Looking up user with phone: ${phone}...`);
  
  const user = await prisma.user.findUnique({
    where: { phone }
  });

  if (!user) {
    console.error(`❌ Error: User with phone number "${phone}" not found.`);
    process.exit(1);
  }

  console.log(`👤 User found: ${user.name || "Unnamed User"}`);
  console.log("🔄 Hashing new password securely...");

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  console.log("💾 Saving password to database...");
  
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  console.log("\n🎉 SUCCESS: Password has been updated successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("💥 Fatal error executing script:", err);
  process.exit(1);
});
