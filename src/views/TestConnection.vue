<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'

const status = ref('Connecting...')

onMounted(async () => {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')

  if (error) {
    status.value = error.message
  } else {
    status.value = `Connected! Found ${data.length} opportunities`
  }
})
</script>

<template>
  <div>
    <h1>Supabase Test</h1>
    <p>{{ status }}</p>
  </div>
</template>