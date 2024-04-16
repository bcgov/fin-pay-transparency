<template>
  <div @mouseover="pause = true" @mouseleave="pause = false">
    <v-snackbar
      id="mainSnackBar"
      v-model="isVisible"
      :key="notificationKey"
      :timeout="timeout"
      elevation="24"
      location="top"
      centered
      :content-class="styleClass"
      transition="slide-y-transition"
    >
      <span :if="activeNotification?.title" class="snackbar-title mr-1">{{
        activeNotification?.title
      }}</span
      ><span :if="activeNotification?.message" class="snackbar-message">{{
        activeNotification?.message
      }}</span>
      <template #actions>
        <a @click="processNextNotification()" :class="styleClass">
          {{
            notificationQueue.length > 0
              ? 'Next (' + notificationQueue.length + ')'
              : 'Close'
          }}
        </a>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import {
  NotificationService,
  INotification,
  NotificationSeverity,
} from '../../common/notificationService';
import { useTheme } from 'vuetify';

export default {
  name: 'SnackBar',
  data() {
    return {
      styleClass: undefined as string | undefined,
      theme: null as any,
      polling: null as any,
      timeout: 5000,
      pause: false,
      activeNotification: null as INotification | null | undefined,
      notificationQueue: [] as INotification[],
      isVisible: false,
      // This attribute is used to force Vue to update the snackbar in the case
      // where isVisible quickly changes between true, false and then true again.
      notificationKey: 0,
    };
  },
  mounted() {
    NotificationService.registerNotificationListener(this.onNotificationEvent);

    // Get access to colors defined in the Vuetify theme
    this.theme = useTheme();
  },
  computed: {
    hasNotificationsPending() {
      return this.notificationQueue.length > 0;
    },
  },
  watch: {
    isVisible(isVisible) {
      if (!isVisible) {
        this.onNotificationExpired();
      }
    },
  },
  methods: {
    onNotificationEvent(notification: INotification) {
      this.notificationQueue.push(notification);
      if (!this.isVisible) {
        this.processNextNotification();
      }
    },
    onNotificationExpired() {
      this.close();
      this.notificationKey++;
      if (this.hasNotificationsPending) {
        this.processNextNotification();
      }
    },
    setSeverity(severity: NotificationSeverity | null) {
      //set the notification style class that corresponds to the given severity
      this.styleClass = severity
        ? `v-alert alert-${severity.valueOf()}`
        : undefined;
    },
    setTimeoutMs(timeoutMs: number) {
      this.timeout = timeoutMs;
    },
    processNextNotification() {
      if (this.notificationQueue.length) {
        this.isVisible = true;
        const notification = this.notificationQueue.shift();
        this.setActiveNotification(notification);
      } else {
        this.close();
      }
    },
    setActiveNotification(notification: INotification | null | undefined) {
      this.activeNotification = notification;
      if (notification) {
        this.setSeverity(notification.severity);
        this.setTimeoutMs(notification.timeoutMs);
        document.addEventListener('keydown', this.onKeyPressed);
        this.timeoutCounter();
      } else {
        this.styleClass = undefined;
      }
    },
    onKeyPressed(e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.isVisible) {
        this.processNextNotification();
      }
    },
    close() {
      this.setActiveNotification(null);
      this.isVisible = false;
      document.removeEventListener('keydown', this.onKeyPressed);
      clearInterval(this.polling);
    },
    timeoutCounter() {
      this.polling = setInterval(() => {
        if (this.pause) {
          this.timeout += 1;
        }
      }, 1000);
    },
  },
};
</script>

<style>
.v-snackbar__wrapper {
  font-family: 'BCSans', 'Noto Sans', Verdana, Arial, sans-serif !important;
}
.v-snackbar .snackbar-title {
  font-weight: bold;
  font-size: 1rem;
}
.v-snackbar .snackbar-message {
  font-weight: bold;
  font-size: 1rem;
}
.v-snackbar a {
  font-weight: bold;
  text-decoration: underline !important;
  font-size: 1rem;
}
</style>
