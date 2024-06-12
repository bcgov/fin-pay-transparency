<template>
  <v-breadcrumbs
    :items="breadcrumbItems"
    divider=">"
    class="px-0"
  ></v-breadcrumbs>
</template>

<script>
export default {
  name: 'BreadcrumbTrail',
};
</script>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, watch } from 'vue';

const router = useRouter();
const route = useRoute();
const breadcrumbItems = ref();

const dashboardRoute = router
  .getRoutes()
  .filter((r) => r.name == 'dashboard')[0];
const dashboardItem = routeToBreadcrumbItem(dashboardRoute);

function routeToBreadcrumbItem(route, isEnabled = true) {
  return {
    title: route.meta.pageTitle,
    disabled: !isEnabled,
    to: {
      name: route.name,
    },
  };
}

function updateBreadcrumbItems(route) {
  const items = [];
  if (route?.meta?.isBreadcrumbTrailVisible) {
    items.push(dashboardItem);
    if (route?.name != dashboardRoute.name) {
      items.push(routeToBreadcrumbItem(route, false));
    }
  }
  breadcrumbItems.value = items;
}

watch(
  route,
  (newRoute, oldRoute) => {
    updateBreadcrumbItems(newRoute);
  },
  { immediate: true },
);
</script>

<style>
.v-breadcrumbs-item {
  padding-left: 0px !important;
  padding-left: 0px !important;
  font-size: 0.8em;
}
.v-breadcrumbs-item--link {
  color: revert !important;
}
.v-breadcrumbs-divider {
  padding-left: 2px !important;
  padding-right: 2px !important;
}
.v-breadcrumbs-item--disabled {
  opacity: 1 !important;
}
.v-breadcrumbs-item--disabled a {
  color: #111111 !important;
}
</style>
