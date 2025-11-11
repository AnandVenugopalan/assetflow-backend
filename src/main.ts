import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ✅ ENABLE CORS FOR FRONTEND RUNNING ON PORT 8080
  app.enableCors({
    origin: "http://localhost:8080",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE"]
  });

  await app.listen(3000);

  console.log("✅ Backend running at http://localhost:3000");
  console.log("✅ CORS enabled for http://localhost:8080");
}
bootstrap();
