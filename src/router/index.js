import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue'
import Opportunities from '../views/Opportunities.vue'
import IntakeQueue from '../views/IntakeQueue.vue'
import ReviewBoard from '../views/ReviewBoard.vue'
import Projects from '../views/Projects.vue'
import Metrics from '../views/Metrics.vue'
import Reports from '../views/Reports.vue'
import Administration from '../views/Administration.vue'
import SubmitOpportunity from '../views/SubmitOpportunity.vue'
import OpportunityDetail from '../views/OpportunityDetail.vue'
import TestConnection from '../views/TestConnection.vue'
import Analytics from '../views/Analytics.vue'

const routes = [
  {
    path: '/',
    component: Dashboard
  },

  {
    path: '/opportunities',
    component: Opportunities
  },

  {
    path: '/intake-queue',
    component: IntakeQueue
  },

  {
    path: '/review-board',
    component: ReviewBoard
  },

  {
    path: '/projects',
    component: Projects
  },

  {
    path: '/metrics',
    component: Metrics
  },

  {
    path: '/reports',
    component: Reports
  },

  {
    path: '/administration',
    component: Administration
  },

  {
    path: '/submit-opportunity',
    component: SubmitOpportunity
  },

  {
    path: '/opportunity/:id',
    component: OpportunityDetail
  },

  {
    path: '/test',
    component: TestConnection
  },
  
  {
  path: '/analytics',
  component: Analytics
}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router