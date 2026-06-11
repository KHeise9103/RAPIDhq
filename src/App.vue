<script setup>
import { ref } from 'vue'
import SidebarNav from './components/SidebarNav.vue'

const mobileMenuOpen = ref(false)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="app-shell">
    <SidebarNav
      :mobile-open="mobileMenuOpen"
      @close-menu="closeMobileMenu"
    />

    <div
      v-if="mobileMenuOpen"
      class="mobile-overlay"
      @click="closeMobileMenu"
    ></div>

    <main class="main-content">
      <header class="mobile-topbar">
        <button
          class="mobile-menu-button"
          @click="mobileMenuOpen = true"
        >
          ☰
        </button>

        <img src="/rapid-logo.png" alt="RAPIDHQ logo" class="mobile-logo" />
      </header>

      <router-view />
    </main>
  </div>
</template>