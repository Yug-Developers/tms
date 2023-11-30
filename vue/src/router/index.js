// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Dashboard from '@/pages/Dashboard.vue'
import DashboardDetail from '@/pages/DashboardDetail.vue'
import notFound from '@/pages/404.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Home',
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
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard',
    },
  },
  {
    path: '/dashboard/:id',
    name: 'DashboardDetail',
    component: DashboardDetail,
    meta: {
      title: 'Dashboard Detail',
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

export default router
