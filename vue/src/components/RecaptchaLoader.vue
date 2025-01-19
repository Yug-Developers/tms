<script setup>
import { onMounted } from 'vue'
import Config from '../Config'

const loadRecaptcha = () => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="https://www.google.com/recaptcha/api.js?render=${Config.recaptchaSiteKey}"]`)) {
      resolve()
    } else {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${Config.recaptchaSiteKey}`
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    }
  })
}

onMounted(async () => {
  try {
    await loadRecaptcha()
    console.log('Google reCAPTCHA script loaded successfully.')
  } catch (error) {
    console.error('Failed to load reCAPTCHA script:', error)
  }
})
</script>
