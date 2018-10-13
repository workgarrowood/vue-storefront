import { Module } from 'vuex'
import { RouteConfig, NavigationGuard } from 'vue-router'
import Vue, { VueConstructor } from 'vue'
import rootStore from '@vue-storefront/store'
import router from '@vue-storefront/core/router'

/**
 * Extends VS router configuration.
 * @param routes routes that'll be added to router config
 * @param beforeEach function executed before entering each route
 * @param afterEach function executed after entering each route
 */
function extendRouter (routes?: RouteConfig[], beforeEach?: NavigationGuard, afterEach?: NavigationGuard): void {
  if (routes) router.addRoutes(routes)
  if (beforeEach) router.beforeEach(beforeEach)
  if (afterEach) router.afterEach(afterEach)
}

export interface VueStorefrontModuleConfig {
  key: string;
  store?: Module<any, any>;
  router?: { routes?: RouteConfig[], beforeEach?: NavigationGuard, afterEach?: NavigationGuard },
  serviceWorker?: (self: ServiceWorkerRegistration) => void,
  beforeRegistration?: (Vue: VueConstructor, config: Object) => void,
  afterRegistration?: (Vue: VueConstructor, config: Object) => void,
}

export class VueStorefrontModule {
  constructor (
    private _c: VueStorefrontModuleConfig
  ) { }
  
  /**
   * Registers module in app with before/after hooks, store and router.
   * Should be called inside an apps entry point available for both server and client.
   */
  public registerInApp (): void {
    if (this._c.beforeRegistration) this._c.beforeRegistration(Vue, rootStore.state.config)
    if (this._c.store) rootStore.registerModule(this._c.key, this._c.store)
    if (this._c.router) extendRouter(this._c.router.routes, this._c.router.beforeEach, this._c.router.afterEach)
    if (this._c.afterRegistration) this._c.afterRegistration(Vue, rootStore.state.config)
  }

  public registerInServiceWorker (): void {
    // TBD
  }
}
