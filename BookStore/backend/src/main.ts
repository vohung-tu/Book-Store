import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as compression from 'compression';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(compression());

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://book-store-v302.onrender.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    optionsSuccessStatus: 204,
  });

  app.use(
    '/payos/webhook',
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf; // lưu raw body vào req
      },
    }),
  );

  // ✅ Cấu hình cache cho ảnh, JS, CSS: 7 ngày
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res, path) => {
      if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.webp') || path.endsWith('.gif')) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
      if (path.endsWith('.js') || path.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    },
  });

  // ✅ Giữ nguyên tăng giới hạn payload
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
