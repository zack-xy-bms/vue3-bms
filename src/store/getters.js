
import { generateColors } from '@/utils/theme'
import { getItem } from '@/utils/storage'
import { MAIN_COLOR } from '@/constant/'

const getters = {
  token: state => state.user.token,
  hasUserInfo: state => JSON.stringify(state.user.userInfo) !== '{}',
  userInfo: state => state.user.userInfo,
  userName: state => state.user.userName,
  cssVar: state => ({
    ...state.theme.variables,
    ...generateColors(getItem(MAIN_COLOR))
  }),
  sidebarOpened: state => state.app.sidebarOpened,
  language: state => state.app.language,
  mainColor: state => state.theme.mainColor,
  tagsViewList: state => state.app.tagsViewList
}

export default getters
