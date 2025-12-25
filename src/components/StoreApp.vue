<template>
  <div class="page">
    <AppHeader />

    <!-- 轮播图 -->
    <header class="hero" v-if="heroImages.length > 0">
      <div class="carousel" @mouseenter="pause" @mouseleave="play">
        <button class="nav-btn prev" @click="prev">
          <i class="arrow-left"></i>
        </button>
        <button class="nav-btn next" @click="next">
          <i class="arrow-right"></i>
        </button>

        <div
          class="slides"
          :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
        >
          <div class="slide" v-for="(item, i) in heroImages" :key="i">
            <img :src="item.image || defaultImage" :alt="item.name" />
          </div>
        </div>

        <div class="dots">
          <button
            v-for="(_, i) in heroImages"
            :key="i"
            :class="{ active: i === currentIndex }"
            @click="setIndex(i)"
          ></button>
        </div>
      </div>
    </header>

    <!-- 分类导航栏-->
    <div class="category-nav">
      <div class="category-tabs">
        <div
          class="category-tab"
          v-for="category in categoryList"
          :key="category.type"
          @click="switchCategory(category.type)"
          :class="{ active: currentCategory === category.type }"
        >
          <img
            :src="
              currentCategory === category.type
                ? category.activeIcon
                : category.icon
            "
            :alt="category.name"
            class="category-icon"
          />
          <span>{{ category.name }}</span>
        </div>
      </div>
    </div>

    <!-- 商品网格 -->
    <main class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="error" class="error">
        {{ error }}
        <button @click="fetchProducts" class="retry-btn">重试</button>
      </div>
      <div v-if="!loading && products.length === 0" class="empty">暂无商品</div>

      <div class="grid" v-if="products.length > 0">
        <router-link
          class="card"
          v-for="product in displayedProducts"
          :key="product.id"
          :to="`/product/${product.id}`"
        >
          <div class="card-inner">
            <img
              :src="product.image || defaultImage"
              :alt="product.name"
              @error="handleImageError"
            />
            <div class="caption">{{ product.name }}</div>
            <div class="price" v-if="product.price">
              ¥{{ formatPrice(product.price) }}
            </div>
          </div>
        </router-link>
      </div>

      <div class="pagination" v-if="products.length > pageSize">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">
          下一页
        </button>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from "./AppHeader.vue";
import { ref, onMounted, onUnmounted, computed } from "vue";
import { productService } from "@/services/api";
import logo from "@/assets/Lenovo.png";
import allDefault from "@/assets/icons/all-default.png";
import desktopDefault from "@/assets/icons/desktop-default.png";
import desktopActive from "@/assets/icons/desktop-active.png";
import laptopDefault from "@/assets/icons/laptop-default.png";
import laptopActive from "@/assets/icons/laptop-active.png";
import thinkpadDefault from "@/assets/icons/thinkpad-default.png";
import thinkpadActive from "@/assets/icons/thinkpad-active.png";
import tabletDefault from "@/assets/icons/tablet-default.png";
import tabletActive from "@/assets/icons/tablet-active.png";
import phoneDefault from "@/assets/icons/phone-default.png";
import phoneActive from "@/assets/icons/phone-active.png";
import serviceDefault from "@/assets/icons/service-default.png";
import serviceActive from "@/assets/icons/service-active.png";
import monitorDefault from "@/assets/icons/monitor-default.png";
import monitorActive from "@/assets/icons/monitor-active.png";
import smartDefault from "@/assets/icons/smart-default.png";
import smartActive from "@/assets/icons/smart-active.png";

export default {
  name: "StoreApp",
  components: { AppHeader },
  setup() {
    const defaultImage = logo;
    const products = ref([]);
    const allProducts = ref([]);
    const heroImages = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const currentIndex = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(12);

    // 分类列表：type对应商品的category字段
    const categoryList = ref([
      {
        type: "all",
        name: "全部",
        icon: allDefault, // 用导入的变量
        activeIcon: allDefault,
      },
      {
        type: "desktop",
        name: "Lenovo台式机",
        icon: desktopDefault,
        activeIcon: desktopActive,
      },
      {
        type: "laptop",
        name: "Lenovo笔记本",
        icon: laptopDefault, // 替换原来的iconClass
        activeIcon: laptopActive,
      },
      {
        type: "thinkpad",
        name: "ThinkPad电脑",
        icon: thinkpadDefault,
        activeIcon: thinkpadActive,
      },
      {
        type: "tablet",
        name: "平板",
        icon: tabletDefault,
        activeIcon: tabletActive,
      },
      {
        type: "phone",
        name: "手机",
        icon: phoneDefault,
        activeIcon: phoneActive,
      },
      {
        type: "service",
        name: "选件/服务",
        icon: serviceDefault,
        activeIcon: serviceActive,
      },
      {
        type: "monitor",
        name: "显示器/IP周边",
        icon: monitorDefault,
        activeIcon: monitorActive,
      },
      {
        type: "smart",
        name: "智能产品",
        icon: smartDefault,
        activeIcon: smartActive,
      },
    ]);
    const currentCategory = ref("all"); // 默认显示全部

    let timer = null;

    const totalPages = computed(() => {
      return Math.ceil(products.value.length / pageSize.value);
    });

    const displayedProducts = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return products.value.slice(start, end);
    });

    const next = () => {
      currentIndex.value = (currentIndex.value + 1) % heroImages.value.length;
    };
    const prev = () => {
      currentIndex.value =
        (currentIndex.value - 1 + heroImages.value.length) %
        heroImages.value.length;
    };
    const play = () => {
      stop();
      if (heroImages.value.length > 1) {
        timer = setInterval(next, 3000);
      }
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const pause = () => stop();
    const setIndex = (i) => (currentIndex.value = i);

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };
    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    const formatPrice = (price) => parseFloat(price).toFixed(2);
    const handleImageError = (event) => {
      event.target.src = defaultImage;
    };

    const switchCategory = (type) => {
      currentCategory.value = type;
      currentPage.value = 1;
      if (type === "all") {
        products.value = allProducts.value;
      } else {
        products.value = allProducts.value.filter((p) => p.category === type);
      }
    };

    // fetchProducts：改造为给商品加category字段（适配分类）
    const fetchProducts = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await productService.getAll();
        if (response.success !== false) {
          const data = response.data || response;
          allProducts.value = (Array.isArray(data) ? data : []).map(
            (product) => {
              // 自动给商品分配category（也可以让后端直接返回category字段）
              if (!product.category) {
                if (
                  product.name.includes("斗战者") ||
                  product.name.includes("R7000P")
                ) {
                  product.category = "desktop"; // 台式机
                } else if (
                  product.name.includes("笔记本") ||
                  product.name.includes("ThinkBook")
                ) {
                  product.category = "laptop"; // 笔记本
                } else if (product.name.includes("ThinkPad")) {
                  product.category = "thinkpad"; // ThinkPad
                } else if (
                  product.name.includes("平板") ||
                  product.name.includes("Pad")
                ) {
                  product.category = "tablet"; // 平板
                } else if (
                  product.name.includes("手机") ||
                  product.name.includes("摩托罗拉")
                ) {
                  product.category = "phone"; // 手机
                } else if (product.name.includes("显示器")) {
                  product.category = "monitor"; // 显示器
                } else if (product.name.includes("智能")) {
                  product.category = "smart"; // 智能产品
                } else {
                  product.category = "service"; // 选件/服务
                }
              }
              return product;
            }
          );
          // 初始化轮播图（保留不变）
          heroImages.value = allProducts.value.slice(0, 3).map((product) => ({
            id: product.id,
            name: product.name,
            image: product.image || defaultImage,
          }));
          // 初始化分类过滤
          switchCategory(currentCategory.value);
        } else {
          throw new Error("API请求失败");
        }
      } catch (err) {
        console.error("获取商品数据失败:", err);
        error.value = err.message || "加载商品失败，请稍后重试";
        // 模拟数据：给每个模拟商品加category字段（对应不同分类）
        if (process.env.NODE_ENV === "development") {
          console.log("使用模拟数据");
          allProducts.value = [
            // 台式机分类商品
            {
              id: 1,
              name: "斗战者台式机Pro",
              price: 4999.99,
              image: defaultImage,
              category: "desktop",
            },
            {
              id: 2,
              name: "拯救者刃7000台式机",
              price: 5999.99,
              image: defaultImage,
              category: "desktop",
            },
            // 笔记本分类商品
            {
              id: 3,
              name: "小新Air笔记本",
              price: 3999.99,
              image: defaultImage,
              category: "laptop",
            },
            {
              id: 4,
              name: "拯救者Y9000笔记本",
              price: 8999.99,
              image: defaultImage,
              category: "laptop",
            },
            // ThinkPad分类商品
            {
              id: 5,
              name: "ThinkPad X1",
              price: 9999.99,
              image: defaultImage,
              category: "thinkpad",
            },
            // 平板分类商品
            {
              id: 6,
              name: "小新Pad Pro",
              price: 2499.99,
              image: defaultImage,
              category: "tablet",
            },
            // 手机分类商品
            {
              id: 7,
              name: "摩托罗拉X50",
              price: 3499.99,
              image: defaultImage,
              category: "phone",
            },
            // 显示器分类商品
            {
              id: 8,
              name: "联想27寸4K显示器",
              price: 1999.99,
              image: defaultImage,
              category: "monitor",
            },
            // 智能产品分类商品
            {
              id: 9,
              name: "联想智能音箱",
              price: 299.99,
              image: defaultImage,
              category: "smart",
            },
            // 选件/服务分类商品
            {
              id: 10,
              name: "联想原装鼠标",
              price: 99.99,
              image: defaultImage,
              category: "service",
            },
          ];
          // 初始化轮播图
          heroImages.value = allProducts.value.slice(0, 3).map((p) => ({
            id: p.id,
            name: p.name,
            image: p.image || defaultImage,
          }));
          // 初始化分类过滤
          switchCategory(currentCategory.value);
        }
      } finally {
        loading.value = false;
      }
    };

    // 生命周期：保留不变
    onMounted(() => {
      fetchProducts();
      play();
    });
    onUnmounted(() => stop());

    return {
      products,
      heroImages,
      displayedProducts,
      loading,
      error,
      currentIndex,
      currentPage,
      pageSize,
      totalPages,
      defaultImage,
      setIndex,
      pause,
      play,
      nextPage,
      prevPage,
      fetchProducts,
      formatPrice,
      handleImageError,
      prev,
      next,
      categoryList,
      currentCategory,
      switchCategory,
    };
  },
};
</script>

<style scoped>
/* 所有样式保留不变，无需修改 */
.page {
  padding-top: 60px;
  min-height: 100vh;
  background: #fff;
  color: #222;
}
.hero {
  width: 100%;
  height: 50vh;
  overflow: hidden;
  position: relative;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.carousel {
  width: 100%;
  height: 100%;
  position: relative;
  --btn-opacity: 0.5;
  --btn-hover-opacity: 1;
}
.carousel:hover {
  --btn-opacity: 1;
}
.slides {
  display: flex;
  height: 100%;
  transition: transform 0.6s ease;
  will-change: transform;
}
.slide {
  flex: 0 0 100%;
  height: 100%;
}
.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dots {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 12px;
  display: flex;
  gap: 8px;
  z-index: 5;
}
.dots button {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
}
.dots button.active {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}
.content {
  padding: 16px;
  min-height: 400px;
}
.loading,
.error,
.empty {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}
.error {
  color: #f56c6c;
}
.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.retry-btn:hover {
  background: #66b1ff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  justify-items: stretch;
}
.card {
  text-decoration: none;
  color: inherit;
}
.card-inner {
  width: 100%;
  height: 100%;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-inner:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
.card-inner img {
  width: 100%;
  height: calc(100% - 70px);
  object-fit: cover;
  display: block;
}
.caption {
  padding: 12px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  background: #fff;
  flex: 1;
}
.price {
  padding: 0 12px 12px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
  background: #fff;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
}
.pagination button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}
.pagination button:hover:not(:disabled) {
  background: #66b1ff;
}
.pagination button:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 80px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: var(--btn-opacity);
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.nav-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-50%) scale(1.05);
  opacity: var(--btn-hover-opacity);
}
.prev {
  left: 20px;
}
.next {
  right: 20px;
}
.arrow-left,
.arrow-right {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-width: 0 2px 2px 0;
}
.arrow-left {
  transform: rotate(135deg);
}
.arrow-right {
  transform: rotate(-45deg);
}
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .card {
    height: calc(45vh - 16px);
  }
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .card {
    height: calc(40vh - 16px);
  }
}
@media (max-width: 640px) {
  .hero {
    height: 40vh;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .card {
    height: calc(60vh - 16px);
  }
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
  .nav-btn {
    width: 50px;
    height: 35px;
  }
  .arrow-left,
  .arrow-right {
    width: 12px;
    height: 12px;
  }
}
.category-nav {
  width: 90%;
  margin: 0 auto;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}
.category-tabs {
  display: flex;
  justify-content: center;
  gap: 60px;
  flex-wrap: wrap;
}
.category-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
  font-size: 20px;
  transition: all 0.2s ease;
}
.category-tab.active {
  color: #409eff;
}
.category-tab.active i {
  background: #ecf5ff;
  color: #409eff;
}
.category-tab:hover {
  color: #409eff;
}

.category-icon {
  width: 80px; /* 图片宽度，和之前的icon一致 */
  height: 60px; /* 图片高度 */
  object-fit: contain; /* 保持图片比例 */
  border-radius: 4px; /* 可选：圆角 */
}
.icon-desktop::before {
  content: "🖥️";
}
.icon-laptop::before {
  content: "💻";
}
.icon-thinkpad::before {
  content: "📑";
}
.icon-tablet::before {
  content: "📱";
}
.icon-phone::before {
  content: "📞";
}
.icon-service::before {
  content: "🔧";
}
.icon-monitor::before {
  content: "🖨️";
}
.icon-smart::before {
  content: "🤖";
}
.icon-all::before {
  content: "🔍";
}
</style>