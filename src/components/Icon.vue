<template>
  <svg :class="className" :aria-hidden="decorative ? 'true' : undefined" :aria-label="decorative ? undefined : label">
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  className: { type: [String, Array, Object], default: "" },
  decorative: { type: Boolean, default: true },
  label: { type: String, default: "" },
});
</script>
