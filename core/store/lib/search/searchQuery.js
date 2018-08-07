class SearchQuery {
  /**
    */
  constructor () {
    this._availableFilters = []
    this._appliedFilters = []
    this._searchText = ''
    console.log('create SearchQuery object')
  }

  /**
    * @return {Array} array of all available filters objects
    */
  getAvailableFilters () {
    return this._availableFilters
  }

  /**
    * @return {Array} array of applied filters objects
    */
  getAppliedFilters () {
    return this._appliedFilters
  }

  /**
    * @return {String}
    */
  getSearchText () {
    return this._searchText
  }

  /**
    * @param {String} key
    * @param {Object} value
    * @param {Object} scope // default, catalog, quicksearch
    * @return {Object}
    */
  applyFilter ({key, value, scope = 'default', options = Object}) {
    this._appliedFilters.push({
      attribute: key,
      value: value,
      scope: scope,
      options: options
    })

    return this
  }

  /**
    * @param {String} key
    * @param {Object} options // { eg price options ] }
    * @return {Object}
    */
  addAvailableFilter ({field, options = {}}) {
    // value can has only String, Array or numeric type
    this._availableFilters.push({
      field: field,
      options: options
    })

    return this
  }

  /**
  * @param {Array} filters
  * @return {Object}
  */
  setAvailableFilters (filters) {
    this._availableFilters = filters
    return this
  }

  /**
  * @param {String} searchText
  * @return {Object}
  */
  setSearchText (searchText) {
    this._searchText = searchText
    return this
  }
}

export default SearchQuery
