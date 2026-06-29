/**
 * main.js — 青岛风向标航空科技发展有限公司企业宣传网站
 * 负责：加载内容文件、渲染各板块、交互逻辑
 *
 * 内容文件路径（相对于 index.html 所在目录）：
 *   about.md       企业介绍（Markdown 格式）
 *   honor.json     相关荣誉
 *   partner.json   合作伙伴
 *   faq.json       常见问题
 */

'use strict';

/* =========================================================
   0. 内容读取：直接从文件 fetch（管理后台直接写文件，无需 localStorage）
   ========================================================= */

/**
 * @param {string}   key   - 内容标识
 * @param {string}   path  - 文件路径
 * @param {boolean}  isJson - true=JSON  false=文本
 * @param {function} cb    - callback(err, data)
 */
function loadContent(key, path, isJson, cb) {
  if (isJson) {
    fetchJSON(path, cb);
  } else {
    fetchText(path, cb);
  }
}

/* =========================================================
   1. 工具函数
   ========================================================= */

/**
 * 安全转义 HTML 特殊字符（防止 XSS）
 */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 安全转义 HTML 属性值
 */
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 安全获取对象属性值
 */
function safeVal(obj, key, fallback) {
  var v = obj && obj[key];
  if (v === undefined || v === null) return fallback || '';
  return String(v);
}

/**
 * fetch JSON 文件，带缓存破坏和详细错误提示
 */
function fetchJSON(path, cb) {
  var url = path + '?_t=' + Date.now();
  fetch(url)
    .then(function (res) {
      if (!res.ok) {
        // 尝试读取错误响应体，帮助排查
        return res.text().then(function(body) {
          throw new Error('HTTP ' + res.status + '（' + res.statusText + '）：无法加载 ' + path + '\n响应内容（前200字符）：' + body.slice(0, 200));
        });
      }
      return res.text();
    })
    .then(function (text) {
      // 检查是否看起来像 HTML（说明服务器返回了错误页面而不是 JSON）
      if (text.trim().charAt(0) === '<') {
        cb(new Error('服务器返回了 HTML 而不是 JSON（' + path + '）。\n可能原因：1) 文件路径错误 2) 服务器配置问题\n响应前 300 字符：' + text.slice(0, 300)));
        return;
      }
      try {
        var data = JSON.parse(text);
        cb(null, data);
      } catch (e) {
        cb(new Error('JSON 解析失败（' + path + '）：' + e.message + '\n文件内容前 200 字符：' + text.slice(0, 200)));
      }
    })
    .catch(function (err) {
      // fetch 失败（可能是网络问题或 file:// 协议）
      if (err.message.indexOf('Failed to fetch') !== -1 || err.message.indexOf('NetworkError') !== -1) {
        cb(new Error('网络请求失败（' + path + '）。\n可能原因：1) 直接双击 html 文件用 file:// 协议打开（浏览器会拦截请求）2) 本地服务器未启动\n解决方法：通过 http://localhost:8080 访问页面'));
      } else {
        cb(err);
      }
    });
}

/**
 * fetch 文本文件（Markdown）
 */
function fetchText(path, cb) {
  var url = path + '?_t=' + Date.now();
  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + '：无法加载 ' + path);
      return res.text();
    })
    .then(function (text) {
      cb(null, text);
    })
    .catch(function (err) {
      cb(err);
    });
}

/**
 * 显示加载中状态
 */
function showLoading(el) {
  el.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>加载中…</span></div>';
}

/**
 * 显示错误信息（直接显示，不做 HTML 转义，避免信息丢失）
 */
function showError(el, msg, detail) {
  var fullMsg = msg;
  if (detail) fullMsg += '（' + detail + '）';
  // 用 textContent 设置错误信息，避免 HTML 解析问题
  var div = document.createElement('div');
  div.className = 'load-error';
  div.textContent = '⚠️ ' + fullMsg;
  el.innerHTML = '';
  el.appendChild(div);
}

/* =========================================================
   2. 轻量 Markdown → HTML 解析器（纯正则，无外部依赖）
   ========================================================= */

function parseMd(md) {
  if (typeof md !== 'string') return '';
  var html = md;
  // 代码块
  html = html.replace(/```[\s\S]*?```/g, function (m) {
    var code = m.slice(3, -3).replace(/^\n/, '');
    return '<pre><code>' + escHtml(code) + '</code></pre>';
  });
  // 标题
  html = html.replace(/^### (.+)$/gm, function (_, t) { return '<h3>' + t + '</h3>'; });
  html = html.replace(/^## (.+)$/gm, function (_, t) { return '<h2>' + t + '</h2>'; });
  html = html.replace(/^# (.+)$/gm, function (_, t) { return '<h1>' + t + '</h1>'; });
  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, src) {
    return '<img src="' + escAttr(src) + '" alt="' + escAttr(alt) + '" loading="lazy" onerror="this.style.display=\'none\'">';
  });
  // 行内链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // 粗体 / 斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // 水平线
  html = html.replace(/^---+$/gm, '<hr>');
  // 无序列表
  html = html.replace(/(^[*\-] .+\n?)+/gm, function (block) {
    var items = block.trim().split('\n').map(function (l) { return '<li>' + l.replace(/^[*\-] /, '') + '</li>'; }).join('');
    return '<ul>' + items + '</ul>';
  });
  // 有序列表
  html = html.replace(/(^\d+\. .+\n?)+/gm, function (block) {
    var items = block.trim().split('\n').map(function (l) { return '<li>' + l.replace(/^\d+\. /, '') + '</li>'; }).join('');
    return '<ol>' + items + '</ol>';
  });
  // 段落
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  if (html.length > 0 && html.charAt(0) !== '<') html = '<p>' + html;
  if (html.length > 0 && html.slice(-1) !== '>') html = html + '</p>';
  return html;
}

/* =========================================================
   3. 导航 & 通用交互
   ========================================================= */

function initNav() {
  var navbar = document.getElementById('navbar');
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    document.getElementById('back-top').classList.toggle('show', window.scrollY > 400);
  }, { passive: true });

  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });

  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('nav ul a[data-section], #mobile-menu a[data-section]');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.dataset.section === e.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function (s) { obs.observe(s); });
}

function initBackTop() {
  document.getElementById('back-top').addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
}

/* =========================================================
   4. 企业介绍板块（about.md）
   ========================================================= */

function loadAbout() {
  var container = document.getElementById('about-content');
  showLoading(container);
  loadContent('about', 'about.md', false, function (err, md) {
    if (err) {
      showError(container, '企业介绍加载失败', err.message);
      console.error('[loadAbout]', err);
      return;
    }
    container.innerHTML = parseMd(md);
    var h1 = container.querySelector('h1');
    if (h1) h1.remove();
  });
}

/* =========================================================
   5. 相关荣誉板块（honor.json）
   ========================================================= */

function loadHonors() {
  var grid = document.getElementById('honors-grid');
  showLoading(grid);
  loadContent('honor', 'honor.json', true, function (err, data) {
    if (err) {
      showError(grid, '荣誉信息加载失败', err.message);
      console.error('[loadHonors]', err);
      return;
    }
    if (!data || !data.length) {
      grid.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:40px 0">暂无荣誉信息</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < data.length; i++) {
      var h = data[i];
      var imgHtml = h.image
        ? '<img src="' + escAttr(h.image) + '" alt="' + escAttr(h.title || '') + '" loading="lazy">'
        : '<div class="honor-img-placeholder">🏅</div>';
      html += '<div class="honor-card reveal reveal-delay-' + ((i % 3) + 1) + '">'
        + '<div class="honor-img-wrap">' + imgHtml + '</div>'
        + '<div class="honor-body">'
          + '<div class="honor-year">' + escHtml(safeVal(h, 'year', '')) + '</div>'
          + '<div class="honor-title-text">' + escHtml(safeVal(h, 'title', '')) + '</div>'
          + '<div class="honor-inst">颁发机构：' + escHtml(safeVal(h, 'institution', '')) + '</div>'
          + (h.description ? '<div class="honor-desc">' + escHtml(h.description) + '</div>' : '')
        + '</div></div>';
    }
    grid.innerHTML = html;
    initReveal();
  });
}

/* =========================================================
   6. 合作伙伴板块（partner.json）
   ========================================================= */

function loadPartners() {
  var grid = document.getElementById('partners-grid');
  var filterDiv = document.getElementById('partner-filter');
  showLoading(grid);
  loadContent('partner', 'partner.json', true, function (err, data) {
    if (err) {
      showError(grid, '合作伙伴信息加载失败', err.message);
      console.error('[loadPartners]', err);
      return;
    }
    if (!data || !data.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--gray-4);padding:40px 0">暂无合作伙伴信息</p>';
      return;
    }
    // 构建分类筛选按钮
    var catMap = {};
    for (var i = 0; i < data.length; i++) {
      var c = safeVal(data[i], 'category', '');
      if (c) catMap[c] = true;
    }
    var cats = ['全部'];
    for (var k in catMap) cats.push(k);
    var filterDiv = document.getElementById('partner-filter');
    filterDiv.innerHTML = cats.map(function (c) {
      return '<button class="filter-btn' + (c === '全部' ? ' active' : '') + '" data-cat="' + escAttr(c) + '">' + escHtml(c) + '</button>';
    }).join('');

    // 渲染卡片
    var grid = document.getElementById('partners-grid');
    var html = '';
    for (var i = 0; i < data.length; i++) {
      var p = data[i];
      var name = safeVal(p, 'name', '未知企业');
      var logo = safeVal(p, 'logo', '');
      var category = safeVal(p, 'category', '');
      var description = safeVal(p, 'description', '');
      var logoHtml = logo
        ? '<img src="' + escAttr(logo) + '" alt="' + escAttr(name) + '" loading="lazy">'
        : (category === '政府机构' ? '🏛️' : category === '科研院所' ? '🔬' : category === '企业合作' ? '🤝' : '🏢');
      html += '<div class="partner-card reveal reveal-delay-' + ((i % 4) + 1) + '" data-cat="' + escAttr(category) + '">'
        + '<div class="partner-logo">' + logoHtml + '</div>'
        + '<div class="partner-name">' + escHtml(name) + '</div>'
        + (category ? '<div class="partner-category">' + escHtml(category) + '</div>' : '')
        + (description ? '<div class="partner-desc">' + escHtml(description) + '</div>' : '')
        + '</div>';
    }
    grid.innerHTML = html;

    // 筛选交互
    filterDiv.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterDiv.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var sel = btn.dataset.cat;
      document.querySelectorAll('#partners-grid .partner-card').forEach(function (card) {
        card.classList.toggle('hide', sel !== '全部' && card.dataset.cat !== sel);
      });
    });
    initReveal();
  });
}

/* =========================================================
   7. FAQ 板块（faq.json）
   ========================================================= */

function loadFaq() {
  var listDiv = document.getElementById('faq-list');
  showLoading(listDiv);
  loadContent('faq', 'faq.json', true, function (err, data) {
    if (err) {
      showError(listDiv, '常见问题加载失败', err.message);
      console.error('[loadFaq]', err);
      return;
    }
    if (!data || !data.length) {
      listDiv.innerHTML = '<p style="text-align:center;color:var(--gray-4);padding:40px 0">暂无常见问题</p>';
      return;
    }
    // 构建分类筛选按钮
    var catMap = {};
    for (var i = 0; i < data.length; i++) {
      var c = safeVal(data[i], 'category', '');
      if (c) catMap[c] = true;
    }
    var cats = ['全部'];
    for (var k in catMap) cats.push(k);
    var filterDiv = document.getElementById('faq-filter');
    filterDiv.innerHTML = cats.map(function (c) {
      return '<button class="filter-btn' + (c === '全部' ? ' active' : '') + '" data-cat="' + escAttr(c) + '">' + escHtml(c) + '</button>';
    }).join('');

    // 渲染 FAQ 列表
    var listDiv = document.getElementById('faq-list');
    var emptyDiv = document.getElementById('faq-empty');
    var html = '';
    for (var i = 0; i < data.length; i++) {
      var f = data[i];
      var question = safeVal(f, 'question', '');
      var answer = safeVal(f, 'answer', '');
      var category = safeVal(f, 'category', '');
      var keypoints = f.keypoints && Array.isArray(f.keypoints) ? f.keypoints : [];

      var badgeHtml = category ? '<span class="q-badge">' + escHtml(category) + '</span>' : '';
      var kpHtml = '';
      if (keypoints.length) {
        var kpArr = [];
        for (var j = 0; j < keypoints.length; j++) {
          kpArr.push('<span class="keypoint-tag">' + escHtml(String(keypoints[j])) + '</span>');
        }
        kpHtml = '<div class="faq-keypoints">' + kpArr.join('') + '</div>';
      }
      html += '<div class="faq-item reveal" data-cat="' + escAttr(category) + '" data-index="' + i + '">'
        + '<div class="faq-question" role="button" aria-expanded="false" tabindex="0">'
          + '<div class="faq-q-text">' + badgeHtml + escHtml(question) + '</div>'
          + '<div class="faq-arrow" aria-hidden="true">▼</div>'
        + '</div>'
        + '<div class="faq-answer" role="region">'
          + '<div class="faq-answer-text">' + escHtml(answer) + '</div>'
          + kpHtml
        + '</div></div>';
    }
    listDiv.innerHTML = html;

    // 展开/收起
    listDiv.addEventListener('click', function (e) {
      var qBtn = e.target.closest('.faq-question');
      if (!qBtn) return;
      var item = qBtn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        qBtn.setAttribute('aria-expanded', 'true');
      }
    });
    // 键盘支持
    listDiv.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var qBtn = e.target.closest('.faq-question');
        if (qBtn) { e.preventDefault(); qBtn.click(); }
      }
    });

    // 分类筛选
    filterDiv.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterDiv.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var sel = btn.dataset.cat;
      var visible = 0;
      document.querySelectorAll('#faq-list .faq-item').forEach(function (item) {
        var show = sel === '全部' || item.dataset.cat === sel;
        item.classList.toggle('hide', !show);
        if (show) visible++;
      });
      emptyDiv.style.display = visible === 0 ? 'block' : 'none';
    });
    initReveal();
  });
}

/* =========================================================
   8. 入口
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initNav();
  initBackTop();
  initReveal();
  loadAbout();
  loadHonors();
  loadPartners();
  loadFaq();
});
