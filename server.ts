import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const adminVite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve('apps/admin-system'),
      base: '/admin/'
    });

    const careVite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve('apps/care-hub'),
      base: '/care/'
    });

    const commerceVite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve('apps/commerce-hub'),
      base: '/commerce/'
    });

    app.use('/admin', adminVite.middlewares);
    app.use('/care', careVite.middlewares);
    app.use('/commerce', commerceVite.middlewares);
    
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Beauty CRM Hub</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="bg-slate-50 flex items-center justify-center min-h-screen">
          <div class="max-w-4xl w-full p-8">
            <h1 class="text-4xl font-extrabold text-slate-800 mb-2 text-center">Beauty CRM & Management</h1>
            <p class="text-slate-500 text-center mb-12">Monorepo System Architecture</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="/admin" class="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Admin System</h2>
                <p class="text-sm text-slate-500">Quản trị & Công cụ: Khách hàng, Thu chi, Nén ảnh...</p>
              </a>

              <a href="/commerce" class="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m 2 7 l 20 0 l -3 12 l -14 0 z"/><circle cx="9" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M 5 7 L 3 3"/></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Commerce Hub</h2>
                <p class="text-sm text-slate-500">Giao dịch: Sản phẩm, Đơn hàng, Kho, Tồn kho...</p>
              </a>

              <a href="/care" class="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M10 15s1.5 2 2 2 2-2 2-2"/></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Care Hub</h2>
                <p class="text-sm text-slate-500">Tư vấn: Ảnh khách, Phác đồ, Kiến thức...</p>
              </a>
            </div>

            <div class="mt-12 p-6 bg-slate-800 rounded-3xl text-white">
              <h3 class="font-bold mb-2">Thông tin hệ thống:</h3>
              <ul class="text-sm text-slate-400 space-y-1">
                <li>• Cấu trúc: Monorepo (npm workspaces)</li>
                <li>• Backend: Express + Vite Middleware</li>
                <li>• Database Schema: Prisma (Single Source of Truth)</li>
                <li>• Shared Package: @beauty-crm/shared</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  } else {
    // prod serving mode
    app.use('/admin', express.static(path.resolve('apps/admin-system/dist')));
    app.get('/admin/*', (req, res) => res.sendFile(path.resolve('apps/admin-system/dist/index.html')));

    app.use('/care', express.static(path.resolve('apps/care-hub/dist')));
    app.get('/care/*', (req, res) => res.sendFile(path.resolve('apps/care-hub/dist/index.html')));

    app.use('/commerce', express.static(path.resolve('apps/commerce-hub/dist')));
    app.get('/commerce/*', (req, res) => res.sendFile(path.resolve('apps/commerce-hub/dist/index.html')));

    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Beauty CRM Hub</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="bg-slate-50 flex items-center justify-center min-h-screen">
          <div class="max-w-4xl w-full p-8">
            <h1 class="text-4xl font-extrabold text-slate-800 mb-2 text-center">Beauty CRM & Management</h1>
            <p class="text-slate-500 text-center mb-12">Monorepo System Architecture</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="/admin" class="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Admin System</h2>
                <p class="text-sm text-slate-500">Quản trị & Công cụ: Khách hàng, Thu chi, Nén ảnh...</p>
              </a>

              <a href="/commerce" class="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m 2 7 l 20 0 l -3 12 l -14 0 z"/><circle cx="9" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M 5 7 L 3 3"/></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Commerce Hub</h2>
                <p class="text-sm text-slate-500">Giao dịch: Sản phẩm, Đơn hàng, Kho, Tồn kho...</p>
              </a>

              <a href="/care" class="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M10 15s1.5 2 2 2 2-2 2-2"/></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Care Hub</h2>
                <p class="text-sm text-slate-500">Tư vấn: Ảnh khách, Phác đồ, Kiến thức...</p>
              </a>
            </div>

            <div class="mt-12 p-6 bg-slate-800 rounded-3xl text-white">
              <h3 class="font-bold mb-2">Thông tin hệ thống:</h3>
              <ul class="text-sm text-slate-400 space-y-1">
                <li>• Cấu trúc: Monorepo (npm workspaces)</li>
                <li>• Backend: Express + Vite Middleware</li>
                <li>• Database Schema: Prisma (Single Source of Truth)</li>
                <li>• Shared Package: @beauty-crm/shared</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
