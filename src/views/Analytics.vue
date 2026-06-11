<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const opportunities = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadAnalytics()
})

async function loadAnalytics() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    errorMessage.value = error.message
  } else {
    opportunities.value = data || []
  }

  loading.value = false
}

function countStatus(status) {
  return opportunities.value.filter(item => item.status === status).length
}

const total = computed(() => opportunities.value.length)
const intake = computed(() => countStatus('Intake'))
const approved = computed(() => countStatus('Approved'))
const inProgress = computed(() => countStatus('In Progress'))
const implemented = computed(() => countStatus('Implemented'))
const deferred = computed(() => countStatus('Deferred'))
const rejected = computed(() => countStatus('Rejected'))
const archived = computed(() => countStatus('Archived'))

const escalated = computed(() => {
  return opportunities.value.filter(
    item => item.escalation_status === 'Escalated'
  ).length
})

const implementationRate = computed(() => {
  if (total.value === 0) return '0%'
  return Math.round((implemented.value / total.value) * 100) + '%'
})

const activeProjects = computed(() => {
  return approved.value + inProgress.value
})

const activeOpportunities = computed(() => {
  return opportunities.value.filter(item => item.status !== 'Archived').length
})

const recentlyImplemented = computed(() => {
  return opportunities.value
    .filter(item => item.status === 'Implemented')
    .slice(0, 5)
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="Analytics"
      subtitle="Measure RAPIDhq workflow performance, project activity, and improvement outcomes."
      @refresh="loadAnalytics"
    />

    <div v-if="loading" class="card empty-state">
      Loading analytics...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <template v-else>
      <section class="stats-grid">
        <div class="card stat-card">
          <span>Total Opportunities</span>
          <strong>{{ total }}</strong>
        </div>

        <div class="card stat-card">
          <span>Active Opportunities</span>
          <strong>{{ activeOpportunities }}</strong>
        </div>

        <div class="card stat-card">
          <span>Active Projects</span>
          <strong>{{ activeProjects }}</strong>
        </div>

        <div class="card stat-card">
          <span>Implementation Rate</span>
          <strong>{{ implementationRate }}</strong>
        </div>
      </section>

      <section class="content-grid">
        <div class="card panel">
          <h2>Workflow Status</h2>

          <div class="metric-row">
            <span>Intake</span>
            <strong>{{ intake }}</strong>
          </div>

          <div class="metric-row">
            <span>Approved</span>
            <strong>{{ approved }}</strong>
          </div>

          <div class="metric-row">
            <span>In Progress</span>
            <strong>{{ inProgress }}</strong>
          </div>

          <div class="metric-row">
            <span>Implemented</span>
            <strong>{{ implemented }}</strong>
          </div>

          <div class="metric-row">
            <span>Archived</span>
            <strong>{{ archived }}</strong>
          </div>
        </div>

        <div class="card panel">
          <h2>Needs Attention</h2>

          <div class="metric-row">
            <span>Escalated</span>
            <strong>{{ escalated }}</strong>
          </div>

          <div class="metric-row">
            <span>Deferred</span>
            <strong>{{ deferred }}</strong>
          </div>

          <div class="metric-row">
            <span>Rejected</span>
            <strong>{{ rejected }}</strong>
          </div>
        </div>
      </section>

      <section class="card panel">
        <h2>Recently Implemented</h2>

        <p v-if="recentlyImplemented.length === 0" class="muted">
          No implemented opportunities yet.
        </p>

        <div
          v-for="item in recentlyImplemented"
          :key="item.id"
          class="implemented-row"
        >
          <div>
            <router-link
              :to="`/opportunity/${item.id}`"
              class="opportunity-link"
            >
              {{ item.title }}
            </router-link>

            <p>{{ item.department }} • {{ item.category }}</p>
          </div>

          <span class="badge badge-green">
            Implemented
          </span>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card,
.panel {
  padding: 24px;
}

.stat-card span {
  color: var(--rapid-muted);
  font-weight: 700;
}

.stat-card strong {
  display: block;
  font-size: 34px;
  margin-top: 8px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin-bottom: 24px;
}

.panel h2 {
  margin-top: 0;
}

.metric-row,
.implemented-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 0;
  border-bottom: 1px solid var(--rapid-border);
}

.metric-row:last-child,
.implemented-row:last-child {
  border-bottom: none;
}

.metric-row strong {
  color: var(--rapid-orange);
  font-size: 22px;
}

.implemented-row {
  align-items: center;
}

.implemented-row p {
  margin: 4px 0 0;
  color: var(--rapid-muted);
  font-size: 13px;
}

@media (max-width: 1000px) {
  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>