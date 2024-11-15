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
          ><span class="plaintext-length">{{ plainTextLength }}</span
          ><span v-if="maxLength">
            / <span class="max-length">{{ maxLength }}</span></span
          ></small
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
import { onMounted, ref, watch } from 'vue';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';

const richTextToolbar = ref(null);
const richTextEditor = ref(null);
let quill: Quill | undefined = undefined;
const plainTextLength = ref<number | undefined>(undefined);

const emit = defineEmits(['update:modelValue', 'plainTextLengthChanged']);

const props = defineProps<{
  placeholder?: string | undefined;
  maxLength?: number | undefined;
  modelValue?: string | undefined | null;
  errorMessage?: string | undefined;
}>();

watch(
  () => props.modelValue,
  (value) => {
    setHtml(value);
  },
);

onMounted(() => {
  if (richTextEditor.value) {
    quill = new Quill(richTextEditor.value, {
      theme: 'snow',
      formats: ['italic', 'bold', 'underline', 'list'],
      placeholder: props.placeholder,
      modules: {
        toolbar: richTextToolbar.value,
      },
    });
    quill.on('text-change', onTextChanged);
    if (props.modelValue) {
      setHtml(props.modelValue);
    }
  }
});

const onTextChanged = (delta, oldDelta?, source?) => {
  plainTextLength.value = getPlainTextLength();
  emit('update:modelValue', getHtml());
  emit('plainTextLengthChanged', plainTextLength.value);
};

const setHtml = (html: string | undefined | null) => {
  if (html == getHtml()) {
    // Ignore if the incoming html is the same as the existing html.
    // This ensures we don't cause an infinite feedback loop of
    // update:modelValue events.
    return;
  }
  const delta = quill?.clipboard.convert({
    html: html !== null ? html : undefined,
  });
  if (delta) {
    quill?.setContents(delta, 'user');
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
  padding-left: 18px;
  padding-right: 18px;
  min-height: 24px;
}
.rich-text-area.error > * {
  border-color: red !important;
}

.rich-text-area .ql-toolbar {
  background-color: #00000009;
  border-left: 1px solid #aaaaaa;
  border-right: 1px solid #aaaaaa;
  border-bottom: none;
  border-top: 1px solid #aaaaaa;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.rich-text-area .ql-container {
  background-color: #ffffff;
  font-family: 'BCSans', 'Noto Sans', Verdana, Arial, sans-serif !important;
  height: 150px;
  font-size: 1rem;
  border-left: 1px solid #aaaaaa;
  border-right: 1px solid #aaaaaa;
  border-bottom: 1px solid #aaaaaa;
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
.rich-text-area:hover > * {
  border-color: black;
}

.rich-text-area .ql-container :deep(.ql-editor:before) {
  font-style: normal;
  color: #00000066;
}
</style>
