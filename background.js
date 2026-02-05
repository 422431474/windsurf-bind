/**
 * Windsurf 自动填卡 - 后台服务脚本
 * 处理消息传递和存储操作
 */

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRandomCard') {
    // 获取随机信用卡
    chrome.storage.local.get(['cards'], (result) => {
      const cards = result.cards || [];
      if (cards.length === 0) {
        sendResponse({ success: false, error: '没有可用的信用卡，请先在扩展中添加' });
        return;
      }
      // 随机选择一张卡
      const randomIndex = Math.floor(Math.random() * cards.length);
      const card = cards[randomIndex];
      sendResponse({ success: true, card: card });
    });
    return true; // 保持消息通道开放，等待异步响应
  }
  
  if (request.action === 'getCards') {
    // 获取所有信用卡
    chrome.storage.local.get(['cards'], (result) => {
      sendResponse({ success: true, cards: result.cards || [] });
    });
    return true;
  }
  
  if (request.action === 'saveCards') {
    // 保存信用卡列表
    chrome.storage.local.set({ cards: request.cards }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Windsurf 自动填卡扩展已安装');
  // 初始化空的信用卡列表
  chrome.storage.local.get(['cards'], (result) => {
    if (!result.cards) {
      chrome.storage.local.set({ cards: [] });
    }
  });
});

