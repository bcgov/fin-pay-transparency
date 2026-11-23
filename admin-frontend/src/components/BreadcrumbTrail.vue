<template>
  <v-breadcrumbs :items="breadcrumbItems" class="px-0">
    <template v-slot:divider>
      <v-icon
        icon="fa fa-chevron-right fa-xs"
        size="x-small"
        class="px-0"
      ></v-icon>
    </template>
  </v-breadcrumbs>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, watch } from 'vue';

const router = useRouter();
const route = useRoute();
const breadcrumbItems = ref();

const dashboardRoute = router.getRoutes().find((r) => r.name == 'dashboard');

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
  if (route?.meta?.breadcrumbs?.length) {
    items.push(
      ...route.meta.breadcrumbs.map((b) =>
        routeToBreadcrumbItem(router.getRoutes().find((r) => r.name == b)),
      ),
    );

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
  margin-top: -1px;
  padding-left: 0px !important;
  padding-right: 0px !important;
  font-size: 0.8em;
}
.v-breadcrumbs-item--link {
  color: revert !important;
}
.v-breadcrumbs-divider {
  padding-left: 0px !important;
  padding-right: 0px !important;
}
.v-breadcrumbs-item--disabled {
  opacity: 1 !important;
}
.v-breadcrumbs-item--disabled a {
  color: var(--bcds-typography-color-disabled) !important;
}
</style>
