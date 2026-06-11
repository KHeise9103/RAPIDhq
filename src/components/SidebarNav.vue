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
      <button
        class="close-button"
        @click="$emit('close-menu')"
      >
        ×
      </button>
    </div>

    <div class="brand-logo-wrap">
      <img
        src="/rapid-logo.png"
        alt="RAPIDHQ"
        class="brand-logo"
      />
    </div>

    <nav class="nav">
      <router-link
        to="/"
        class="nav-item"
        @click="$emit('close-menu')"
      >
        Dashboard
      </router-link>

      <router-link
        to="/opportunities"
        class="nav-item"
        @click="$emit('close-menu')"
      >
        Opportunities
      </router-link>

      <router-link
        to="/intake-queue"
        class="nav-item"
        @click="$emit('close-menu')"
      >
        Intake Queue
      </router-link>

      <router-link
        to="/projects"
        class="nav-item"
        @click="$emit('close-menu')"
      >
        Projects
      </router-link>

      <router-link
        to="/analytics"
        class="nav-item"
        @click="$emit('close-menu')"
      >
        Analytics
      </router-link>

      <router-link
        to="/administration"
        class="nav-item"
        @click="$emit('close-menu')"
      >
        Administration
      </router-link>
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

  background: linear-gradient(
    180deg,
    var(--rapid-navy),
    var(--rapid-navy-dark)
  );

  color: white;
  padding: 18px;
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

.brand-logo-wrap {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 24px;
}

.brand-logo {
  width: 100%;
  height: auto;
  display: block;
}

.nav {
  display: grid;
  gap: 10px;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 14px 16px;
  border-radius: 10px;
  font-weight: 800;
  transition: 0.2s ease;
}

.nav-item:hover,
.nav-item.router-link-active {
  background: var(--rapid-cyan);
}

.submit-button {
  margin-top: 24px;
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