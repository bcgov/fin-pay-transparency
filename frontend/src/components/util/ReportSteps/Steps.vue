<template>
  <div class="track-root d-flex align-center">
    <div class="track-marks d-flex mb-6">
      <div class="step-root" v-for="(_, index) in REPORT_STAGES">
        <div class="mark d-flex justify-center flex-column">
          {{ index + 1 }}
        </div>
      </div>
    </div>
    <div class="track">
      <div class="slide w100"></div>
    </div>
    <div class="steps d-flex justify-content-center">
      <div class="step-root" v-for="(item, index) in REPORT_STAGES">
        <Step
          :value="item.value"
          :label="item.label"
          :url="item.url"
          :index="index"
        />
      </div>
    </div>
    <div class="track-labels d-flex mt-5">
      <div class="step-root" v-for="item in REPORT_STAGES">
        <div class="mark d-flex justify-center flex-column">
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import Step from './Step.vue';
import { REPORT_STAGES } from '../../../store/modules/reportStepper';
import { root } from 'postcss';
</script>
<style scoped lang="scss">
.track-root {
  position: relative;
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;

  .track-marks {
    width: calc(100% - 60px);
    flex-direction: row;
    justify-content: space-between;

    .mark {
      height: 24px;
      width: 24px;
      line-height: 24px;
      position: relative;
      background: rgb(252, 186, 25);
      border-top-left-radius: 3px;
      border-top-right-radius: 3px;
      color: #fff;
      text-align: center;

      &:before {
        content: '';
        position: absolute;
        bottom: -18px;
        left: 6px;
        width: 0;
        height: 0;
        border-color: transparent rgb(252, 186, 25) transparent transparent;
        border-style: solid;
        border-width: 12px 12px 12px 0;
        transform: rotate(-90deg);
      }
    }
  }

  .track-labels {
    width: calc(100% - 65px);
    flex-direction: row;
    justify-content: space-between;
    .label {
      &.completed {
        color: #003366;
      }
    }
  }

  .steps {
    width: calc(100% - 60px);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    position: absolute;
    bottom: 37px;
  }

  .track {
    width: calc(100% - 170px);
    height: 15px;
    background-color: lightgrey;
    border-radius: 5px;
    position: relative;

    .slide {
      width: 100%;
      height: 15px;
      background-color: #003366;
      border-radius: 5px;
      position: relative;

      &.w50 {
        animation: w50 1s ease forwards;
      }

      &.w100 {
        animation: w100 1s ease forwards;
      }
    }

    @keyframes w50 {
      from {
        width: 0%;
      }
      to {
        width: 50%;
      }
    }
    @keyframes w100 {
      from {
        width: 0%;
      }
      to {
        width: 100%;
      }
    }
  }
}

.step-root {
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
