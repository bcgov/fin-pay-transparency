<template>
  <v-card class="rounded-lg d-flex flex-column">
    <v-toolbar color="tab" class="flex-shrink-1">
      <v-toolbar-title>
        <span class="d-flex align-center">
          Updates
          <v-chip
            size="x-small"
            class="bg-white text-primary ml-2"
            v-if="announcements && !isLoading"
            ><b>{{ announcements.length }}</b></v-chip
          >
        </span>
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="flex-grow-1 v-scroll">
      <div class="d-flex flex-column">
        <div class="flex-grow-1" v-if="!isLoading">
          <template v-for="(announcement, index) in page">
            <AnnouncementItem :announcement="announcement"> </AnnouncementItem>
            <v-divider v-if="index < page.length - 1" class="my-4"></v-divider>
          </template>
        </div>
        <div v-if="isLoading">
          <v-skeleton-loader
            v-for="i in pageSize"
            loading-text="loading announcements"
            type="article"
            class="h-100 mb-4"
          ></v-skeleton-loader>
        </div>
      </div>
    </v-card-text>

    <v-pagination
      v-model="pageNum"
      v-if="numPages > 1 && !isLoading"
      :length="numPages"
      size="28"
      class="mt-2 flex-shrink-1"
    ></v-pagination>
  </v-card>
</template>
<script lang="ts">
export default {
  name: 'AnnouncementPager',
};
</script>

<script setup lang="ts">
import { Announcement } from '../../types/announcements';
import AnnouncementItem from './AnnouncementItem.vue';
import { ref, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    announcements?: Announcement[] | undefined;
    pageSize?: number;
    isLoading?: boolean;
  }>(),
  {
    announcements: undefined,
    pageSize: 1,
    isLoading: false,
  },
);

const pageNum = ref<number>(1); //starts at 1
const offset = computed<number>(() => {
  return (pageNum.value - 1) * props.pageSize;
}); //index of start of current page.  starts at 0.
const numPages = computed<number>(() =>
  props.announcements?.length
    ? Math.ceil(props.announcements?.length / props.pageSize)
    : 0,
);
const page = computed<Announcement[]>(() => {
  const start = offset.value;
  let end = start + props.pageSize;
  if (
    !props?.announcements?.length ||
    start < 0 ||
    start >= props.announcements.length
  ) {
    return [];
  }
  if (end > props.announcements.length) {
    end = props.announcements.length;
  }
  return props.announcements.slice(start, end);
});
</script>
<style>
.v-scroll {
  overflow-y: auto;
}
.v-skeleton-loader {
  opacity: 0.3;
}
</style>
