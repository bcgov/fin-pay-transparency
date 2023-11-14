import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { authStore } from '../auth';
import { useCodeStore } from '../codeStore';

/*
vi.mock('../auth', async (importOriginal) => {
  const mod: any = await importOriginal()
  return {
    ...mod,
    isAuthenticated: ref(true),
  }
})
*/


describe("CodeStore", () => {
  let codeStore;
  let auth;
  let pinia;

  beforeEach(() => {

    pinia = createTestingPinia({});
    setActivePinia(pinia)

    auth = authStore();
    codeStore = useCodeStore();

  })

  afterEach(() => {

  })

  it('Fetches employee range count and naics code when auth status becomes true', async () => {

    auth.$subscribe((mutation, state) => {
      console.log(state)
    })
    codeStore.$subscribe((mutation, state) => {
      console.log("codestore callback")
      console.log(state)
    })
    auth.isAuthenticated = true;
    auth.jwtToken = "fake token";
    //auth.$patch({ isAuthenticated: true })
    //codeStore.$patch({ isAuthenticated: true })
    //auth.setJwtToken("asfe");


    //const { isAuthenticated } = storeToRefs(auth)

    //await codeStore.$patch({ isAuthenticated: true } as any)
  })

})