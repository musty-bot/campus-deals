import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        submit: resolve(__dirname, 'submit.html'),
        post: resolve(__dirname, 'post.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        dashboard: resolve(__dirname, 'admin/dashboard.html'),
        pending: resolve(__dirname, 'admin/pending.html'),
        manage: resolve(__dirname, 'admin/manage.html'),
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
})