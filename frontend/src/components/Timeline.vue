<template>
    <v-row>
    <v-col class="d-flex-col justify-center align-center">
        <div
        class="circle"
        :class="{
            active: stage == 'UPLOAD',
            available: stage != 'UPLOAD',
        }"
        v-on:click="onClickCircle('UPLOAD')"
        >
        1
        </div>
    </v-col>
    <v-col class="d-flex justify-center align-center">
        <div class="dash disabled"></div>
    </v-col>
    <v-col class="d-flex justify-center align-center">
        <div
        class="circle"
        :class="{
            active: stage == 'REVIEW',
            disabled: stage != 'REVIEW',
        }"
        v-on:click="onClickCircle('REVIEW')"
        >
        2
        </div>
    </v-col>
    <v-col class="d-flex justify-center align-center">
        <div class="dash disabled"></div>
    </v-col>
    <v-col class="d-flex justify-center align-center">
        <div
        class="circle"
        :class="{
            active: stage == 'FINAL',
            disabled: stage != 'FINAL',
        }"
        v-on:click="onClickCircle('FINAL')"
        >
        3
        </div>
    </v-col>
    </v-row>

    <v-row>
    <v-col class="d-flex-col justify-center align-center">
        <h5>Upload</h5>
    </v-col>
    <v-col class="d-flex justify-center align-center"> </v-col>
    <v-col class="d-flex justify-center align-center">
        <h5>Review</h5>
    </v-col>
    <v-col class="d-flex justify-center align-center"> </v-col>
    <v-col class="d-flex justify-center align-center">
        <h5>Report</h5>
    </v-col>
    </v-row>
</template>

<script>
export default {
  emits: {
    timelineStage: null,
  },
  expose: ['showStage'],
  data: () => ({
    stage: 'UPLOAD', //one of [UPLOAD, REVIEW, FINAL]
  }),
  methods: {
    showStage(stage) {
      this.stage = stage;
    },
    onClickCircle(stage) {
      this.showStage(stage);
      this.$emit('timelineStage', stage);
    }  
  },        
};
</script>

<style scoped>
.circle {
  height: 60px;
  width: 60px;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  &.available {
    background-color: #00336633;
    cursor: pointer;
  }

  &.active {
    background-color: #003366;
    cursor: arrow;
  }

  &.disabled {
    background-color: #aaaaaa;
    cursor: not-allowed;
  }
}

.dash {
  height: 1px;
  width: 100%;
  background-color: #003366;
  padding-left: 5px;
  padding-right: 5px;

  &.disabled {
    background-color: #aaaaaa;
  }
}
</style>
