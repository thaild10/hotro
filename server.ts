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
    
    app.get('/', (req, res) => res.redirect('/admin/'));
  } else {
    // prod serving mode
    app.use('/admin', express.static(path.resolve('apps/admin-system/dist')));
    app.get('/admin/*', (req, res) => res.sendFile(path.resolve('apps/admin-system/dist/index.html')));

    app.use('/care', express.static(path.resolve('apps/care-hub/dist')));
    app.get('/care/*', (req, res) => res.sendFile(path.resolve('apps/care-hub/dist/index.html')));

    app.use('/commerce', express.static(path.resolve('apps/commerce-hub/dist')));
    app.get('/commerce/*', (req, res) => res.sendFile(path.resolve('apps/commerce-hub/dist/index.html')));

    app.get('/', (req, res) => res.redirect('/admin/'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
