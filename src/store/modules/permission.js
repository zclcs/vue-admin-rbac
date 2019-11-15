import { asyncRoutes, constantRoutes } from '@/router'
import { deepClone } from '@/utils/index'

const clientRoutes = deepClone(asyncRoutes)

/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 *
 * @param {arr} clientAsyncRoutes 前端保存动态路由
 * @param {arr} serverRouter 后端保存动态路由
 */
function filterPermissionRoutes(serverRoutes, clientRoutes) {
  const res = []

  clientRoutes.forEach(clientRoute => {
    const tmp = { ...clientRoute }
    serverRoutes.forEach(serverRoute => {
      if (clientRoute.name === serverRoute.name) {
        tmp.meta.roles = serverRoute.roles
      }
    })
    if (tmp.children) {
      tmp.children = filterPermissionRoutes(serverRoutes, tmp.children)
    }
    res.push(tmp)
  })

  return res
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {

  generateRoutes({ commit }, { roles, routes }) {
    const PermissionRouters = filterPermissionRoutes(routes, clientRoutes)
    console.log(PermissionRouters)
    return new Promise(resolve => {
      let accessedRoutes
      if (roles.includes('admin')) {
        accessedRoutes = PermissionRouters || []
      } else {
        accessedRoutes = filterAsyncRoutes(PermissionRouters, roles)
      }
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
