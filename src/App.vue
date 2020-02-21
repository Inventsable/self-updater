<template>
  <div id="app">
    <Panel>
      <Menus refresh debug update git="Inventsable/self-updater" />
      <span>HELLO WORLD</span>
    </Panel>
    
  </div>
</template>

<script>
export default {
  name: "app",
  components: {
    Panel: require('./components/Panel').default,
    Menus: require('./components/Menus').default
  },
};
</script>