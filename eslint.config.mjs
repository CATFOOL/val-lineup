// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Disable no-undef for Vue files as Nuxt auto-imports are handled
    'no-undef': 'off',
    // Vue 3 supports fragments (multiple root elements) natively
    'vue/no-multiple-template-root': 'off',
  },
})
