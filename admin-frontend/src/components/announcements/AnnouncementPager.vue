<template>
  <v-card class="rounded-lg">
    <v-toolbar color="tab">
      <v-toolbar-title>Updates</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <template v-for="(announcement, index) in page">
        <AnnouncementItem :announcement="announcement"> </AnnouncementItem>
        <v-divider v-if="index < page.length - 1" class="my-4"></v-divider>
      </template>
      <v-pagination
        v-model="pageNum"
        v-if="numPages > 1"
        :length="numPages"
        size="28"
        class="mt-2"
      ></v-pagination>
    </v-card-text>
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
  announcements: Announcement[] | undefined;
  pageSize: number;
}>();

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
