<template>
  <header class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>

    <button
      v-if="showRefresh"
      class="refresh-button"
      @click="$emit('refresh')"
    >
      Refresh
    </button>
  </header>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
  showRefresh: {
    type: Boolean,
    default: true
  }
})

defineEmits(['refresh'])
</script>