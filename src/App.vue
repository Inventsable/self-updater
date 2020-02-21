<template>
  <div id="app">
    <!-- git-update is username/repo-name, as in "Inventsable/self-updater" -->
    <Menus refresh debug :git-update="repo" />
    <Panel>
      <div class="versions">
        <div class="version-wrap">
          <span class="anno">web</span>
          <span>{{webVersion}}</span>
        </div>
        <span style="margin-bottom: 10px;">{{comparator}}</span>
        <div class="version-wrap">
          <span class="anno">local</span>
          <span>{{localVersion}}</span>
        </div>      
      </div>
    </Panel>
  </div>
</template>

<script>
import spy from 'cep-spy'

export default {
  name: "app",
  data: () => ({
    repo: 'Inventsable/self-updater',
    webVersion: null,
    localVersion: null,
    comparator: '',
  }),
  components: {
    Panel: require('./components/Panel').default,
    Menus: require('./components/Menus').default
  },
  async mounted() {
    this.webVersion = JSON.parse(await this.getWebVersion()).version || '1.0.0'
    this.localVersion = spy.extVersion;

    this.comparator = (this.webVersion === this.localVersion) ? '===' : '!=='
  },
  methods: {
    async getWebVersion() {
      let data = await fetch(
        `https://raw.githubusercontent.com/${this.repo}/master/package.json`
      ).catch(err => {
        console.err(err);
      });
      return data.text();
    },
  }
};
</script>

<style>
.versions {
  font-size: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.version-wrap {
  margin: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.anno {
  font-size: 10px;
  text-transform: uppercase;
}
</style>>