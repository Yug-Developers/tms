// useGeolocation.js
import { ref, onMounted } from 'vue'

export default function useGeolocation() {
  const location = ref(null)
  const locationError = ref(null)

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            location.value = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
            resolve(location.value)
          },
          (err) => {
            locationError.value = err.message
            reject(locationError.value)
          }
        )
      } else {
        locationError.value = 'Геолокация не підтримується браузером'
        reject(locationError.value)
      }
    })
  }

  onMounted(() => {
    // Вы можете добавить дополнительные действия при монтировании компонента здесь
  })

  return {
    location,
    locationError,
    getLocation,
  }
}

