// src/services/api.js (或 api/index.js)
import axios from 'axios'
import router from '@/router'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: 'http://ouc.it.srv.thinkpadstore.lighilit.top/',
  timeout: 5000, // 减少超时时间到5秒
  headers: {
    'Content-Type': 'application/json',
    // 可以添加认证头等
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 添加认证 token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  response => response.data, // 直接返回 data，简化使用
  error => {
    // 统一错误处理
    console.error('API Error:', error.response?.status, error.message)

    // 可以根据状态码进行不同处理
    if (error.response?.status === 401) {
      // 未授权，清除本地token并跳转登录
      // localStorage.removeItem('auth_token')
      // localStorage.removeItem('refresh_token')
      // if (window.location.pathname !== '/login') {
      //   window.location.href = '/login'
      // }
      
      // 白名单页面，不跳登录
      if (whiteList.includes(currentPath)) {
        return Promise.reject(error)
      }

      // 防止无限循环
      if (originalRequest._retry) {
        router.push('/login')
        return Promise.reject(error)
      }

      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        router.push('/login')
        return Promise.reject(error)
      }

      try {
        const res = axios.post(
          'http://ouc.it.srv.thinkpadstore.lighilit.top/login/token/refresh/',
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )

        localStorage.setItem('auth_token', res.data.access)
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`
        return apiClient(originalRequest)
      } catch (e) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        router.push('/login')
        return Promise.reject(e)
      }
    } else if (error.response?.status === 404) {
      // 资源不存在
      throw new Error('请求的资源不存在')
    }

    throw error
  }
)

// 产品相关 API
export const productService = {
  // 获取所有产品
  getAll() {
    return apiClient.get('/product/')
  },
  
  // 按ID获取产品
  getById(id) {
    return apiClient.get(`/product/${id}/`)
  }
}

// 购物车相关 API
export const cartService = {
  // 获取购物车列表
  getAll() {
    return apiClient.get('/cart/')
  },

  // 添加商品到购物车
  create(CartItem) {
    return apiClient.post('/cart/', CartItem)
  },

  // 获取单个购物车项
  getById(id) {
    return apiClient.get(`/cart/${id}/`)
  },

  // 更新购物车项（全量）
  update(id, CartItem) {
    return apiClient.put(`/cart/${id}/`, CartItem)
  },

  // 部分更新
  partialUpdate(id, CartItem) {
    return apiClient.patch(`/cart/${id}/`, CartItem)
  },

  // 删除购物车项
  delete(id) {
    return apiClient.delete(`/cart/${id}/`)
  }
}

// 认证相关 API

export const userService = {
  register(data) {
    return apiClient.post('/user/', {
      username: data.username,
      password: data.password,
      email: data.email
    })
  },
  login(data) {
    return apiClient.post('/login/', {
      username: data.username,
      password: data.password
    })
  },

  // 刷新token
  refreshToken() {
    const refresh_token = localStorage.getItem('refresh_token')
    return apiClient.post('/login/token/refresh/', { refresh: refresh_token })
  },

}

// 其他服务...
// export const orderService = { ... }

export default apiClient