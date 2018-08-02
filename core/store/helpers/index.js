import builder from 'bodybuilder'
import SearchQuery from 'core/store/lib/search/searchQuery'
import config from '../lib/config'

/**
 * Create slugify -> "create-slugify" permalink  of text
 * @param {String} text
 */
export function slugify (text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
}

/**
 * Re-format category path to be suitable for breadcrumb
 * @param {Array} categoryPath
 */
export function breadCrumbRoutes (categoryPath) {
  const tmpRts = []
  for (let sc of categoryPath) {
    tmpRts.push({
      name: sc.name,
      route_link: (config.products.useShortCatalogUrls ? '/' : '/c/') + sc.slug
    })
  }

  return tmpRts
}

/**
 * Return configurable product thumbnail depending on the configurable_children
 * @param {object} product
 * @param {bool} ignoreConfig
 */
export function productThumbnailPath (product, ignoreConfig = false) {
  let thumbnail = product.image
  if ((product.type_id && product.type_id === 'configurable') && product.hasOwnProperty('configurable_children') &&
    product.configurable_children.length && (ignoreConfig || !product.is_configured) &&
    ('image' in product.configurable_children[0])
  ) {
    thumbnail = product.configurable_children[0].image
    if (!thumbnail || thumbnail === 'no_selection') {
      const childWithImg = product.configurable_children.find(f => f.image && f.image !== 'no_selection')
      if (childWithImg) {
        thumbnail = childWithImg.image
      } else {
        thumbnail = product.image
      }
    }
  }
  return thumbnail
}

export function buildFilterProductsQuery (currentCategory, chosenFilters, defaultFilters = null) {
  let filterQr = baseFilterProductsQuery(currentCategory, defaultFilters == null ? config.products.defaultFilters : defaultFilters)
  let attrFilterBuilder = (filterQr, attrPostfix = '') => {
    for (let code of Object.keys(chosenFilters)) {
      const filter = chosenFilters[code]

      if (filter.attribute_code !== 'price') {
        filterQr = filterQr.andFilter('match', filter.attribute_code + attrPostfix, filter.id)
      } else { // multi should be possible filter here?
        const rangeqr = {}
        if (filter.from) {
          rangeqr['gte'] = filter.from
        }
        if (filter.to) {
          rangeqr['lte'] = filter.to
        }
        filterQr = filterQr.andFilter('range', filter.attribute_code, rangeqr)
      }
    }
    return filterQr
  }
  filterQr = filterQr.orFilter('bool', (b) => attrFilterBuilder(b))
    .orFilter('bool', (b) => attrFilterBuilder(b, '_options').filter('match', 'type_id', 'configurable')) // the queries can vary based on the product type
  return filterQr
}

export function baseFilterProductsQuery (parentCategory, filters = []) { // TODO add aggregation of color_options and size_options fields
  let searchProductQuery = builder().andFilter('range', 'visibility', { 'gte': 2, 'lte': 4 }/** Magento visibility in search & categories */)

  // add filters to query
  for (let attrToFilter of filters) {
    if (attrToFilter !== 'price') {
      searchProductQuery = searchProductQuery.aggregation('terms', attrToFilter)
      searchProductQuery = searchProductQuery.aggregation('terms', attrToFilter + '_options')
    } else {
      searchProductQuery = searchProductQuery.aggregation('terms', attrToFilter)
      searchProductQuery.aggregation('range', 'price', {
        ranges: [
          { from: 0, to: 50 },
          { from: 50, to: 100 },
          { from: 100, to: 150 },
          { from: 150 }
        ]
      })
    }
  }

  let childCats = [parentCategory.id]
  if (parentCategory.children_data) {
    let recurCatFinderBuilder = (category) => {
      if (!category) {
        return
      }

      if (!category.children_data) {
        return
      }

      for (let sc of category.children_data) {
        if (sc && sc.id) {
          childCats.push(sc.id)
        }
        recurCatFinderBuilder(sc)
      }
    }
    recurCatFinderBuilder(parentCategory)
  }
  searchProductQuery = searchProductQuery.filter('terms', 'category.category_id', childCats)
  return searchProductQuery
}

// ----------------------
export function buildFilterProductsSearchQuery (currentCategory, chosenFilters, defaultFilters = null) {
  let filterQr = baseFilterProductsSearchQuery(currentCategory, defaultFilters == null ? config.products.defaultFilters : defaultFilters)

  // add choosedn filters
  for (let code of Object.keys(chosenFilters)) {
    const filter = chosenFilters[code]

    if (filter.attribute_code !== 'price') {
      filterQr = filterQr.applyFilter({type: 'match', key: filter.attribute_code, value: filter.id, scope: 'catalog'})
    } else { // multi should be possible filter here?
      const rangeqr = {}
      if (filter.from) {
        rangeqr['gte'] = filter.from
      }
      if (filter.to) {
        rangeqr['lte'] = filter.to
      }
      filterQr = filterQr.applyFilter({type: 'range', key: filter.attribute_code, value: rangeqr, scope: 'catalog'})
    }
  }

  return filterQr
}

export function baseFilterProductsSearchQuery (parentCategory, filters = []) { // TODO add aggregation of color_options and size_options fields
  let searchProductQuery = new SearchQuery()
  searchProductQuery = searchProductQuery
    .applyFilter({type: 'terms', key: 'visibility', value: [2, 3, 4]}) // try andQuery

  // Add available filters
  for (let attrToFilter of filters) {
    searchProductQuery = searchProductQuery.addAvailableFilter({field: attrToFilter})
  }

  let childCats = [parentCategory.id]
  if (parentCategory.children_data) {
    let recurCatFinderBuilder = (category) => {
      if (!category) {
        return
      }

      if (!category.children_data) {
        return
      }

      for (let sc of category.children_data) {
        if (sc && sc.id) {
          childCats.push(sc.id)
        }
        recurCatFinderBuilder(sc)
      }
    }
    recurCatFinderBuilder(parentCategory)
  }
  searchProductQuery = searchProductQuery.applyFilter({type: 'terms', key: 'category_ids', value: childCats})
  return searchProductQuery
}
