import 'dotenv/config';
import { createServer } from './server';
import prisma from './prisma/client';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  try {
    // Verify DB connection
    await prisma.$connect();
    console.log("🟢 PostgreSQL (Prisma) Connected");

    const app = createServer();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`🔴 Port ${PORT} is already in use. Please terminate the other process or change the PORT in your .env file.`);
        process.exit(1);
      } else {
        console.error("🔴 Server error:", error);
      }
    });

  } catch (error) {
    console.error("🔴 Failed to start server:", error);
    process.exit(1);
  }
}

startServer();