import prisma from "./prisma";

async function main() {
  console.log("Keys in prisma:", Object.keys(prisma).filter(k => !k.startsWith("$")));
  try {
    const user = await (prisma as any).user.findMany();
    console.log("Users found:", user.length);
  } catch (e) {
    console.error("Error accessing prisma.user:", e);
  }
}

main();
