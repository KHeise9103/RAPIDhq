<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const opportunities = ref([])
const recentEvents = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadDashboard()
})

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: eventData, error: eventError } = await supabase
    .from('opportunity_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || eventError) {
    errorMessage.value = error?.message || eventError?.message
  } else {
    opportunities.value = data || []
    recentEvents.value = eventData || []
  }

  loading.value = false
}

function countStatus(status) {
  return opportunities.value.filter(item => item.status === status).length
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

function getOpportunityTitle(id) {
  const opportunity = opportunities.value.find(item => item.id === id)
  return opportunity?.title || 'Opportunity'
}

const totalSubmitted = computed(() => opportunities.value.length)
const intakeCount = computed(() => countStatus('Intake'))
const reviewCount = computed(() => countStatus('In Review'))
const implementedCount = computed(() => countStatus('Implemented'))

const recentOpportunities = computed(() => {
  return opportunities.value.slice(0, 5)
})

const groupedActivity = computed(() => {
  const groups = []

  recentEvents.value.forEach(event => {
    let group = groups.find(item => item.opportunity_id === event.opportunity_id)

    if (!group) {
      group = {
        opportunity_id: event.opportunity_id,
        title: getOpportunityTitle(event.opportunity_id),
        events: []
      }

      groups.push(group)
    }

    group.events.push(event)
  })

  return groups.slice(0, 5)
})

function badgeClass(status) {
  if (status === 'In Review') return 'badge badge-orange'
  if (status === 'In Progress') return 'badge badge-green'
  if (status === 'Implemented') return 'badge badge-green'
  if (status === 'Approved') return 'badge badge-blue'
  if (status === 'Deferred') return 'badge badge-orange'
  if (status === 'Rejected') return 'badge badge-orange'
  return 'badge badge-blue'
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Dashboard"
      subtitle="Welcome to RAPIDhq. Here's what is happening with improvement today."
      @refresh="loadDashboard"
    />

    <div v-if="loading" class="card empty-state">
      Loading dashboard...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <template v-else>
      <section class="stats-grid">
        <router-link to="/opportunities" class="stat-card-link">
          <div class="card stat-card">
            <span>Total Opportunities</span>
            <strong>{{ totalSubmitted }}</strong>
          </div>
        </router-link>

        <router-link to="/intake-queue" class="stat-card-link">
          <div class="card stat-card">
            <span>Intake</span>
            <strong>{{ intakeCount }}</strong>
          </div>
        </router-link>

        <router-link to="/intake-queue" class="stat-card-link">
          <div class="card stat-card">
            <span>In Review</span>
            <strong>{{ reviewCount }}</strong>
          </div>
        </router-link>

        <router-link to="/analytics" class="stat-card-link">
          <div class="card stat-card">
            <span>Implemented</span>
            <strong>{{ implementedCount }}</strong>
          </div>
        </router-link>
      </section>

      <section class="content-grid">
        <div class="card panel">
          <div class="panel-header">
            <h2>Recent Opportunities</h2>
            <router-link to="/opportunities">View All</router-link>
          </div>

          <div
            v-for="opportunity in recentOpportunities"
            :key="opportunity.id"
            class="opportunity-row"
          >
            <div>
              <router-link
                :to="`/opportunity/${opportunity.id}`"
                class="opportunity-link"
              >
                {{ opportunity.title }}
              </router-link>

              <p>{{ opportunity.department }} • {{ opportunity.category }}</p>
            </div>

            <span :class="badgeClass(opportunity.status)">
              {{ opportunity.status }}
            </span>
          </div>

          <p v-if="recentOpportunities.length === 0" class="muted">
            No opportunities submitted yet.
          </p>
        </div>

        <div class="card panel">
          <h2>Recent Activity</h2>

          <div
            v-for="group in groupedActivity"
            :key="group.opportunity_id"
            class="activity-group"
          >
            <router-link
              :to="`/opportunity/${group.opportunity_id}`"
              class="opportunity-link activity-title"
            >
              {{ group.title }}
            </router-link>

            <div
              v-for="event in group.events"
              :key="event.id"
              class="activity-event"
            >
              <div class="activity-dot"></div>

              <div>
                <p class="activity-type">
                  {{ event.event_type }}
                </p>

                <p>{{ event.notes || 'No notes provided.' }}</p>

                <small>{{ formatDate(event.created_at) }}</small>
              </div>
            </div>
          </div>

          <p v-if="groupedActivity.length === 0" class="muted">
            No activity recorded yet.
          </p>
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

.stat-card {
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
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.panel {
  padding: 24px;
}

.panel h2 {
  margin-top: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header a {
  color: var(--rapid-cyan);
  font-weight: 800;
  text-decoration: none;
}

.opportunity-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--rapid-border);
}

.opportunity-row p {
  margin: 4px 0 0;
  color: var(--rapid-muted);
  font-size: 13px;
}

.activity-group {
  padding: 16px 0;
  border-bottom: 1px solid var(--rapid-border);
}

.activity-group:last-child {
  border-bottom: none;
}

.activity-title {
  display: block;
  margin-bottom: 10px;
}

.activity-event {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 12px;
  padding: 8px 0;
}

.activity-dot {
  width: 10px;
  height: 10px;
  background: var(--rapid-cyan);
  border-radius: 50%;
  margin-top: 6px;
}

.activity-type {
  margin: 0 0 4px;
  color: var(--rapid-text);
  font-size: 13px;
  font-weight: 800;
}

.activity-event p {
  margin: 5px 0;
  color: var(--rapid-muted);
  font-size: 13px;
  line-height: 1.4;
}

.activity-event small {
  color: var(--rapid-muted);
  font-size: 12px;
}

@media (max-width: 1000px) {
  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>