/**
 * Windsurf 自动填卡 - 弹出页面逻辑
 * 信用卡管理功能
 */

// 信用卡列表
let cards = [];

// DOM 元素
const batchInput = document.getElementById('batchInput');
const batchAddBtn = document.getElementById('batchAddBtn');
const cardList = document.getElementById('cardList');
const cardCount = document.getElementById('cardCount');
const clearAllBtn = document.getElementById('clearAllBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadCards();
  bindEvents();
});

// 绑定事件
function bindEvents() {
  batchAddBtn.addEventListener('click', handleBatchAdd);
  clearAllBtn.addEventListener('click', handleClearAll);
}

// 加载信用卡列表
function loadCards() {
  chrome.storage.local.get(['cards'], (result) => {
    cards = result.cards || [];
    renderCardList();
  });
}

// 保存信用卡列表
function saveCards() {
  chrome.storage.local.set({ cards: cards }, () => {
    console.log('信用卡列表已保存');
  });
}

// 解析信用卡字符串
// 格式：卡号|月份|年份|CVC
function parseCardString(str) {
  const parts = str.trim().split('|');
  if (parts.length !== 4) {
    return null;
  }

  const [number, month, year, cvc] = parts;

  // 验证卡号（至少13位数字）
  if (!/^\d{13,19}$/.test(number.replace(/\s/g, ''))) {
    return null;
  }

  // 验证月份（01-12）
  const monthNum = parseInt(month, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return null;
  }

  // 验证年份（4位数字）
  if (!/^\d{4}$/.test(year)) {
    return null;
  }

  // 验证 CVC（3-4位数字）
  if (!/^\d{3,4}$/.test(cvc)) {
    return null;
  }

  return {
    number: number.replace(/\s/g, ''),
    month: month.padStart(2, '0'),
    year: year,
    cvc: cvc,
    id: Date.now() + Math.random().toString(36).substr(2, 9)
  };
}

// 批量添加信用卡
function handleBatchAdd() {
  const input = batchInput.value.trim();
  if (!input) {
    alert('请输入信用卡信息');
    return;
  }

  const lines = input.split('\n').filter(line => line.trim());
  let addedCount = 0;
  let failedCount = 0;

  lines.forEach(line => {
    const card = parseCardString(line);
    if (card) {
      // 检查是否已存在相同卡号
      const exists = cards.some(c => c.number === card.number);
      if (!exists) {
        cards.push(card);
        addedCount++;
      }
    } else {
      failedCount++;
    }
  });

  if (addedCount > 0) {
    saveCards();
    renderCardList();
    batchInput.value = '';
  }

  // 显示结果
  let message = `成功添加 ${addedCount} 张卡`;
  if (failedCount > 0) {
    message += `，${failedCount} 张格式错误`;
  }
  alert(message);
}

// 删除单张信用卡（暴露到全局作用域供 onclick 调用）
window.handleDeleteCard = function(id) {
  cards = cards.filter(card => card.id !== id);
  saveCards();
  renderCardList();
}

// 清空所有信用卡
function handleClearAll() {
  if (cards.length === 0) {
    alert('列表已经是空的');
    return;
  }

  if (confirm(`确定要清空全部 ${cards.length} 张信用卡吗？`)) {
    cards = [];
    saveCards();
    renderCardList();
  }
}

// 渲染信用卡列表
function renderCardList() {
  // 更新数量
  cardCount.textContent = `${cards.length} 张`;

  // 空状态
  if (cards.length === 0) {
    cardList.innerHTML = `
      <div class="empty-state">
        <p>暂无信用卡</p>
        <p class="hint">请在上方批量添加</p>
      </div>
    `;
    return;
  }

  // 渲染列表
  cardList.innerHTML = cards.map(card => `
    <div class="card-item" data-id="${card.id}">
      <div class="card-info">
        <span class="card-number">${formatCardNumber(card.number)}</span>
        <span class="card-details">${card.month}/${card.year} · CVC: ${card.cvc}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-delete" onclick="handleDeleteCard('${card.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

// 格式化卡号显示（隐藏中间部分）
function formatCardNumber(number) {
  if (number.length < 8) return number;
  const first4 = number.slice(0, 4);
  const last4 = number.slice(-4);
  const middle = '*'.repeat(number.length - 8);
  return `${first4} ${middle.slice(0, 4)} ${middle.slice(4) || '****'} ${last4}`;
}

