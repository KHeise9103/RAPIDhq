<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const projects = ref([])
const users = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadProjects()
})

async function loadProjects() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .in('status', ['Approved', 'In Progress', 'Implemented'])
    .order('created_at', { ascending: false })

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error || userError) {
    errorMessage.value = error?.message || userError?.message
  } else {
    users.value = userData || []

    projects.value = (data || []).map(item => ({
      ...item,
      progress_percent: item.progress_percent ?? 0,
      notify_submitter: false,
      notification_note: '',
      notify_owner: false,
      expanded: false
    }))
  }

  loading.value = false
}

function toggleProject(project) {
  project.expanded = !project.expanded
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

async function updateStatus(project, status) {
  let progress = project.progress_percent || 0

  if (status === 'In Progress') progress = 10
  if (status === 'Implemented') progress = 100

  const { error } = await supabase
    .from('opportunities')
    .update({
      status,
      progress_percent: progress,
      notification_message: `Project status updated to ${status}.`
    })
    .eq('id', project.id)

  if (error) {
    alert(error.message)
    return
  }

  const eventType =
    status === 'In Progress'
      ? 'Project Started'
      : 'Implemented'

  const note = `${project.title || 'Opportunity'} marked as ${status}. Progress set to ${progress}%.`

  await supabase
    .from('opportunity_events')
    .insert([
      {
        opportunity_id: project.id,
        event_type: eventType,
        notes: note
      }
    ])

  await sendNotification({
    to: project.submitter_email,
    subject: `RAPIDhq project update: ${project.title || 'Opportunity'}`,
    opportunityTitle: project.title || 'Opportunity',
    message: `
      Your RAPIDhq opportunity has a project status update.

      New status:
      ${status}

      Progress:
      ${progress}%

      Update:
      ${note}
    `
  })

  await loadProjects()
}

async function archiveProject(project) {
  const confirmed = confirm(
    'Archive this implemented project? It will be removed from active project work but remain available in the archive.'
  )

  if (!confirmed) return

  const { error } = await supabase
    .from('opportunities')
    .update({
      status: 'Archived',
      archived_at: new Date().toISOString()
    })
    .eq('id', project.id)

  if (error) {
    alert(error.message)
    return
  }

  await supabase
    .from('opportunity_events')
    .insert([
      {
        opportunity_id: project.id,
        event_type: 'Archived',
        notes: 'Project archived after implementation.'
      }
    ])

  await loadProjects()
}

async function saveProjectUpdates(project) {
  const selectedOwner = users.value.find(user => user.name === project.owner)

  const note =
    `Owner: ${project.owner || 'Unassigned'}\n` +
    `Project Status: ${project.escalation_status || 'Normal'}\n` +
    `Progress: ${project.progress_percent || 0}%\n\n` +
    (project.project_notes || 'Project updated.')

  const { error } = await supabase
    .from('opportunities')
    .update({
      owner: project.owner,
      project_notes: project.project_notes,
      escalation_status: project.escalation_status,
      progress_percent: project.progress_percent || 0,
      notification_message: project.notify_submitter
        ? project.notification_note || project.project_notes || note
        : null
    })
    .eq('id', project.id)

  if (error) {
    alert(error.message)
    return
  }

  await supabase
    .from('opportunity_events')
    .insert([
      {
        opportunity_id: project.id,
        event_type: 'Project Update',
        notes: note
      }
    ])

  if (project.notify_submitter) {
    await sendNotification({
      to: project.submitter_email,
      subject: `RAPIDhq project update: ${project.title}`,
      opportunityTitle: project.title,
      message:
        project.notification_note ||
        project.project_notes ||
        'Your opportunity has a project update.'
    })
  }

  if (project.notify_owner && selectedOwner?.email) {
    await sendNotification({
      to: selectedOwner.email,
      subject: `RAPIDhq assignment: ${project.title}`,
      opportunityTitle: project.title,
      message: `
        You are currently listed as the owner of this RAPIDhq project.

        Owner:
        ${project.owner || 'Unassigned'}

        Project Status:
        ${project.escalation_status || 'Normal'}

        Progress:
        ${project.progress_percent || 0}%

        Notes:
        ${project.project_notes || 'No project notes provided.'}
      `
    })
  }

  alert('Project updated.')
  await loadProjects()
}

function statusBadge(status) {
  if (status === 'In Progress') return 'badge badge-green'
  if (status === 'Implemented') return 'badge badge-green'
  return 'badge badge-blue'
}

function escalationBadge(status) {
  if (status === 'Escalated') return 'badge badge-orange'
  if (status === 'Blocked') return 'badge badge-orange'
  return 'badge badge-blue'
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Projects"
      subtitle="Move approved opportunities through implementation and track ownership, notes, progress, and escalations."
      @refresh="loadProjects"
    />

    <div v-if="loading" class="card empty-state">
      Loading projects...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <div v-else-if="projects.length === 0" class="card empty-state">
      No approved, active, or implemented projects yet.
    </div>

    <section v-else class="project-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="card project-card"
      >
        <div class="project-header">
          <div class="project-badges">
            <span :class="statusBadge(project.status)">
              {{ project.status }}
            </span>

            <span
              :class="[
                escalationBadge(project.escalation_status),
                project.escalation_status === 'Escalated' ? 'pulse-alert' : ''
              ]"
            >
              {{ project.escalation_status || 'Normal' }}
            </span>
          </div>

          <button class="expand-button" @click="toggleProject(project)">
            {{ project.expanded ? 'Collapse' : 'Expand' }}
          </button>
        </div>

        <router-link
          :to="`/opportunity/${project.id}`"
          class="opportunity-link project-title"
        >
          {{ project.title }}
        </router-link>

        <p class="description">{{ project.description }}</p>

        <div class="compact-summary">
          <div>
            <span>Owner</span>
            <strong>{{ project.owner || 'Unassigned' }}</strong>
          </div>

          <div>
            <span>Progress</span>
            <strong>{{ project.progress_percent || 0 }}%</strong>
          </div>
        </div>

        <div class="progress-section compact-progress">
          <div class="progress-bar">
            <div
              :style="{
                width: (project.progress_percent || 0) + '%'
              }"
            ></div>
          </div>
        </div>

        <div v-if="project.expanded">
          <div class="details">
            <div>
              <span>Department</span>
              <strong>{{ project.department }}</strong>
            </div>

            <div>
              <span>Category</span>
              <strong>{{ project.category }}</strong>
            </div>

            <div>
              <span>Priority</span>
              <strong>{{ project.priority }}</strong>
            </div>

            <div>
              <span>Submitted By</span>
              <strong>{{ project.submitter || 'Unknown' }}</strong>
            </div>
          </div>

          <div v-if="project.expected_impact" class="impact-box">
            <span>Expected Impact</span>
            <p>{{ project.expected_impact }}</p>
          </div>

          <div class="progress-section">
            <div class="progress-label">
              <span>Implementation Progress</span>
              <strong>{{ project.progress_percent || 0 }}%</strong>
            </div>

            <div class="progress-bar">
              <div
                :style="{
                  width: (project.progress_percent || 0) + '%'
                }"
              ></div>
            </div>
          </div>

          <div class="update-section">
            <label>Owner</label>
            <select v-model="project.owner">
              <option value="">Select owner</option>

              <option
                v-for="user in users"
                :key="user.id"
                :value="user.name"
              >
                {{ user.name }} — {{ user.department || 'No department' }}
              </option>
            </select>

            <label class="checkbox-row">
              <input
                type="checkbox"
                v-model="project.notify_owner"
              />
              Notify owner of assignment/update
            </label>

            <label>Project Status</label>
            <select v-model="project.escalation_status">
              <option>Normal</option>
              <option>In Progress</option>
              <option>Escalated</option>
              <option>Blocked</option>
            </select>

            <label>Progress Percent</label>
            <div class="slider-row">
              <input
                v-model.number="project.progress_percent"
                type="range"
                min="0"
                max="100"
                step="5"
              />
              <strong>{{ project.progress_percent || 0 }}%</strong>
            </div>

            <label>Project Notes</label>
            <textarea
              v-model="project.project_notes"
              rows="4"
              placeholder="Add implementation notes, blockers, decisions, or next steps..."
            ></textarea>

            <label class="checkbox-row">
              <input
                type="checkbox"
                v-model="project.notify_submitter"
              />
              Notify submitter of this update
            </label>

            <div v-if="project.notify_submitter" class="notification-box">
              <label>Message to Submitter</label>

              <textarea
                v-model="project.notification_note"
                rows="3"
                placeholder="Optional message to include in the email..."
              ></textarea>
            </div>

            <button class="save-button" @click="saveProjectUpdates(project)">
              Save Updates
            </button>
          </div>

          <div class="actions">
            <button
              v-if="project.status === 'Approved'"
              class="start-button"
              @click="updateStatus(project, 'In Progress')"
            >
              Start Project
            </button>

            <button
              v-if="project.status === 'In Progress'"
              class="complete-button"
              @click="updateStatus(project, 'Implemented')"
            >
              Mark Implemented
            </button>

            <button
              v-if="project.status === 'Implemented'"
              class="archive-button"
              @click="archiveProject(project)"
            >
              Archive Project
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(390px, 1fr));
  gap: 22px;
}

.project-card {
  padding: 24px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.project-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.expand-button {
  border: 1px solid var(--rapid-border);
  background: white;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.project-title {
  display: block;
  font-size: 22px;
  margin-bottom: 10px;
}

.description {
  color: var(--rapid-muted);
  line-height: 1.5;
}

.compact-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--rapid-border);
}

.compact-summary span {
  display: block;
  color: var(--rapid-muted);
  font-size: 13px;
  margin-bottom: 4px;
}

.compact-progress {
  margin-top: 16px;
}

.details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 22px;
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

.progress-section {
  margin-top: 22px;
}

.progress-label,
.slider-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
  color: var(--rapid-muted);
}

.progress-bar {
  height: 10px;
  background: #e8eef5;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar div {
  height: 100%;
  background: var(--rapid-cyan);
  border-radius: 999px;
}

.slider-row input[type='range'] {
  flex: 1;
  padding: 0;
}

.update-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--rapid-border);
  display: grid;
  gap: 10px;
}

.update-section label {
  font-weight: 800;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.checkbox-row input {
  width: auto;
}

.notification-box {
  display: grid;
  gap: 10px;
}

.save-button {
  border: 1px solid var(--rapid-border);
  background: white;
  border-radius: 10px;
  padding: 12px;
  font-weight: 900;
  cursor: pointer;
}

.actions {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.actions button {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 14px;
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.start-button {
  background: var(--rapid-cyan);
}

.complete-button {
  background: var(--rapid-green);
}

.archive-button {
  background: #b42318;
}

.pulse-alert {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

@media (max-width: 1000px) {
  .project-grid,
  .details,
  .compact-summary {
    grid-template-columns: 1fr;
  }
}
</style>