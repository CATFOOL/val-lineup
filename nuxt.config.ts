// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@nuxt/eslint'],
  eslint: {
    config: {
      typescript: true,
    },
  },
  css: ['~/assets/css/main.css'],
  nitro: {
    compressPublicAssets: true,
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: [
        '/',
        '/browse',
        '/maps/*',
        '/lineups/*',
        '/collections/*',
        '/bookmarks/*',
        '/register',
        '/login',
        '/confirm',
        '/check-email',
        '/agents/*',
        '/profile/*',
      ],
      cookieRedirect: false,
    },
    cookieOptions: {
      sameSite: 'lax',
      secure: false, // 如果使用 HTTPS，改为 true
    },
  },
})
