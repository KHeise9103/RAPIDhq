<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const submitted = ref(false)
const errorMessage = ref('')
const users = ref([])

const form = ref({
  title: '',
  description: '',
  department: 'Operations',
  category: 'Process Improvement',
  submitter_user_id: '',
  submitter: '',
  submitter_email: '',
  priority: 'Medium',
  impact: ''
})

onMounted(async () => {
  await loadUsers()
})

async function loadUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    errorMessage.value = error.message
    return
  }

  users.value = data || []
}

function selectSubmitter() {
  const selectedUser = users.value.find(
    user => user.id === Number(form.value.submitter_user_id)
  )

  if (!selectedUser) return

  form.value.submitter = selectedUser.name
  form.value.submitter_email = selectedUser.email
  form.value.department = selectedUser.department || form.value.department
}

async function submitOpportunity() {
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .insert([
      {
        title: form.value.title,
        description: form.value.description,
        department: form.value.department,
        category: form.value.category,
        priority: form.value.priority,
        submitter_user_id: form.value.submitter_user_id || null,
        submitter: form.value.submitter,
        submitter_email: form.value.submitter_email,
        expected_impact: form.value.impact,
        status: 'Intake'
      }
    ])
    .select()
    .single()

  if (error) {
    errorMessage.value = error.message
    return
  }

  await supabase
    .from('opportunity_events')
    .insert([
      {
        opportunity_id: data.id,
        event_type: 'Submitted',
        notes: `${form.value.submitter || 'Someone'} submitted this opportunity.`
      }
    ])

  submitted.value = true
  resetForm()
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
    department: 'Operations',
    category: 'Process Improvement',
    submitter_user_id: '',
    submitter: '',
    submitter_email: '',
    priority: 'Medium',
    impact: ''
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Submit Opportunity"
      subtitle="Capture a new improvement opportunity."
      :show-refresh="false"
    />

    <form class="card form-card" @submit.prevent="submitOpportunity">
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Opportunity Title</label>
          <input v-model="form.title" required placeholder="Enter a short title" />
        </div>

        <div class="form-group full-width">
          <label>Description</label>
          <textarea
            v-model="form.description"
            required
            rows="5"
            placeholder="Describe the opportunity"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Submitted By</label>
          <select
            v-model="form.submitter_user_id"
            @change="selectSubmitter"
          >
            <option value="">Manual entry</option>
            <option
              v-for="user in users"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }} — {{ user.department || 'No department' }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Submitter Name</label>
          <input v-model="form.submitter" placeholder="Your name" />
        </div>

        <div class="form-group">
          <label>Submitter Email</label>
          <input
            v-model="form.submitter_email"
            type="email"
            placeholder="name@example.com"
          />
        </div>

        <div class="form-group">
          <label>Department</label>
          <input
            v-model="form.department"
            placeholder="Department"
          />
        </div>

        <div class="form-group">
          <label>Category</label>
          <select v-model="form.category">
            <option>Process Improvement</option>
            <option>Technology</option>
            <option>Quality</option>
            <option>Safety</option>
            <option>Work Environment</option>
            <option>Employee Experience</option>
            <option>Patient Experience</option>
            <option>Cost Reduction</option>
          </select>
        </div>

        <div class="form-group">
          <label>Priority</label>
          <select v-model="form.priority">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label>Expected Impact</label>
          <textarea
            v-model="form.impact"
            rows="4"
            placeholder="What improvement do you expect?"
          ></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="secondary-btn" @click="resetForm">
          Clear
        </button>

        <button type="submit" class="btn-primary">
          Submit Opportunity
        </button>
      </div>
    </form>

    <div v-if="submitted" class="card success-card">
      <h3>Opportunity Submitted</h3>
      <p>Your opportunity has been captured and added to the Intake Queue.</p>
    </div>

    <div v-if="errorMessage" class="card error-card">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.form-card {
  padding: 32px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: 1 / -1;
}

label {
  margin-bottom: 8px;
  font-weight: 700;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.success-card,
.error-card {
  margin-top: 20px;
  padding: 24px;
}

.success-card {
  border-left: 6px solid var(--rapid-green);
}

.success-card h3 {
  margin-top: 0;
  color: var(--rapid-green);
}

.error-card {
  border-left: 6px solid #b42318;
  color: #b42318;
  font-weight: 700;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>