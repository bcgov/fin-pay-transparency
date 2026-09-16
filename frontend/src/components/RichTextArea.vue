<template>
  <div
    ref="richTextArea"
    class="rich-text-area"
    :class="errorMessage ? 'error' : ''"
  >
    <div ref="richTextToolbar" class="rich-text-toolbar">
      <span class="ql-formats">
        <button type="button" class="ql-bold" title="Bold"></button>
        <button type="button" class="ql-italic" title="Italic"></button>
        <button type="button" class="ql-underline" title="Underline"></button>
      </span>
      <span class="ql-formats">
        <button
          type="button"
          class="ql-list"
          value="ordered"
          title="Ordered List"
        ></button>
        <button
          type="button"
          class="ql-list"
          value="bullet"
          title="Bullet List"
        ></button>
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

const richTextToolbar = ref<HTMLElement>();
const richTextEditor = ref<HTMLElement>();
let quill: Quill | undefined = undefined;
const plainTextLength = ref<number>();

const emit = defineEmits(['update:modelValue', 'plainTextLengthChanged']);

const props = defineProps<{
  placeholder?: string;
  maxLength?: number;
  modelValue?: string | null;
  errorMessage?: string;
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
        keyboard: {
          bindings: {
            // Tab should move to next form element for accessibility reasons.  Quill's default behavior is to insert a tab character into the editor.
            tab: {
              key: 'Tab',
              handler: function (range, context) {
                // Returning true propagates the event to the browser's default behavior
                return true;
              },
            },
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
    html: html ?? undefined,
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
