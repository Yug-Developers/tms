import axios from 'axios'
import Config from './Config'

// ------------------------------- HTTP -------------------------------------
const token = localStorage.getItem('token')
const HTTP = axios.create({
    baseURL: Config.misUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
})

HTTP.interceptors.response.use(
  async (response) => {
    return response
  },
  async (error) => {
    console.log('error', error)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else {
      return Promise.reject(error)
    }
  }
)


export {
    HTTP
}