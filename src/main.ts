import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  const port = parseInt(process.env.PORT || '3001', 10);

  // ✅ ENABLE CORS FOR FRONTEND
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  await app.listen(port);

  console.log(`✅ Backend running at http://localhost:${port}`);
  console.log(`✅ CORS enabled for ${frontendUrl}`);
}
bootstrap();

