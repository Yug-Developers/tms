// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Trip from '@/pages/Trip.vue'
import Trips from '@/pages/Trips.vue'
import Point from '@/pages/Point.vue'
import notFound from '@/pages/404.vue'
import forbidden from '@/pages/403.vue'
import { usePouchDB } from '@/hooks/PouchDb'
import ForgotPassword from '@/pages/ForgotPassword.vue'
const Pouch = usePouchDB()

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'ГОЛОВНА',
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      title: 'Забули пароль?',
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login',
    },
  },
  {
    path: '/trips',
    name: 'Routes',
    component: Trips,
    meta: {
      title: 'РЕЙСИ',
    },
  },
  {
    path: '/trip/:id/',
    name: 'Route',
    component: Trip,
    meta: {
      title: 'РЕЙС',
    },
  },
  {
    path: '/trip/:id/:point',
    name: 'Point',
    component: Point,
    meta: {
      title: 'ТОЧКА',
    },
  },
  {
    path: '/403',
    name: '403',
    component: forbidden,
    meta: {
      title: 'ДОСТУП ЗАБОРОНЕНО',
    },
  },

  //404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: notFound,
    meta: {
      title: 'Not Found',
    },
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  if (navigator.onLine && to.name != 'Login' && to.name != '403' && to.name != 'ForgotPassword') {
    const appStore = useAppStore()

    try {
      const response = await Pouch.getUserSession()
      appStore.user_name = response.userCtx.name
      if (response.userCtx && response.userCtx.name) {
        console.log('Авторизований', response.userCtx.name)
        const user = await Pouch.getUserData(response.userCtx.name)
        if (user.isActive) {
          appStore.user_id = user.typhoonId
          appStore.userData = user
          next()
        } else {
          next({ name: '403' })
        }
      } else {
        next({ name: 'Login' })
      }
    } catch (error) {
      console.error("Помилка 1", error)
      next({ name: 'Login' })
    }
  } else {
    next()
  }
})

export default router
