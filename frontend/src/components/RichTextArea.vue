<template>
  <div
    ref="richTextArea"
    class="rich-text-area"
    :class="errorMessage ? 'error' : ''"
  >
    <div ref="richTextToolbar" class="rich-text-toolbar">
      <span class="ql-formats">
        <button class="ql-bold"></button>
        <button class="ql-italic"></button>
        <button class="ql-underline"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered"></button>
        <button class="ql-list" value="bullet"></button>
      </span>
    </div>
    <div ref="richTextEditor" class="rich-text-editor rich-text"></div>
    <div class="footer d-flex justify-space-between">
      <div>
        <small v-if="errorMessage" class="text-error">{{ errorMessage }}</small>
      </div>
      <div>
        <small
          v-if="plainTextLength && maxLength"
          :class="{
            'text-error': plainTextLength > maxLength,
          }"
          >{{ plainTextLength
          }}<span v-if="maxLength"> / {{ maxLength }}</span></small
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'RichTextArea',
};
</script>
<script setup lang="ts">
import Quill from 'quill';
import { onMounted, ref } from 'vue';

const richTextToolbar = ref(null);
const richTextEditor = ref(null);
let quill: Quill | undefined = undefined;
const plainTextLength = ref<number | undefined>(undefined);

const props = defineProps<{
  placeholder?: string | undefined;
  maxLength?: number | undefined;
  initialValue?: string | undefined;
  errorMessage?: string | undefined;
}>();

onMounted(() => {
  if (richTextEditor.value) {
    quill = new Quill(richTextEditor.value, {
      theme: 'snow',
      placeholder: props.placeholder,
      modules: {
        toolbar: richTextToolbar.value,
      },
    });
    quill.on('text-change', onTextChanged);
  }
});

const onTextChanged = (delta, oldDelta, source) => {
  if (quill) {
    plainTextLength.value = getPlainTextLength();
  }
};

/* public interface */
const getHtml = () => {
  return quill ? quill.getSemanticHTML() : '';
};

const getPlainText = () => {
  return quill ? quill.getText() : '';
};

const getPlainTextLength = () => {
  return quill ? quill.getLength() - 1 : 0;
};
</script>
<style scoped lang="scss">
.rich-text-area .footer {
  min-height: 20px;
}
.rich-text-area.error .ql-container {
  border-bottom: 1px solid #ff0000;
}

.rich-text-area .ql-toolbar {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  background-color: #00000006;
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #00000016;
}
.rich-text-area .ql-container {
  background-color: #00000008;
  font-family: 'BCSans', 'Noto Sans', Verdana, Arial, sans-serif !important;
  height: 150px;
  border: none;
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #aaaaaa;
}
.ql-container:hover,
.ql-container:active {
  background-color: #00000010;
}
</style>
