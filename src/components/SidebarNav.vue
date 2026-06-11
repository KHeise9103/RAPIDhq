<script setup>
defineProps({
  mobileOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close-menu'])
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar-open': mobileOpen }"
  >
    <div class="mobile-sidebar-header">
      <button class="close-button" @click="$emit('close-menu')">
        ×
      </button>
    </div>

    <div class="brand-title">
      <img src="/rapid-logo.png" class="brand-icon" />

      <div>
        <div class="brand-name">RAPID<span>HQ</span></div>
        <div class="brand-tagline">
          Capture. Prioritize. Implement. Measure.
        </div>
      </div>
    </div>

    <nav class="nav">
      <router-link to="/" class="nav-item" @click="$emit('close-menu')">Dashboard</router-link>
      <router-link to="/opportunities" class="nav-item" @click="$emit('close-menu')">Opportunities</router-link>
      <router-link to="/intake-queue" class="nav-item" @click="$emit('close-menu')">Intake Queue</router-link>
      <router-link to="/projects" class="nav-item" @click="$emit('close-menu')">Projects</router-link>
      <router-link to="/analytics" class="nav-item" @click="$emit('close-menu')">Analytics</router-link>
      <router-link to="/administration" class="nav-item" @click="$emit('close-menu')">Administration</router-link>
    </nav>

    <router-link
      to="/submit-opportunity"
      class="btn-primary submit-button"
      @click="$emit('close-menu')"
    >
      + Submit Opportunity
    </router-link>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, var(--rapid-navy), var(--rapid-navy-dark));
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.mobile-sidebar-header {
  display: none;
}

.close-button {
  border: none;
  background: transparent;
  color: white;
  font-size: 32px;
  cursor: pointer;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.brand-icon {
  width: 74px;
  height: 74px;
  object-fit: contain;
  background: white;
  border-radius: 10%;
  padding: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
}

.brand-name {
  font-size: 26px;
  font-weight: 900;
}

.brand-name span {
  color: var(--rapid-cyan);
}

.brand-tagline {
  font-size: 11px;
  opacity: 0.85;
}

.nav {
  display: grid;
  gap: 10px;
  margin-bottom: 24px;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 14px 16px;
  border-radius: 10px;
  font-weight: 800;
}

.nav-item:hover,
.nav-item.router-link-active {
  background: var(--rapid-cyan);
}

.submit-button {
  margin-top: auto;
  text-align: center;
  text-decoration: none;
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: -300px;
    top: 0;
    height: 100vh;
    transition: left 0.25s ease;
  }

  .sidebar.sidebar-open {
    left: 0;
  }

  .mobile-sidebar-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
  }
}
</style>