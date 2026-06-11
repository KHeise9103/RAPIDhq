<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const opportunities = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadIntakeQueue()
})

async function loadIntakeQueue() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .in('status', ['Intake', 'In Review'])
    .order('created_at', { ascending: false })

  if (error) {
    errorMessage.value = error.message
  } else {
    opportunities.value = (data || []).map(item => ({
      ...item,
      review_note: item.decision_note || ''
    }))
  }

  loading.value = false
}

async function sendNotification({ to, subject, message, opportunityTitle }) {
  if (!to) return

  const { error } = await supabase.functions.invoke('send-notification', {
    body: {
      to,
      subject,
      message,
      opportunityTitle
    }
  })

  if (error) {
    console.error('Email error:', error)
  }
}

async function saveDecision(opportunity, status) {
  const note = opportunity.review_note || `Opportunity marked as ${status}.`

  const { error } = await supabase
    .from('opportunities')
    .update({
      status,
      decision_note: note,
      notification_message: note
    })
    .eq('id', opportunity.id)

  if (error) {
    alert(error.message)
    return
  }

  await supabase
    .from('opportunity_events')
    .insert([
      {
        opportunity_id: opportunity.id,
        event_type: status,
        notes: note
      }
    ])

  await sendNotification({
    to: opportunity.submitter_email,
    subject: `RAPIDhq update: ${opportunity.title}`,
    opportunityTitle: opportunity.title,
    message: `
      Your RAPIDhq opportunity has been marked as ${status}.

      Decision note:
      ${note}
    `
  })

  await loadIntakeQueue()
}

function badgeClass(status) {
  if (status === 'In Review') return 'badge badge-orange'
  return 'badge badge-blue'
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Intake Queue"
      subtitle="Review opportunities and decide whether they should move forward."
      @refresh="loadIntakeQueue"
    />

    <section class="decision-guide card">
      <h2>Decision Guide</h2>

      <div class="decision-grid">
        <div>
          <strong>Approve</strong>
          <p>The opportunity is actionable and should move into project work.</p>
        </div>

        <div>
          <strong>Defer</strong>
          <p>The idea has merit but timing, resources, or readiness are not right.</p>
        </div>

        <div>
          <strong>Reject</strong>
          <p>The opportunity is duplicate, out of scope, or not actionable.</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="card empty-state">
      Loading intake queue...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <div v-else-if="opportunities.length === 0" class="card empty-state">
      No opportunities awaiting review.
    </div>

    <section v-else class="queue-list">
      <div
        v-for="opportunity in opportunities"
        :key="opportunity.id"
        class="card queue-item"
      >
        <div class="queue-header">
          <div>
            <router-link
              :to="`/opportunity/${opportunity.id}`"
              class="opportunity-link queue-title"
            >
              {{ opportunity.title }}
            </router-link>

            <p class="description">{{ opportunity.description }}</p>
          </div>

          <span :class="badgeClass(opportunity.status)">
            {{ opportunity.status }}
          </span>
        </div>

        <div class="details">
          <div>
            <span>Department</span>
            <strong>{{ opportunity.department }}</strong>
          </div>

          <div>
            <span>Category</span>
            <strong>{{ opportunity.category }}</strong>
          </div>

          <div>
            <span>Priority</span>
            <strong>{{ opportunity.priority }}</strong>
          </div>

          <div>
            <span>Submitted By</span>
            <strong>{{ opportunity.submitter || 'Unknown' }}</strong>
          </div>
        </div>

        <div class="review-section">
          <label>Decision Note / Message to Submitter</label>

          <textarea
            v-model="opportunity.review_note"
            rows="3"
            placeholder="Provide feedback for the submitter..."
          ></textarea>
        </div>

        <div class="actions">
          <button
            class="approve-button"
            @click="saveDecision(opportunity, 'Approved')"
          >
            Approve
          </button>

          <button
            class="defer-button"
            @click="saveDecision(opportunity, 'Deferred')"
          >
            Defer
          </button>

          <button
            class="reject-button"
            @click="saveDecision(opportunity, 'Rejected')"
          >
            Reject
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.decision-guide {
  padding: 22px;
  margin-bottom: 22px;
}

.decision-guide h2 {
  margin-top: 0;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.decision-grid div {
  background: #f8fafc;
  border: 1px solid var(--rapid-border);
  border-radius: 12px;
  padding: 16px;
}

.decision-grid p {
  color: var(--rapid-muted);
  margin-bottom: 0;
}

.queue-list {
  display: grid;
  gap: 20px;
}

.queue-item {
  padding: 24px;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.queue-title {
  font-size: 24px;
}

.description {
  color: var(--rapid-muted);
  margin-top: 8px;
}

.details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--rapid-border);
}

.details span {
  display: block;
  color: var(--rapid-muted);
  font-size: 13px;
  margin-bottom: 4px;
}

.review-section {
  margin-top: 20px;
}

.review-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 800;
}

.review-section textarea {
  width: 100%;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.actions button {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 14px;
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.approve-button {
  background: var(--rapid-green);
}

.defer-button {
  background: var(--rapid-orange);
}

.reject-button {
  background: #b42318;
}

@media (max-width: 1000px) {
  .decision-grid,
  .details {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }
}
</style>