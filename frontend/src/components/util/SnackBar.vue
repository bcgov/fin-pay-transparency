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
      :color="colour"
      transition="slide-y-transition"
      class="snackbar"
    >
      <span :if="activeNotification?.title" class="snackbar-title mr-1">{{
        activeNotification?.title
      }}</span
      ><span :if="activeNotification?.message" class="snackbar-message">{{
        activeNotification?.message
      }}</span>
      <template #actions>
        <v-btn color="white" v-bind="$attrs" @click="processNextNotification()">
          {{
            notificationQueue.length > 0
              ? 'Next (' + notificationQueue.length + ')'
              : 'Close'
          }}
        </v-btn>
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
      colour: '' as string | undefined,
      theme: null as any,
      polling: null as any,
      timeout: 5000,
      pause: false,
      activeNotification: null as INotification | null,
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
    setSeverity(severity) {
      if (!severity) {
        severity = '';
      }
      switch (severity) {
        case NotificationSeverity.ERROR:
          this.colour = this.theme.current.colors.error;
          break;
        case NotificationSeverity.WARNING:
          this.colour = this.theme.current.colors.warning;
          break;
        case NotificationSeverity.SUCCESS:
          this.colour = this.theme.current.colors.success;
          break;
        default:
          this.colour = this.theme.current.colors.secondary;
      }
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
    setActiveNotification(notification: INotification | undefined | null) {
      this.activeNotification = notification ? notification : null;
      if (notification) {
        this.setSeverity(notification.severity);
        this.setTimeoutMs(notification.timeoutMs);
        document.addEventListener('keydown', this.onKeyPressed);
        this.timeoutCounter();
      } else {
        this.colour = undefined;
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
.snackbar {
  padding: 0 !important;
}
.snackbar-title {
  font-weight: bold;
}
</style>
