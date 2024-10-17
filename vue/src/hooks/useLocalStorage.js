import { ref, reactive, watch } from 'vue'

export const useLocalStorage = (initObj) => {
  const obj = reactive(initObj)

  const set = (key, newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }

  const get = (key) => {
    if (localStorage.getItem(key)) {
      return JSON.parse(localStorage.getItem(key))
    } else {
      return obj[key]
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
