/**
 * DialogUtils assists with getting reponses from a dialog and allowing the code to excecute when a response is made.
 *
 * How to use:
 * Create the instance of the DialogUtils class.
 * The dialog should call dialogResponse with the users selection
 * Call GetDialogResponse to create the promise.
 * Then show the dialog.
 *
 * Example:
 * <template>
 *     <v-dialog v-model="confirmBackDialogVisible" width="auto" max-width="400">
 *       <v-card>
 *         <v-card-text> Do you want to go back? </v-card-text>
 *         <v-card-actions>
 *           <v-btn @click="booleanDialogUtils.dialogResponse(false)">No</v-btn>
 *           <v-btn @click="booleanDialogUtils.dialogResponse(true)">Yes</v-btn>
 *         </v-card-actions>
 *       </v-card>
 *     </v-dialog>
 *   </v-container>
 * </template>
 *
 * <script setup lang="ts">
 * import { DialogUtils } from '../utils/dialogUtils';
 *
 * const confirmBackDialogVisible = ref<boolean>(false);
 * const booleanDialogUtils = new DialogUtils<boolean>();
 *
 * onBeforeRouteLeave(async (to, from, next) => {
 *   confirmBackDialogVisible.value = true;
 *   const response = await booleanDialogUtils.getDialogResponse();
 *   confirmBackDialogVisible.value = false;
 *   next(response);
 * });
 * </script>
 */

export class DialogUtils<T> {
  private resolver: (value: T) => void;

  /**
   * Get the response via a Promise. This allows you to do an action when the response is made.
   * Must call getDialogResponse() BEFORE the user has an opertunity to call setDialogResponse() otherwise it will fail.
   * @returns
   */
  public getDialogResponse(): Promise<T> {
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  /**
   * The dialog calls this function to set the response selected by the user.
   * @param response
   */
  public setDialogResponse(response: T): void {
    this.resolver(response);
  }
}
