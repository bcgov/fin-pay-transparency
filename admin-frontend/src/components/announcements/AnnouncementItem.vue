<template>
  <h1>{{ announcement.title }}</h1>
  <p>{{ announcement.description }}</p>
  <v-list :lines="false" density="compact">
    <v-list-item
      v-for="(item, i) in announcement.announcement_resource"
      :key="i"
      :value="item"
      :href="item.resource_url"
    >
    </v-list-item>
  </v-list>
</template>
<script lang="ts">
export default {
  name: 'AnnouncementItem',
};
</script>

<script setup lang="ts">
import { Announcement } from '../../types/announcements';

const props = defineProps<{
  announcement: Announcement;
}>();
</script>
