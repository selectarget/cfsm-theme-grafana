<template>
  <div class="grafana-card flex flex-col overflow-hidden relative group" :class="customClass">
    <!-- Header -->
    <div v-if="title || $slots.header" class="grafana-card-header bg-[#16181d] select-none">
      <div class="flex items-center space-x-2 min-w-0">
        <slot name="header-left">
          <span class="grafana-card-title truncate" :title="title">{{ title }}</span>
        </slot>
      </div>

      <div class="flex items-center space-x-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <slot name="header-right">
          <button
            v-if="timeBadge"
            class="text-[10px] text-grafana-muted px-1.5 py-0.5 rounded bg-[#202227] flex items-center space-x-1"
          >
            <Clock class="w-2.5 h-2.5" />
            <span>{{ timeBadge }}</span>
          </button>
          <button
            v-if="allowExpand"
            class="text-grafana-muted hover:text-white p-0.5 rounded hover:bg-[#282a30] transition-colors"
            @click="$emit('expand')"
            title="放大面板"
          >
            <Maximize2 class="w-3 h-3" />
          </button>
        </slot>
      </div>
    </div>

    <!-- Body Content -->
    <div class="flex-1 min-h-0 relative p-2.5 flex flex-col justify-center">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Maximize2, Clock } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    title?: string;
    timeBadge?: string;
    customClass?: string;
    allowExpand?: boolean;
  }>(),
  {
    title: '',
    timeBadge: '',
    customClass: '',
    allowExpand: false
  }
);

defineEmits<{
  (e: 'expand'): void;
}>();
</script>
