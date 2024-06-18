<template>
  <v-dialog
    v-model="dialog"
    :content-class="contentClass"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card>
      <slot name="title" :cancel="cancel">
        <v-toolbar
          :dark="options.dark"
          :color="options.color"
          :dense="options.dense"
          flat
        >
          <v-spacer />
          <v-btn v-if="options.closeIcon" id="closeBtn" icon @click="cancel">
            <v-icon color="#38598A"> mdi-close </v-icon>
          </v-btn>
        </v-toolbar>
      </slot>
      <v-card-text
        class="px-8 pt-8 pb-4"
        :class="[{ 'black--text': !options.dark }]"
      >
        <h3 class="title">{{ title }}</h3>
        <hr class="my-2" />
        <div>{{ message }}</div>
        <slot name="message" />
        <v-divider v-if="options.divider" class="mt-1" />
      </v-card-text>
      <v-card-actions class="px-8 pb-8 pt-4">
        <v-spacer />
        <v-btn id="rejectBtn" class="btn-secondary" @click="cancel">{{
          options.rejectText || 'Cancel'
        }}</v-btn>
        <v-btn
          id="resolveBtn"
          class="btn-primary"
          :disabled="options.resolveDisabled"
          @click="agree"
          >{{ options.resolveText || 'Yes' }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmationDialog',
  components: {},
  props: {
    contentClass: {
      type: String,
      default: '',
    },
  },
  data: () => ({
    dialog: false,
    resolve: null,
    reject: null,
    message: null,
    title: null,
    options: {
      color: 'highlight',
      width: 390,
      zIndex: 200,
      dark: true,
      dense: true,
      closeIcon: false,
      messagePadding: 'pa-8',
      titleBold: false,
      subtitle: false,
      divider: false,
      resolveDisabled: false,
    },
  }),
  methods: {
    open(title, message, options) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.options = Object.assign(this.options, options);
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    agree() {
      this.resolve(true);
      this.dialog = false;
    },
    cancel() {
      this.resolve(false);
      this.dialog = false;
    },
  },
};
</script>

<style scoped>
.dialog-subtitle {
  font-size: 1rem;
}
:deep(.v-toolbar-title__placeholder) {
  overflow: visible;
}
.v-dialog .v-toolbar {
  height: 6px !important;
}
.title {
  text-transform: capitalize;
}
</style>
