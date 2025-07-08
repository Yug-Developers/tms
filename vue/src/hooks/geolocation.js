// useGeolocation.js
import { ref, onMounted } from 'vue'

export default function useGeolocation(autoFetch = false) {
  const location = ref(null)
  const locationError = ref(null)
  const isLocationLoading = ref(false)

  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  }

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      location.value = null
      locationError.value = null

      if (!navigator.geolocation) {
        locationError.value = 'Геолокація не підтримується браузером'
        return reject(locationError.value)
      }

      isLocationLoading.value = true

      navigator.geolocation.getCurrentPosition(
        (position) => {
          location.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          isLocationLoading.value = false
          resolve(location.value)
        },
        (err) => {
          locationError.value = err.message
          isLocationLoading.value = false
          reject(locationError.value)
        },
        geoOptions
      )
    })
  }

  onMounted(() => {
    if (autoFetch) getLocation()
  })

  return {
    location,
    locationError,
    isLocationLoading,
    getLocation,
  }
}
