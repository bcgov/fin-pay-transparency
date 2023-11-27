<template>
  <div @mouseover="pause = true" @mouseleave="pause = false">
    <v-snackbar id="mainSnackBar" v-model="isVisible" :key="notificationKey" :timeout="timeout" elevation="24"
      location="top" centered :color="colour" transition="slide-y-transition" class="snackbar">
      {{ message }}
      <template #actions>
        <v-btn text color="white" v-bind="$attrs" @click="processNextNotification()">
          {{ notificationQueue.length > 0 ? 'Next (' + notificationQueue.length + ')' : 'Close' }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">

import { NotificationService, Notification, NotificationTypes } from '../../common/notificationService';
import { useTheme } from 'vuetify'

export default {
  name: 'SnackBar',
  data() {
    return {
      colour: '',
      theme: null,
      polling: null,
      timeout: 5000,
      pause: false,
      message: null,
      notificationQueue: [],
      isVisible: false,
      // This attribute is used to force Vue to update the snackbar in the case
      // where isVisible quickly changes between true, false and then true again.
      notificationKey: 0
    };
  },
  mounted() {
    NotificationService.registerNotificationListener(this.onNotificationEvent);

    // Get access to colors defined in the Vuetify theme
    this.theme = useTheme()
  },
  computed: {
    hasNotificationsPending() {
      return this.notificationQueue.length > 0;
    },
  },
  watch: {
    isVisible(isVisible) {
      if (!isVisible) {
        this.onNotificationExpired()
      }
    },
  },
  methods: {
    onNotificationEvent(notification: Notification) {
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
      this.timeout = 5000;
      switch (severity) {
        case (NotificationTypes.NOTIFICATION_ERROR):
          this.timeout = 8000;
          this.colour = this.theme.current.colors.error;
          break;
        case (NotificationTypes.NOTIFICATION_WARNING):
          this.colour = this.theme.current.colors.warning;
          break;
        case (NotificationTypes.NOTIFICATION_SUCCESS):
          this.colour = this.theme.current.colors.success;
          break;
        default:
          this.colour = this.theme.current.colors.secondary;
      }
    },
    processNextNotification() {
      if (this.notificationQueue.length) {
        this.isVisible = true;
        const notification = this.notificationQueue.shift();
        this.message = notification.message;
        this.setSeverity(notification.severity)
        document.addEventListener('keydown', this.onKeyPressed);
        this.timeoutCounter();
      }
      else {
        this.close();
      }
    },
    onKeyPressed(e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.isVisible) {
        this.processNextNotification();
      }
    },
    close() {
      this.message = null;
      this.color = null;
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
    }
  }
};
</script>

<style>
.snackbar {
  padding: 0 !important;
}
</style>

