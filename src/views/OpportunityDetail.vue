<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const route = useRoute()
const router = useRouter()

const opportunity = ref(null)
const events = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadOpportunity()
})

async function loadOpportunity() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error) {
    errorMessage.value = error.message
    loading.value = false
    return
  }

  opportunity.value = data

  const { data: eventData } = await supabase
    .from('opportunity_events')
    .select('*')
    .eq('opportunity_id', route.params.id)
    .order('created_at', { ascending: false })

  events.value = eventData || []

  loading.value = false
}

async function archiveOpportunity() {
  const confirmed = confirm(
    'Archive this opportunity? It will be removed from the active Opportunities list but remain available in Analytics and history.'
  )

  if (!confirmed) return

  const { error } = await supabase
    .from('opportunities')
    .update({
      status: 'Archived',
      archived_at: new Date().toISOString()
    })
    .eq('id', opportunity.value.id)

  if (error) {
    alert(error.message)
    return
  }

  await supabase
    .from('opportunity_events')
    .insert([
      {
        opportunity_id: opportunity.value.id,
        event_type: 'Archived',
        notes: 'Opportunity archived.'
      }
    ])

  router.push('/opportunities')
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

function badgeClass(status) {
  if (status === 'Approved') return 'badge badge-blue'
  if (status === 'In Progress') return 'badge badge-green'
  if (status === 'Implemented') return 'badge badge-green'
  if (status === 'Deferred') return 'badge badge-orange'
  if (status === 'Rejected') return 'badge badge-orange'
  if (status === 'Archived') return 'badge badge-orange'

  return 'badge badge-blue'
}
</script>

<template>
  <div class="page">
    <div v-if="loading" class="card empty-state">
      Loading opportunity...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <template v-else-if="opportunity">
      <div class="detail-header">
        <div>
          <router-link to="/opportunities" class="back-link">
            ← Back to Opportunities
          </router-link>

          <h1>{{ opportunity.title }}</h1>

          <p>
            {{ opportunity.department }} • {{ opportunity.category }}
          </p>
        </div>

        <div class="header-actions">
          <span :class="badgeClass(opportunity.status)">
            {{ opportunity.status }}
          </span>

          <button
            v-if="opportunity.status !== 'Archived'"
            class="archive-button"
            @click="archiveOpportunity"
          >
            Archive
          </button>
        </div>
      </div>

      <section class="detail-grid">
        <div class="card section">
          <h2>Submission Details</h2>

          <div class="detail-row">
            <span>Description</span>
            <p>{{ opportunity.description }}</p>
          </div>

          <div class="detail-row">
            <span>Expected Impact</span>
            <p>{{ opportunity.expected_impact || 'No expected impact provided.' }}</p>
          </div>

          <div class="info-grid">
            <div>
              <span>Priority</span>
              <strong>{{ opportunity.priority }}</strong>
            </div>

            <div>
              <span>Submitted By</span>
              <strong>{{ opportunity.submitter || 'Unknown' }}</strong>
            </div>

            <div>
              <span>Submitter Email</span>
              <strong>{{ opportunity.submitter_email || 'Not provided' }}</strong>
            </div>

            <div>
              <span>Owner</span>
              <strong>{{ opportunity.owner || 'Unassigned' }}</strong>
            </div>

            <div>
              <span>Submitted</span>
              <strong>{{ formatDate(opportunity.created_at) }}</strong>
            </div>

            <div v-if="opportunity.archived_at">
              <span>Archived</span>
              <strong>{{ formatDate(opportunity.archived_at) }}</strong>
            </div>
          </div>
        </div>

        <div class="card section">
          <h2>Workflow Notes</h2>

          <div class="note-block">
            <span>Decision Note</span>
            <p>{{ opportunity.decision_note || 'No decision note yet.' }}</p>
          </div>

          <div class="note-block">
            <span>Project Status</span>
            <p>{{ opportunity.escalation_status || 'Normal' }}</p>
          </div>

          <div class="note-block">
            <span>Project Notes</span>
            <p>{{ opportunity.project_notes || 'No project notes yet.' }}</p>
          </div>
        </div>
      </section>

      <section class="card section">
        <h2>Activity Timeline</h2>

        <div
          v-for="event in events"
          :key="event.id"
          class="timeline-item"
        >
          <div class="timeline-dot"></div>

          <div>
            <strong>{{ event.event_type }}</strong>
            <p>{{ event.notes }}</p>
            <small>{{ formatDate(event.created_at) }}</small>
          </div>
        </div>

        <div v-if="events.length === 0">
          No activity recorded yet.
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.archive-button {
  border: none;
  background: #b42318;
  color: white;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 800;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 22px;
  margin-bottom: 22px;
}

.section {
  padding: 24px;
}

.detail-row {
  margin-bottom: 22px;
}

.detail-row span,
.info-grid span,
.note-block span {
  display: block;
  color: var(--rapid-muted);
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 6px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.note-block {
  padding: 16px 0;
  border-bottom: 1px solid var(--rapid-border);
}

.timeline-item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid var(--rapid-border);
}

.timeline-dot {
  width: 12px;
  height: 12px;
  background: var(--rapid-cyan);
  border-radius: 50%;
  margin-top: 5px;
}

@media (max-width: 1000px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>