import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import DashboardHome from '../views/DashboardHome.vue';
import ServerDetail from '../views/ServerDetail.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'DashboardHome',
    component: DashboardHome
  },
  {
    path: '/server/:id',
    name: 'ServerDetail',
    component: ServerDetail,
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
