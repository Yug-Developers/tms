import { ref, reactive, watch } from 'vue'

export const useLocalStorage = (initObj) => {
  const obj = reactive(initObj)

  const set = (key, newValue) => {
    // якщо newValue є об'єктом, або масивом то зберігаємо його як JSON.stringify(newValue) інакше як newValue
    if (typeof newValue === 'object' || Array.isArray(newValue)) {
      localStorage.setItem(key, JSON.stringify(newValue))
    } else {
      localStorage.setItem(key, newValue)
    }
  }

  const get = (key) => {
    const value = localStorage.getItem(key)
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }


  for (const key in obj) {
    obj[key] = get(key)
  }

  watch(obj, (newValue) => {
    for (const key in newValue) {
      set(key, newValue[key])
    }
  })

  return obj
}
