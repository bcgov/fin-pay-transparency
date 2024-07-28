<template>
  <v-row dense class="mt-0 w-100 mb-4">
    <v-col class="py-0">
      <AnnouncementSearchFilters />
    </v-col>
  </v-row>

  <div class="search-results w-100">
    <v-row class="mt-0 w-100" no-gutters>
      <v-col sm="8" md="8" lg="6" xl="4" class="d-flex align-center">
        <h4 v-if="searchResults?.length">
          Displaying {{ searchResults.length }} announcement<span
            v-if="searchResults.length != 1"
            >s</span
          >
        </h4>
      </v-col>
      <v-col
        sm="4"
        md="4"
        lg="6"
        xl="8"
        class="d-flex justify-end align-center"
      >
        <v-btn class="btn-primary" @click="addAnnouncement()">
          Add announcement
        </v-btn>
      </v-col>
    </v-row>

    <v-data-table-server
      v-model:items-per-page="pageSize"
      :headers="headers"
      :items="searchResults"
      :items-length="totalNum"
      :loading="isSearching"
      :items-per-page-options="itemsPerPageOptions"
      search=""
      :no-data-text="
        hasSearched ? 'No announcements matched the search criteria' : ''
      "
      @update:options="updateSearch"
    >
      <template v-slot:item.published_on="{ item }">
        {{ formatDate(item.published_on) }}
      </template>
      <template v-slot:item.expires_on="{ item }">
        {{ formatDate(item.expires_on) }}
      </template>
      <template v-slot:item.status="{ item }">
        <AnnouncementStatusChip :status="item.status"></AnnouncementStatusChip>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn
          aria-label="Actions"
          density="compact"
          variant="plain"
          icon="mdi-dots-vertical"
          color="black"
          class="btn-actions"
        >
          <v-icon color="black"></v-icon>
          <v-menu activator="parent">
            <v-list>
              <v-list-item>
                <v-btn variant="text" prepend-icon="mdi-pencil">Edit</v-btn>
              </v-list-item>
              <v-list-item v-if="item.status == 'DRAFT'">
                <v-btn variant="text" prepend-icon="mdi-publish">Publish</v-btn>
              </v-list-item>
              <v-list-item v-if="item.status == 'PUBLISHED'">
                <v-btn variant="text" prepend-icon="mdi-cancel"
                  >Unpublish</v-btn
                >
              </v-list-item>
              <v-list-item>
                <v-btn class="text-red" variant="text" prepend-icon="mdi-delete"
                  >Delete</v-btn
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Announcements',
};
</script>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import AnnouncementSearchFilters from './AnnouncementSearchFilters.vue';
import AnnouncementStatusChip from './AnnouncementStatusChip.vue';
import { useAnnouncementSearchStore } from '../store/modules/announcementSearchStore';
import { formatDate } from '../utils/date';
import { AnnouncementKeys } from '../types/announcements';

const announcementSearchStore = useAnnouncementSearchStore();
const { searchResults, isSearching, hasSearched, totalNum, pageSize } =
  storeToRefs(announcementSearchStore);

const itemsPerPageOptions = ref([
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  {
    value: 50,
    title: '50',
  },
  { value: 100, title: '100' },
  { value: 150, title: '150' },
]);

const headers = ref<any>([
  {
    title: 'Title',
    align: 'start',
    sortable: true,
    key: AnnouncementKeys.TITLE,
  },
  {
    title: 'Publish date',
    align: 'start',
    sortable: true,
    key: AnnouncementKeys.PUBLISH_DATE,
  },
  {
    title: 'Expiry date',
    align: 'start',
    sortable: true,
    key: AnnouncementKeys.EXPIRY_DATE,
  },
  {
    title: 'Status',
    align: 'start',
    sortable: true,
    key: AnnouncementKeys.STATUS,
  },
  {
    title: 'Actions',
    key: 'actions',
    align: 'center',
    sortable: false,
  },
]);

async function updateSearch(options) {
  await announcementSearchStore.updateSearch(options);
}

async function repeatSearch() {
  await announcementSearchStore.repeatSearch();
}

async function addAnnouncement() {
  console.log('TODO: add announcement');
}
</script>

<style>
.v-chip {
  font-weight: bold !important;
  font-size: 0.8rem !important;
}
.btn-actions {
  opacity: 1 !important;
}
</style>
