/**
 * Allows us to import .Vue files in ts files
 */
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}
