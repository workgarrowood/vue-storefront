import rootStore from '@vue-storefront/store'
import { MicrocartProduct } from '@vue-storefront/core/modules/cart/components/Product.ts'
import i18n from '@vue-storefront/i18n'

export default {
  data () {
    // depreciated
    return {
      qty: 0,
      isEditing: false
    }
  },
  computed: {
    askBeforeRemoveProduct () {
      return rootStore.state.config.cart.askBeforeRemoveProduct
    }
  },
  beforeMount () {
    // deprecated, will be moved to theme or removed in the near future #1742
    this.$bus.$on('cart-after-itemchanged', this.onProductChanged)
    this.$bus.$on('notification-after-itemremoved', this.onProductRemoved)
  },
  beforeDestroy () {
    // deprecated, will be moved to theme or removed in the near future #1742
    this.$bus.$off('cart-after-itemchanged', this.onProductChanged)
    this.$bus.$off('notification-after-itemremoved', this.onProductRemoved)
  },
  methods: {
    removeItem () {
      if (this.askBeforeRemoveProduct) {
        this.$store.dispatch('notification/spawnNotification', {
          type: 'warning',
          item: this.product,
          message: i18n.t('Are you sure you would like to remove this item from the shopping cart?'),
          action2: { label: i18n.t('OK'), action: this.removeFromCart },
          action1: { label: i18n.t('Cancel'), action: 'close' },
          hasNoTimeout: true
        })
      } else {
        this.removeFromCart()
      }
    },
    updateQuantity () {
      // additional logic will be moved to theme
      this.qty = parseInt(this.qty)
      if (this.qty <= 0) {
        this.qty = this.product.qty
      }
      MicrocartProduct.methods.updateQuantity.call(this, this.qty)
      this.isEditing = !this.isEditing
    },
    onProductChanged (event) {
      // deprecated, will be moved to theme or removed in the near future #1742
      if (event.item.sku === this.product.sku) {
        this.$forceUpdate()
      }
    },
    onProductRemoved (event) {
      if (event.item.sku === this.product.sku) {
        this.removeFromCart(event.item)
      }
    },
    switchEdit () {
      // will be moved to default theme in the near future
      this.isEditing ? this.updateQuantity() : this.qty = this.product.qty
      this.isEditing = !this.isEditing
    }
  },
  mixins: [
    MicrocartProduct
  ]
}
