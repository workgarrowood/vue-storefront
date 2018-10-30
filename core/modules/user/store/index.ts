import { Module } from 'vuex'
import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import RootState from '@vue-storefront/store/types/RootState'
import UserState from '../types/UserState'

export const module: Module<UserState, RootState> = {
  namespaced: true,
  state: {
    token: '',
    refreshToken: '',
    groupToken: '',
    groupId: null,
    current: null,
    current_storecode: '',
    session_started: new Date(),
    orders_history: null
  },
  getters,
  actions,
  mutations
}
