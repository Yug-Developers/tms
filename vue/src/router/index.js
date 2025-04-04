// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import Home from '@/pages/Home.vue'
import NetLogin from '@/pages/NetLogin.vue'
import Trip from '@/pages/Trip.vue'
import Trips from '@/pages/Trips.vue'
import Point from '@/pages/Point.vue'
import notFound from '@/pages/404.vue'
import forbidden from '@/pages/403.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'

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
    component: NetLogin,
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
  const appStore = useAppStore()
  if (navigator.onLine && !appStore.offline && to.name != 'Login' && to.name != '403' && to.name != 'ForgotPassword') {
    try {
      if (appStore.localStg.token) {
        await appStore.touch()
      }
      if (appStore.localStg.userData?.isActive) {
        next()
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
