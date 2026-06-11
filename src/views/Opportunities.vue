<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const opportunities = ref([])
const loading = ref(true)
const errorMessage = ref('')
const searchTerm = ref('')
const viewMode = ref('active')

onMounted(async () => {
  await loadOpportunities()
})

async function loadOpportunities() {
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

const filteredOpportunities = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()

  return opportunities.value.filter(item => {
    const isArchived = item.status === 'Archived'

    if (viewMode.value === 'active' && isArchived) return false
    if (viewMode.value === 'archived' && !isArchived) return false

    if (!term) return true

    return (
      item.title?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.department?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.priority?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term) ||
      item.submitter?.toLowerCase().includes(term) ||
      item.owner?.toLowerCase().includes(term)
    )
  })
})

function badgeClass(status) {
  if (status === 'In Review') return 'badge badge-orange'
  if (status === 'In Progress') return 'badge badge-green'
  if (status === 'Approved') return 'badge badge-blue'
  if (status === 'Implemented') return 'badge badge-green'
  if (status === 'Deferred') return 'badge badge-orange'
  if (status === 'Rejected') return 'badge badge-orange'
  if (status === 'Archived') return 'badge badge-orange'

  return 'badge badge-blue'
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Opportunities"
      subtitle="View, manage, and track submitted improvement opportunities."
      @refresh="loadOpportunities"
    />

    <section class="toolbar card">
      <div class="view-toggle">
        <button
          :class="{ active: viewMode === 'active' }"
          @click="viewMode = 'active'"
        >
          Active
        </button>

        <button
          :class="{ active: viewMode === 'archived' }"
          @click="viewMode = 'archived'"
        >
          Archived
        </button>
      </div>

      <input
        v-model="searchTerm"
        class="search-input"
        placeholder="Search opportunities..."
      />
    </section>

    <div v-if="loading" class="card empty-state">
      Loading opportunities...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <div v-else-if="filteredOpportunities.length === 0" class="card empty-state">
      No {{ viewMode }} opportunities found.
    </div>

    <div v-else class="card table-card">
      <div class="table-header">
        <span>Title</span>
        <span>Department</span>
        <span>Category</span>
        <span>Priority</span>
        <span>Status</span>
      </div>

      <div
        v-for="opportunity in filteredOpportunities"
        :key="opportunity.id"
        class="table-row"
      >
        <div>
          <router-link
            :to="`/opportunity/${opportunity.id}`"
            class="opportunity-link"
          >
            {{ opportunity.title }}
          </router-link>

          <p>{{ opportunity.description }}</p>
        </div>

        <span>{{ opportunity.department }}</span>
        <span>{{ opportunity.category }}</span>
        <span>{{ opportunity.priority }}</span>

        <span :class="badgeClass(opportunity.status)">
          {{ opportunity.status }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 16px;
  margin-bottom: 20px;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.view-toggle button {
  border: 1px solid var(--rapid-border);
  background: white;
  border-radius: 8px;
  padding: 9px 14px;
  cursor: pointer;
  font-weight: 800;
}

.view-toggle button.active {
  background: var(--rapid-cyan);
  color: white;
  border-color: var(--rapid-cyan);
}

.search-input {
  width: 320px;
}

.table-card {
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.8fr 1fr;
  gap: 16px;
  align-items: center;
  padding: 18px 24px;
}

.table-row {
  border-bottom: 1px solid var(--rapid-border);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row p {
  margin: 4px 0 0;
  color: var(--rapid-muted);
  font-size: 13px;
}

@media (max-width: 1000px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
  }
}
</style>