<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../services/supabase'

const opportunities = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadMetrics()
})

async function loadMetrics() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')

  if (error) {
    errorMessage.value = error.message
  } else {
    opportunities.value = data
  }

  loading.value = false
}

function countStatus(status) {
  return opportunities.value.filter(item => item.status === status).length
}

const totalSubmitted = computed(() => opportunities.value.length)
const intakeCount = computed(() => countStatus('Intake'))
const reviewCount = computed(() => countStatus('In Review'))
const approvedCount = computed(() => countStatus('Approved'))
const inProgressCount = computed(() => countStatus('In Progress'))
const implementedCount = computed(() => countStatus('Implemented'))
const deferredCount = computed(() => countStatus('Deferred'))
const rejectedCount = computed(() => countStatus('Rejected'))

const escalatedCount = computed(() => {
  return opportunities.value.filter(
    item => item.escalation_status === 'Escalated'
  ).length
})

const implementationRate = computed(() => {
  if (totalSubmitted.value === 0) return '0%'
  return Math.round((implementedCount.value / totalSubmitted.value) * 100) + '%'
})

const activeProjects = computed(() => {
  return approvedCount.value + inProgressCount.value
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Metrics</h1>
        <p>Track live RAPIDhq workflow activity from Supabase.</p>
      </div>

      <button class="refresh-button" @click="loadMetrics">
        Refresh
      </button>
    </header>

    <div v-if="loading" class="card empty-state">
      Loading metrics...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <template v-else>
      <section class="stats-grid">
        <div class="card metric-card">
          <span>Total Submitted</span>
          <strong>{{ totalSubmitted }}</strong>
        </div>

        <div class="card metric-card">
          <span>Intake</span>
          <strong>{{ intakeCount }}</strong>
        </div>

        <div class="card metric-card">
          <span>In Review</span>
          <strong>{{ reviewCount }}</strong>
        </div>

        <div class="card metric-card">
          <span>Implemented</span>
          <strong>{{ implementedCount }}</strong>
        </div>
      </section>

      <section class="content-grid">
        <div class="card panel">
          <h2>Status Breakdown</h2>

          <div class="metric-row">
            <span>Approved</span>
            <strong>{{ approvedCount }}</strong>
          </div>

          <div class="metric-row">
            <span>In Progress</span>
            <strong>{{ inProgressCount }}</strong>
          </div>

          <div class="metric-row">
            <span>Deferred</span>
            <strong>{{ deferredCount }}</strong>
          </div>

          <div class="metric-row">
            <span>Rejected</span>
            <strong>{{ rejectedCount }}</strong>
          </div>

          <div class="metric-row">
            <span>Escalated</span>
            <strong>{{ escalatedCount }}</strong>
          </div>
        </div>

        <div class="card panel">
          <h2>Workflow Health</h2>

          <div class="metric-row">
            <span>Active Projects</span>
            <strong>{{ activeProjects }}</strong>
          </div>

          <div class="metric-row">
            <span>Implementation Rate</span>
            <strong>{{ implementationRate }}</strong>
          </div>

          <div class="metric-row">
            <span>Open Queue</span>
            <strong>{{ intakeCount + reviewCount }}</strong>
          </div>

          <div class="metric-row">
            <span>Needs Attention</span>
            <strong>{{ escalatedCount }}</strong>
          </div>
        </div>

        <div class="card panel full-width">
          <h2>Implementation Funnel</h2>

          <div class="funnel">
            <div class="funnel-row">
              <span>Submitted</span>
              <div class="bar">
                <div :style="{ width: '100%' }"></div>
              </div>
              <strong>{{ totalSubmitted }}</strong>
            </div>

            <div class="funnel-row">
              <span>Reviewed</span>
              <div class="bar">
                <div :style="{ width: totalSubmitted ? ((reviewCount + approvedCount + inProgressCount + implementedCount) / totalSubmitted * 100) + '%' : '0%' }"></div>
              </div>
              <strong>{{ reviewCount + approvedCount + inProgressCount + implementedCount }}</strong>
            </div>

            <div class="funnel-row">
              <span>Approved</span>
              <div class="bar">
                <div :style="{ width: totalSubmitted ? ((approvedCount + inProgressCount + implementedCount) / totalSubmitted * 100) + '%' : '0%' }"></div>
              </div>
              <strong>{{ approvedCount + inProgressCount + implementedCount }}</strong>
            </div>

            <div class="funnel-row">
              <span>Implemented</span>
              <div class="bar">
                <div :style="{ width: totalSubmitted ? (implementedCount / totalSubmitted * 100) + '%' : '0%' }"></div>
              </div>
              <strong>{{ implementedCount }}</strong>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  padding: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0;
  font-size: 36px;
}

.page-header p {
  margin-top: 8px;
  color: var(--rapid-muted);
}

.refresh-button {
  border: 1px solid var(--rapid-border);
  background: white;
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 800;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 24px;
}

.metric-card span {
  color: var(--rapid-muted);
  font-weight: 700;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  font-size: 34px;
  color: var(--rapid-text);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.panel {
  padding: 24px;
}

.panel h2 {
  margin-top: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--rapid-border);
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-row span {
  color: var(--rapid-muted);
}

.metric-row strong {
  color: var(--rapid-orange);
  font-size: 22px;
}

.funnel {
  display: grid;
  gap: 16px;
}

.funnel-row {
  display: grid;
  grid-template-columns: 140px 1fr 60px;
  gap: 16px;
  align-items: center;
}

.funnel-row span {
  color: var(--rapid-muted);
  font-weight: 800;
}

.bar {
  height: 14px;
  background: #e8eef5;
  border-radius: 999px;
  overflow: hidden;
}

.bar div {
  height: 100%;
  background: var(--rapid-cyan);
  border-radius: 999px;
}

.empty-state {
  padding: 28px;
  color: var(--rapid-muted);
  font-weight: 700;
}

.error {
  color: #b42318;
}

@media (max-width: 1000px) {
  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}
</style>