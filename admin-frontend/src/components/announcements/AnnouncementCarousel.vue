<template>
  <v-card class="rounded-lg">
    <v-toolbar color="tab">
      <v-toolbar-title>Announcements</v-toolbar-title>
    </v-toolbar>
    <AnnouncementItem
      v-for="(announcement, i) in page"
      :announcement="announcement"
    >
    </AnnouncementItem>
    <v-pagination v-model="pageNum" :length="numPages"></v-pagination>
  </v-card>
</template>
<script lang="ts">
export default {
  name: 'Announcement',
};
</script>

<script setup lang="ts">
import { Announcement } from '../../types/announcements';
import AnnouncementItem from './AnnouncementItem.vue';
import { ref, computed } from 'vue';

const props = defineProps<{
  announcements: Announcement[];
  pageSize: number;
}>();

const pageNum = ref<number>(1); //starts at 1
const offset = computed<number>(() => pageNum.value * props.pageSize - 1); //index of start of current page.  starts at 0.
const numPages = computed<number>(() =>
  Math.ceil(props.announcements.length / props.pageSize),
);
const page = computed<Announcement[]>(() => {
  const start = offset.value;
  let end = start + props.pageSize;
  if (start >= 0 && start < props.announcements.length) {
    return [];
  }
  if (end > props.announcements.length) {
    end = props.announcements.length;
  }
  return props.announcements.slice(start, end);
});
</script>
