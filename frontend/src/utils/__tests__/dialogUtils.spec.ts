import { describe, it, expect } from 'vitest';
import { DialogUtils } from '../dialogUtils';

describe('DialogUtils', () => {
  it('captures multiple different responses if the response is set after', () => {
    const dlg = new DialogUtils<string>();
    dlg.getDialogResponse().then((response1) => {
      expect(response1).toBe('abcdef');
    });
    dlg.setDialogResponse('abcdef');

    //dlg.reset();
    dlg.getDialogResponse().then((response2) => {
      expect(response2).toBe('zyxw');
    });
    dlg.setDialogResponse('zyxw');
  });
});
