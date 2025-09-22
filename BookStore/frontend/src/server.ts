import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * ✅ 1. Serve static files cho Angular build
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * ✅ 2. Serve static files cho uploads (ảnh tác giả, bìa sách, ...)
 * Dùng process.cwd() để luôn trỏ về thư mục gốc project
 */
app.use(
  '/uploads',
  express.static(join(process.cwd(), 'uploads'), {
    maxAge: '1d',
  }),
);

/**
 * ✅ 3. API endpoint tùy chỉnh (nếu cần)
 * Bạn có thể mở comment dưới và thêm API REST riêng cho SSR server
 */
// app.get('/api/**', (req, res) => {
//   res.json({ message: 'Hello from SSR server!' });
// });

/**
 * ✅ 4. Handle tất cả request còn lại bằng Angular SSR
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * ✅ 5. Khởi chạy server
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`✅ SSR server đang chạy tại: http://localhost:${port}`);
    console.log(`📂 Đang phục vụ ảnh từ: /uploads`);
  });
}

/**
 * ✅ 6. Export request handler (dùng cho dev-server hoặc Firebase Functions)
 */
export const reqHandler = createNodeRequestHandler(app);
