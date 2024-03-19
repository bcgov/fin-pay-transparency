<template>
  <v-row>
    <v-col>
      <div class="track-root d-flex align-center">
        <div class="track-marks d-flex mb-6">
          <div class="step-root" v-for="(step, index) in REPORT_STAGES">
            <div :data-testid="'report-step-mark-' + step.value" :class="getMarkClassName(step)">
              {{ index + 1 }}
            </div>
          </div>
        </div>
        <div class="track">
          <div :class="getProgressClassName()"></div>
        </div>
        <div class="steps d-flex justify-content-center">
          <div class="step-root" v-for="(item, index) in REPORT_STAGES">
            <Step
              :value="item.value"
              :label="item.label"
              :url="item.url"
              :index="index"
              :disabled="item.isDisabled(stage)"
              :completed="item.isComplete(stage)"
            />
          </div>
        </div>
        <div class="track-labels d-flex mt-5">
          <div class="step-root" v-for="item in REPORT_STAGES">
            <div :class="getLabelClassName(item)">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import Step from './Step.vue';
import {
  REPORT_STAGES,
  useReportStepperStore,
  IStageOption,
} from '../../../store/modules/reportStepper';
import { storeToRefs } from 'pinia';
const { stage } = storeToRefs(useReportStepperStore());

const getProgressClassName = () => {
  let progressWidthClass = 'w0';
  if (stage.value === 'REVIEW') {
    progressWidthClass = 'w50';
  } else if (stage.value === 'FINAL') {
    progressWidthClass = 'w100';
  }
  return `slide ${progressWidthClass}`;
};

const getLabelClassName = (step: IStageOption) => {
  const completeClassName = step?.isComplete(stage.value) ? 'completed' : '';
  return `label d-flex justify-center flex-column ${completeClassName}`;
};

const getMarkClassName = (step: IStageOption) => {
  const completeClassName = step?.isComplete(stage.value) ? 'completed' : '';
  return `mark d-flex justify-center flex-column ${completeClassName}`;
};
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
      height: 20px;
      width: 20px;
      line-height: 20px;
      font-size: small;
      position: relative;
      background: rgb(124, 124, 123);
      border-top-left-radius: 3px;
      border-top-right-radius: 3px;
      color: #fff;
      text-align: center;

      &.completed {
        background: rgb(252, 186, 25);
        &:before {
          border-color: transparent rgb(252, 186, 25) transparent transparent;
        }
      }

      &:before {
        content: '';
        position: absolute;
        bottom: -15px;
        left: 5px;
        width: 0;
        height: 0;
        border-color: transparent rgb(124, 124, 123) transparent transparent;
        border-style: solid;
        border-width: 10px 10px 10px 0;
        transform: rotate(-90deg);
      }
    }
  }

  .track-labels {
    width: calc(100% - 65px);
    flex-direction: row;
    justify-content: space-between;
    .step-root {
      .label {
        font-size: small;
        font-weight: 500;
        color: rgb(124, 124, 123);
        &.completed {
          color: #003366;
        }
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
    bottom: 30px;
  }

  .track {
    width: calc(100% - 170px);
    height: 8px;
    background-color: lightgrey;
    border-radius: 5px;
    position: relative;

    .slide {
      height: 8px;
      background-color: #003366;
      border-radius: 5px;
      position: relative;

      &.w0 {
        width: 0px;
      }

      &.w50 {
        width: 50%;
        animation: w50 1s ease forwards;
      }

      &.w100 {
        width: 100%;

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
