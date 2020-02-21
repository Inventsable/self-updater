<template>
	<div class="menu"></div>
</template>

<script>
const spy = window.__adobe_cep__
	? require("cep-spy").default
	: null

export default {
	name: "adobe-menus",
	props: {
		refresh: {
      // If true, append Refresh Panel option to flyout and context
			type: Boolean,
			default: false
		},
		debug: {
      // If true, append Launch Localhost option to flyout and context
			type: Boolean,
			default: false
    },
    update: {
      type: Boolean,
      default: false,
    },
    git: {
      type: String,
      default: ''
    },
		context: {
			type: Array,
			default: function() {
				return [];
			}
		},
		flyout: {
			type: Array,
			default: function() {
				return [];
			}
		}
	},
	data() {
		return {
      outdated: false,
      repo: null,
      webVersion: null,
			// this.app.menus.context
			realContext: {
				menu: []
			},
			// this.app.menus.flyout
			realFlyout: {
				menu: []
			},
			refreshItem: {
				id: "refresh",
				label: "Refresh panel",
				enabled: true,
				checkable: false,
				checked: false,
				callback: this.refreshPage
			},
			debugItem: {
				id: "localhost",
				label: "Launch debug",
				enabled: true,
				checkable: false,
				checked: false,
				callback: this.launchDebug
      },
      updateItem: {
        id: "update",
        label: "Download newest version",
        enabled: true,
        checkable: false,
				checked: false,
				callback: this.downloadNewestZXP
      },
      noUpdateItem: {
        id: 'noUpdate',
        label: "Panel is up to date",
        enabled: false,
        checkable: false,
				checked: false,
      }
		};
	},
	computed: {
		contextMenu() {
			return this.realContext.menu;
		},
		hasAutoParams() {
			return this.refresh || this.debug;
		},
		// Flyout menu converts to XML from reactive JSON in data() above
		flyoutMenu() {
			return this.buildFlyoutMenuInXML();
		}
	},
	watch: {
		// Any updates to menu will trigger CEP to reset it and callback events
		context(menu) {
			this.buildMenu("context");
		},
		flyout(menu) {
			this.buildMenu("flyout");
		}
	},
	async mounted() {

		if (window.__adobe_cep__) {
      
      await this.init();
    } 
	},
	methods: {
		buildMenu(type) {
			let menu = [];
			if (this[type.toLowerCase()].length) {
				this[type.toLowerCase()].forEach((item, i) => {
					let template = this.buildMenuItem(type, item, i, []);
					menu.push(template);
				});
			}
			if (this.hasAutoParams && this[type.toLowerCase()].length)
				menu.push({ label: "---" });
			if (this.refresh) menu.push(this.refreshItem);
      if (this.debug) menu.push(this.debugItem);
      if (this.update && this.git.length)
        menu.push(this.isOutdated ? this.menuItem : this.noUpdateItem)
			const capitalized = type.replace(/^\w/, c => c.toUpperCase());
			this[`real${capitalized}`].menu = menu;
			this[`set${capitalized}Menu`]();
		},
		buildMenuItem(type, item, i, chain) {
			let template;
			if (item.label !== "---") {
				template = {
					id: `${chain.length ? chain.join("-") + "-" : ""}${i}`,
					enabled: true,
					checkable: false,
					checked: false
				};
				Object.assign(template, item);
			} else template = item;
			if (item.menu && item.menu.length)
				item.menu.forEach((child, c) => {
					item.menu[c] = this.buildMenuItem(
						type,
						child,
						c,
						[].concat(chain, i)
					);
				});
			return template;
		},
		findMenuItem(type, id, list = []) {
			if (!list.length) list = this[`real${type}`].menu;
			let found = list.find(menuItem => {
				return menuItem.id == id;
			});
			if (!found) {
				list.forEach(item => {
					if (item.menu && item.menu.length)
						found = this.findMenuItem(type, id, item.menu);
				});
			}
			if (found) return found;
		},
		menuClicked() {
			let type = typeof arguments[0] === "string" ? "Context" : "Flyout";
			let id =
				type === "Context" ? arguments[0] : arguments[0].data.menuId;
			let target = this.findMenuItem(type, id);
			let realId = this.getRealId(id);

			if (target.checkable && target.enabled) {
				target.checked = !target.checked;
				if (/flyout/i.test(type)) this.buildMenu("flyout");
			}
			target.callback
				? target.callback(target, realId, target.checked)
				: this.$emit(
						`${type.toLowerCase()}Click`,
						target,
						realId,
						target.checked
				  );
		},
		getRealId(id) {
			return /-/.test(id)
				? id.split("-").map(item => {
						return Number(item);
				  })
				: !/\D/.test(id)
				? Number(id)
				: id;
		},
		buildFlyoutMenuItemInXML(item) {
			let str = ``;
			if (item.id) {
				str += `<MenuItem Id="${item.id}" Label="${
					item.label
				}" Enabled="${item.enabled ||
					"true"}" Checkable="${item.checkable ||
					"false"}" Checked="${item.checked || "false"}"`;
				if (item.menu && item.menu.length) {
					str += ">";
					item.menu.forEach(child => {
						str += this.buildFlyoutMenuItemInXML(child);
					});
					str += "</MenuItem>";
				} else str += "/>";
			} else str += `<MenuItem Label="---" />`;
			return str;
		},
		buildFlyoutMenuInXML() {
			let str = `<Menu>`;
			this.realFlyout.menu.forEach((item, i) => {
				str += this.buildFlyoutMenuItemInXML(item, i);
			});
			return (str += `</Menu>`);
		},
		setContextMenu() {
			window.__adobe_cep__.invokeAsync(
				"setContextMenuByJSON",
				JSON.stringify(this.realContext),
				this.menuClicked
			);
		},
		setFlyoutMenu() {
			window.__adobe_cep__.invokeSync(
				"setPanelFlyoutMenu",
				this.flyoutMenu
			);
			window.__adobe_cep__.addEventListener(
				"com.adobe.csxs.events.flyoutMenuClicked",
				this.menuClicked
			);
		},
		refreshPage() {
			location.reload();
		},
		launchDebug() {
			spy.launchLocalhost();
    },
    async checkGitForUpdate() {
      if (this.update && this.git.length) {
        return this.outdated = this.compareVersions(
          JSON.parse(await this.grabRepoRaw(this.repo)).version
        );
      }
    },
		init() {
			this.buildMenu("context");
			this.buildMenu("flyout");
			window.__adobe_cep__.addEventListener(
				"com.adobe.csxs.events.flyoutMenuOpened",
				this.$emit("flyoutFocus")
			);
			window.__adobe_cep__.addEventListener(
				"com.adobe.csxs.events.flyoutMenuClosed",
				this.$emit("flyoutBlur")
      );
    },
    // UPDATE VIA OWN GITHUB REPO
    async grabRepoRaw(repo, file) {
      let data = await fetch(
        `https://raw.githubusercontent.com/${this.git}/master/package.json`
      ).catch(err => {
        console.err(err);
      });
      return data.text();
    },
    compareVersions(newest) {
      this.webVersion = newest;
      let web = newest.split("."), offline = spy.extVersion.split("."), isOutdated = false;
      web.forEach((v, i) => {
        if (Number(web[i]) > Number(offline[i])) isOutdated = true;
      });
      return isOutdated;
    },
    async downloadNewestZXP() {
      let target = `${spy.extName}_${this.webVersion}.zxp`
      if (!window.__adobe_cep__) {
        let version = JSON.parse(
          await this.grabRepoRaw("Inventsable/Lunch-Mama")
        ).version;
        spy.launchInNewTab(
          `https://github.com/${this.git}/raw/master/archive/${target}`
        );
      } else {
        cep.util.openURLInDefaultBrowser(
          `https://github.com/${this.git}/raw/master/archive/${target}`
        );
      }
      // this.$emit("promptUpdate");
      // this.hasDownloaded = true;
    }
	}
};
</script>

<style scoped>
.menu {
	margin: 0;
}
</style>
