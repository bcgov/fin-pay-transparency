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
import 'quill-paste-smart';
import { onMounted, ref, watch } from 'vue';

const richTextToolbar = ref(null);
const richTextEditor = ref(null);
let quill: Quill | undefined = undefined;
const plainTextLength = ref<number | undefined>(undefined);

const emit = defineEmits(['update:modelValue']);

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
      placeholder: props.placeholder,
      modules: {
        toolbar: richTextToolbar.value,
        clipboard: {
          //restrict the types of content that can be pasted into the editor.
          allowed: {
            tags: ['b', 'strong', 'u', 'em', 'i', 'p', 'br', 'ul', 'ol', 'li'],
            attributes: ['data-list'],
          },
        },
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
};

const setHtml = (html: string | undefined | null) => {
  if (html == getHtml()) {
    // Ignore if the incoming html is the same as the existing html.
    // This ensures we don't cause an infinite feedback loop of
    // update:modelValue events.
    return;
  }
  const delta = quill?.clipboard.convert({ html: html ? html : undefined });
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
