<script setup lang="ts"></script>

<template>
  <div class="layout">
    <header class="head">
      <div class="brand">
        <span class="logo">⚡</span>
        <span class="title">On Machine TA Side</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="link" active-class="active" exact>主頁</router-link>
        <router-link to="/scoretable" class="link" active-class="active">成績表</router-link>
        <router-link to="/scoreboard" class="link" active-class="active">答題總覽</router-link>
        <router-link to="/execute" class="link" active-class="active">執行</router-link>
        <router-link to="/anticheat" class="link" active-class="active">防作弊</router-link>
        <router-link to="/logviewer" class="link" active-class="active">學生日誌檢視器</router-link>
        <router-link to="/studentcodeviewer" class="link" active-class="active">學生程式碼檢視器</router-link>
        <router-link to="/examgenerator" class="link" active-class="active">考試產生器</router-link>
      </nav>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  background: #f5f6fa;
}

.layout {
  min-height: 100vh;
}

.head {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(90deg, #4f8bff, #6ac7ff);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.logo {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

.title {
  font-size: 16px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link {
  color: #eaf4ff;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
  font-weight: 600;
}

.link:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.active {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.content {
  padding: 20px;
  max-width: 90%;
  margin: 0 auto;
}
</style>