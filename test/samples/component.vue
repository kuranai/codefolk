<script setup lang="ts">
import { computed, ref } from "vue";

const people = ref(["Ada", "Grace", "Linus"]);
const greeting = computed(() => `Welcome, ${people.value.join(", ")}`);
</script>

<template>
  <article class="card" data-theme="codefolk">{{ greeting }}</article>
</template>

<style scoped>
.card { color: var(--codefolk-foreground); border-inline-start: 0.25rem solid #ef820c; }
</style>
