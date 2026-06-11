<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'

const opportunities = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadReviewItems()
})

async function loadReviewItems() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'In Review')
    .order('created_at', { ascending: false })

  if (error) {
    errorMessage.value = error.message
  } else {
    opportunities.value = data
  }

  loading.value = false
}

async function updateStatus(id, status) {
  const { error } = await supabase
    .from('opportunities')
    .update({ status })
    .eq('id', id)

  if (error) {
    alert(error.message)
    return
  }

  await loadReviewItems()
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Review Board</h1>
        <p>
          Evaluate opportunities and decide what should move forward.
        </p>
      </div>

      <button class="refresh-button" @click="loadReviewItems">
        Refresh
      </button>
    </header>

    <div v-if="loading" class="card empty-state">
      Loading review items...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <div v-else-if="opportunities.length === 0" class="card empty-state">
      No opportunities are currently in review.
    </div>

    <section v-else class="review-grid">
      <div
        v-for="opportunity in opportunities"
        :key="opportunity.id"
        class="card review-card"
      >
        <div class="review-card-header">
          <span class="badge badge-orange">
            In Review
          </span>

          <strong>
            {{ opportunity.priority }}
          </strong>
        </div>

        <router-link
          :to="`/opportunity/${opportunity.id}`"
          class="opportunity-link detail-title"
        >
          {{ opportunity.title }}
        </router-link>

        <p class="description">
          {{ opportunity.description }}
        </p>

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
            <span>Submitted By</span>
            <strong>
              {{ opportunity.submitter || 'Unknown' }}
            </strong>
          </div>
        </div>

        <div
          v-if="opportunity.expected_impact"
          class="impact-box"
        >
          <span>Expected Impact</span>

          <p>
            {{ opportunity.expected_impact }}
          </p>
        </div>

        <div class="actions">
          <button
            class="approve-button"
            @click="updateStatus(opportunity.id, 'Approved')"
          >
            Approve
          </button>

          <button
            class="defer-button"
            @click="updateStatus(opportunity.id, 'Deferred')"
          >
            Defer
          </button>

          <button
            class="reject-button"
            @click="updateStatus(opportunity.id, 'Rejected')"
          >
            Reject
          </button>
        </div>
      </div>
    </section>
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

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 22px;
}

.review-card {
  padding: 24px;
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.opportunity-link {
  color: var(--rapid-text);
  text-decoration: none;
  font-weight: 900;
}

.opportunity-link:hover {
  color: var(--rapid-cyan);
}

.detail-title {
  display: block;
  font-size: 28px;
  margin-bottom: 12px;
}

.description {
  color: var(--rapid-muted);
  line-height: 1.5;
}

.details {
  display: grid;
  gap: 12px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--rapid-border);
}

.details span,
.impact-box span {
  display: block;
  color: var(--rapid-muted);
  font-size: 13px;
  margin-bottom: 4px;
}

.impact-box {
  margin-top: 18px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.impact-box p {
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.actions button {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 12px;
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

.empty-state {
  padding: 28px;
  color: var(--rapid-muted);
  font-weight: 700;
}

.error {
  color: #b42318;
}
</style>