const { PrismaClient } = require('@prisma/client');

let prisma;

const connectDB = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prisma;
};

const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  prisma: () => prisma || connectDB()
};