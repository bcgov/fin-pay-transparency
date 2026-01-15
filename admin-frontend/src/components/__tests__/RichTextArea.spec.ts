import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import RichTextArea from '../RichTextArea.vue';

const mockPlaintext = '123';
const mockHtml = `<p><strong>${mockPlaintext}</strong></p>`;
const maxLength = 100;


describe('RichTextArea', () => {
  let wrapper;
  let pinia;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(RichTextArea, {
      props: {
        modelValue: mockHtml,
        maxLength: maxLength,
      },
      global: {
        plugins: [vuetify, pinia],
      },
    });

    //wait for the async component to load
    await flushPromises();
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      vi.clearAllMocks();
      wrapper.unmount();
    }
  });

  it('editor content is correct', () => {
    const editor = wrapper.find('.ql-editor');
    expect(editor.wrapperElement.innerHTML).toStrictEqual(mockHtml);
  });

  it('plaintext content length displays', () => {
    const plaintextLengthElem = wrapper.find('.plaintext-length');
    expect(plaintextLengthElem.wrapperElement.innerHTML).toStrictEqual(
      `${mockPlaintext.length}`,
    );
  });

  it('max plaintext content length displays', () => {
    const maxLengthElem = wrapper.find('.max-length');
    expect(maxLengthElem.wrapperElement.innerHTML).toStrictEqual(
      `${maxLength}`,
    );
  });
});
