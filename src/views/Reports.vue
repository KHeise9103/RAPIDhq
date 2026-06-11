<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../services/supabase'

const opportunities = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadReports()
})

async function loadReports() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })

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

const activeWork = computed(() => {
  return intakeCount.value + reviewCount.value + approvedCount.value + inProgressCount.value
})

const implementationRate = computed(() => {
  if (totalSubmitted.value === 0) return '0%'
  return Math.round((implementedCount.value / totalSubmitted.value) * 100) + '%'
})

const recentImplemented = computed(() => {
  return opportunities.value
    .filter(item => item.status === 'Implemented')
    .slice(0, 5)
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Reports</h1>
        <p>View live improvement activity and workflow summary reports.</p>
      </div>

      <button class="refresh-button" @click="loadReports">
        Refresh
      </button>
    </header>

    <div v-if="loading" class="card empty-state">
      Loading reports...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <template v-else>
      <section class="report-grid">
        <div class="card report-card">
          <h3>Monthly Impact Summary</h3>
          <p>Total submitted opportunities and implementation progress.</p>

          <div class="report-number">{{ totalSubmitted }}</div>
          <span>Total Submitted</span>
        </div>

        <div class="card report-card">
          <h3>Implementation Report</h3>
          <p>Opportunities that have moved through implementation.</p>

          <div class="report-number">{{ implementedCount }}</div>
          <span>Implemented</span>
        </div>

        <div class="card report-card">
          <h3>Active Work Report</h3>
          <p>Items currently in intake, review, approval, or implementation.</p>

          <div class="report-number">{{ activeWork }}</div>
          <span>Active Items</span>
        </div>

        <div class="card report-card">
          <h3>Escalation Report</h3>
          <p>Projects that need leadership attention or intervention.</p>

          <div class="report-number warning">{{ escalatedCount }}</div>
          <span>Escalated</span>
        </div>
      </section>

      <section class="content-grid">
        <div class="card panel">
          <h2>Workflow Report</h2>

          <div class="report-row">
            <span>Intake</span>
            <strong>{{ intakeCount }}</strong>
          </div>

          <div class="report-row">
            <span>In Review</span>
            <strong>{{ reviewCount }}</strong>
          </div>

          <div class="report-row">
            <span>Approved</span>
            <strong>{{ approvedCount }}</strong>
          </div>

          <div class="report-row">
            <span>In Progress</span>
            <strong>{{ inProgressCount }}</strong>
          </div>

          <div class="report-row">
            <span>Implemented</span>
            <strong>{{ implementedCount }}</strong>
          </div>

          <div class="report-row">
            <span>Deferred</span>
            <strong>{{ deferredCount }}</strong>
          </div>

          <div class="report-row">
            <span>Rejected</span>
            <strong>{{ rejectedCount }}</strong>
          </div>
        </div>

        <div class="card panel">
          <h2>Executive Summary</h2>

          <div class="summary-block">
            <span>Implementation Rate</span>
            <strong>{{ implementationRate }}</strong>
          </div>

          <div class="summary-block">
            <span>Open Queue</span>
            <strong>{{ intakeCount + reviewCount }}</strong>
          </div>

          <div class="summary-block">
            <span>Needs Attention</span>
            <strong>{{ escalatedCount }}</strong>
          </div>

          <div class="summary-block">
            <span>Closed Without Action</span>
            <strong>{{ deferredCount + rejectedCount }}</strong>
          </div>
        </div>
      </section>

      <section class="card table-card">
        <h2>Recently Implemented</h2>

        <div v-if="recentImplemented.length === 0" class="muted">
          No implemented opportunities yet.
        </div>

        <div
          v-for="item in recentImplemented"
          :key="item.id"
          class="implemented-row"
        >
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.department }} • {{ item.category }}</p>
          </div>

          <span class="badge badge-green">Implemented</span>
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

.report-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.report-card {
  padding: 24px;
}

.report-card h3 {
  margin-top: 0;
  margin-bottom: 8px;
}

.report-card p {
  color: var(--rapid-muted);
  line-height: 1.5;
  min-height: 68px;
}

.report-number {
  font-size: 38px;
  font-weight: 900;
  color: var(--rapid-text);
}

.report-number.warning {
  color: var(--rapid-orange);
}

.report-card span {
  color: var(--rapid-muted);
  font-weight: 800;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.2fr .8fr;
  gap: 22px;
  margin-bottom: 24px;
}

.panel,
.table-card {
  padding: 24px;
}

.panel h2,
.table-card h2 {
  margin-top: 0;
}

.report-row,
.summary-block,
.implemented-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 0;
  border-bottom: 1px solid var(--rapid-border);
}

.report-row:last-child,
.summary-block:last-child,
.implemented-row:last-child {
  border-bottom: none;
}

.report-row span,
.summary-block span {
  color: var(--rapid-muted);
}

.report-row strong,
.summary-block strong {
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

.empty-state {
  padding: 28px;
  color: var(--rapid-muted);
  font-weight: 700;
}

.error {
  color: #b42318;
}

.muted {
  color: var(--rapid-muted);
  font-weight: 700;
}

@media (max-width: 1100px) {
  .report-grid,
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .report-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>