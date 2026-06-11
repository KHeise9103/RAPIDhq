<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import PageHeader from '../components/PageHeader.vue'

const departments = ref([])
const categories = ref([])
const users = ref([])

const newDepartment = ref('')
const newCategory = ref('')

const newUser = ref({
  name: '',
  email: '',
  department: '',
  role: 'User'
})

const editingUserId = ref(null)
const editingUser = ref({
  name: '',
  email: '',
  department: '',
  role: 'User'
})

const expandedSections = ref({
  departments: false,
  categories: false,
  users: false
})

const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  await loadSettings()
})

function toggleSection(section) {
  expandedSections.value[section] = !expandedSections.value[section]
}

async function loadSettings() {
  loading.value = true
  errorMessage.value = ''

  const { data: departmentData, error: departmentError } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (departmentError || categoryError || userError) {
    errorMessage.value =
      departmentError?.message || categoryError?.message || userError?.message
  } else {
    departments.value = departmentData || []
    categories.value = categoryData || []
    users.value = userData || []

    if (!newUser.value.department && departments.value.length > 0) {
      newUser.value.department = departments.value[0].name
    }
  }

  loading.value = false
}

async function addDepartment() {
  if (!newDepartment.value.trim()) return

  const { error } = await supabase
    .from('departments')
    .insert([{ name: newDepartment.value.trim() }])

  if (error) {
    alert(error.message)
    return
  }

  newDepartment.value = ''
  await loadSettings()
}

async function addCategory() {
  if (!newCategory.value.trim()) return

  const { error } = await supabase
    .from('categories')
    .insert([{ name: newCategory.value.trim() }])

  if (error) {
    alert(error.message)
    return
  }

  newCategory.value = ''
  await loadSettings()
}

async function addUser() {
  if (!newUser.value.name.trim() || !newUser.value.email.trim()) return

  const { error } = await supabase
    .from('users')
    .insert([
      {
        name: newUser.value.name.trim(),
        email: newUser.value.email.trim(),
        department: newUser.value.department,
        role: newUser.value.role
      }
    ])

  if (error) {
    alert(error.message)
    return
  }

  newUser.value = {
    name: '',
    email: '',
    department: departments.value[0]?.name || '',
    role: 'User'
  }

  await loadSettings()
}

function startEditUser(user) {
  editingUserId.value = user.id

  editingUser.value = {
    name: user.name,
    email: user.email,
    department: user.department || departments.value[0]?.name || '',
    role: user.role || 'User'
  }
}

function cancelEditUser() {
  editingUserId.value = null

  editingUser.value = {
    name: '',
    email: '',
    department: '',
    role: 'User'
  }
}

async function saveUser(user) {
  if (!editingUser.value.name.trim() || !editingUser.value.email.trim()) return

  const { error } = await supabase
    .from('users')
    .update({
      name: editingUser.value.name.trim(),
      email: editingUser.value.email.trim(),
      department: editingUser.value.department,
      role: editingUser.value.role
    })
    .eq('id', user.id)

  if (error) {
    alert(error.message)
    return
  }

  cancelEditUser()
  await loadSettings()
}

async function deactivateDepartment(department) {
  if (!confirm(`Remove "${department.name}" from future submissions?`)) return

  const { error } = await supabase
    .from('departments')
    .update({ is_active: false })
    .eq('id', department.id)

  if (error) alert(error.message)

  await loadSettings()
}

async function deactivateCategory(category) {
  if (!confirm(`Remove "${category.name}" from future submissions?`)) return

  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', category.id)

  if (error) alert(error.message)

  await loadSettings()
}

async function deactivateUser(user) {
  if (!confirm(`Remove "${user.name}" as an active RAPIDhq user?`)) return

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', user.id)

  if (error) alert(error.message)

  await loadSettings()
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Administration"
      subtitle="Manage configurable RAPIDhq settings."
      @refresh="loadSettings"
    />

    <div v-if="loading" class="card empty-state">
      Loading administration settings...
    </div>

    <div v-else-if="errorMessage" class="card empty-state error">
      {{ errorMessage }}
    </div>

    <section v-else class="admin-grid">
      <div class="card admin-card">
        <button class="section-toggle" @click="toggleSection('departments')">
          <span>Departments</span>
          <strong>{{ expandedSections.departments ? '−' : '+' }}</strong>
        </button>

        <div v-if="expandedSections.departments" class="section-body">
          <p>Departments available during opportunity submission.</p>

          <div class="add-row">
            <input v-model="newDepartment" placeholder="Add department" @keyup.enter="addDepartment" />
            <button class="btn-primary" @click="addDepartment">Add</button>
          </div>

          <div class="list">
            <div v-for="department in departments" :key="department.id" class="list-item">
              <span>{{ department.name }}</span>
              <button class="delete-button" @click="deactivateDepartment(department)">Remove</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card admin-card">
        <button class="section-toggle" @click="toggleSection('categories')">
          <span>Opportunity Categories</span>
          <strong>{{ expandedSections.categories ? '−' : '+' }}</strong>
        </button>

        <div v-if="expandedSections.categories" class="section-body">
          <p>Categories used to classify submitted opportunities.</p>

          <div class="add-row">
            <input v-model="newCategory" placeholder="Add category" @keyup.enter="addCategory" />
            <button class="btn-primary" @click="addCategory">Add</button>
          </div>

          <div class="list">
            <div v-for="category in categories" :key="category.id" class="list-item">
              <span>{{ category.name }}</span>
              <button class="delete-button" @click="deactivateCategory(category)">Remove</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card admin-card users-card">
        <button class="section-toggle" @click="toggleSection('users')">
          <span>Users</span>
          <strong>{{ expandedSections.users ? '−' : '+' }}</strong>
        </button>

        <div v-if="expandedSections.users" class="section-body">
          <p>Manage people who can own projects, review opportunities, or administer RAPIDhq.</p>

          <div class="user-form">
            <input v-model="newUser.name" placeholder="Full name" />
            <input v-model="newUser.email" type="email" placeholder="Email address" />

            <select v-model="newUser.department">
              <option v-for="department in departments" :key="department.id" :value="department.name">
                {{ department.name }}
              </option>
            </select>

            <select v-model="newUser.role">
              <option>User</option>
              <option>Reviewer</option>
              <option>Project Owner</option>
              <option>Administrator</option>
            </select>

            <button class="btn-primary" @click="addUser">Add User</button>
          </div>

          <div class="list">
            <div v-for="user in users" :key="user.id" class="list-item user-item">
              <template v-if="editingUserId === user.id">
                <div class="edit-user-grid">
                  <input v-model="editingUser.name" placeholder="Full name" />
                  <input v-model="editingUser.email" type="email" placeholder="Email address" />

                  <select v-model="editingUser.department">
                    <option v-for="department in departments" :key="department.id" :value="department.name">
                      {{ department.name }}
                    </option>
                  </select>

                  <select v-model="editingUser.role">
                    <option>User</option>
                    <option>Reviewer</option>
                    <option>Project Owner</option>
                    <option>Administrator</option>
                  </select>
                </div>

                <div class="button-group">
                  <button class="save-button" @click="saveUser(user)">Save</button>
                  <button class="cancel-button" @click="cancelEditUser">Cancel</button>
                </div>
              </template>

              <template v-else>
                <div>
                  <strong>{{ user.name }}</strong>
                  <p>{{ user.email }} • {{ user.department || 'No department' }} • {{ user.role }}</p>
                </div>

                <div class="button-group">
                  <button class="edit-button" @click="startEditUser(user)">Edit</button>
                  <button class="delete-button" @click="deactivateUser(user)">Remove</button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.admin-card {
  padding: 24px;
}

.users-card {
  grid-column: 1 / -1;
}

.section-toggle {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--rapid-text);
  cursor: pointer;
}

.section-toggle span {
  font-size: 22px;
  font-weight: 900;
}

.section-toggle strong {
  font-size: 28px;
  color: var(--rapid-cyan);
}

.section-body {
  margin-top: 18px;
}

.section-body p {
  color: var(--rapid-muted);
  line-height: 1.5;
}

.add-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  margin: 22px 0;
}

.add-row .btn-primary,
.user-form .btn-primary {
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
}

.user-form {
  display: grid;
  grid-template-columns: 1fr 1fr 180px 180px auto;
  gap: 12px;
  margin: 22px 0;
}

.list {
  display: grid;
  gap: 10px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid var(--rapid-border);
  border-radius: 10px;
  font-weight: 700;
}

.user-item p {
  margin: 4px 0 0;
  color: var(--rapid-muted);
  font-size: 13px;
}

.edit-user-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 180px 180px;
  gap: 10px;
}

.button-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-button,
.save-button,
.cancel-button,
.delete-button {
  border: none;
  border-radius: 6px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.edit-button {
  background: var(--rapid-cyan);
  color: white;
}

.save-button {
  background: var(--rapid-green);
  color: white;
}

.cancel-button {
  background: #e8eef5;
  color: var(--rapid-text);
}

.delete-button {
  background: #b42318;
  color: white;
}

@media (max-width: 1200px) {
  .user-form,
  .edit-user-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .admin-grid,
  .user-form,
  .edit-user-grid {
    grid-template-columns: 1fr;
  }

  .users-card {
    grid-column: auto;
  }

  .list-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>