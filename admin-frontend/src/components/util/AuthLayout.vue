<template>
  <v-app-bar absolute style="z-index: 1002" class="d-flex justify-center">
    <v-container>
      <span class="text-primary page-title">Gender Equity Office</span>
    </v-container>
  </v-app-bar>
  <v-row class="fill-height container">
    <v-col xs="12" class="d-flex flex-column justify-center align-center action">
      <div class="d-flex flex-column">
        <slot name="content"></slot>
      </div>
    </v-col>
    <v-col xs="12" class="justify-center cover d-none d-xs-none d-sm-none d-md-flex"> </v-col>
  </v-row>
</template>

<script>
</script>

<style scoped lang="scss">
.page-title {
  font-size: larger;
}

.container {
  margin: 0;
  width: 100%;
}

.title {
  font-weight: 700;
  margin-bottom: 20px
}

.action {
  height: calc(100vh - 64px);
}

.cover {
  height: calc(100vh - 64px);
  background-image: url('/login-cover.jpeg');
  background-size: cover;
  background-position: center;
}
</style>
