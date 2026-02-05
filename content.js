/**
 * Windsurf 自动填卡 - 内容脚本
 * 注入到 Stripe 支付页面，显示悬浮窗并执行自动填卡
 */

(function() {
  'use strict';

  // 固定填写的信息
  const FIXED_INFO = {
    billingName: 'FuckWindsurf',
    billingCountry: 'HK',
    billingAdministrativeArea: 'Kowloon',
    billingLocality: '九龍城',
    billingAddressLine1: '庇利街碧丽花园'
  };

  // 创建悬浮窗
  function createFloatingWindow() {
    // 检查是否已存在
    if (document.getElementById('windsurf-autofill-container')) {
      return;
    }

    const container = document.createElement('div');
    container.id = 'windsurf-autofill-container';

    const statusDiv = document.createElement('div');
    statusDiv.id = 'windsurf-status';

    const button = document.createElement('button');
    button.id = 'windsurf-autofill-btn';
    button.textContent = '一键填卡';
    button.addEventListener('click', handleAutoFill);

    container.appendChild(statusDiv);
    container.appendChild(button);
    document.body.appendChild(container);

    console.log('[Windsurf] 悬浮窗已创建');
  }

  // 显示状态提示
  function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('windsurf-status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `show ${type}`;

    setTimeout(() => {
      statusDiv.className = '';
    }, 3000);
  }

  // 模拟用户输入
  function simulateInput(element, value) {
    if (!element) return false;

    // 聚焦元素
    element.focus();

    // 清空现有值
    element.value = '';

    // 触发输入事件
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    const changeEvent = new Event('change', { bubbles: true, cancelable: true });

    // 逐字符输入以触发所有事件监听器
    for (let i = 0; i < value.length; i++) {
      element.value += value[i];
      element.dispatchEvent(inputEvent);
    }

    element.dispatchEvent(changeEvent);
    element.blur();

    return true;
  }

  // 模拟选择下拉框
  function simulateSelect(element, value) {
    if (!element) return false;

    element.focus();
    element.value = value;

    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    const changeEvent = new Event('change', { bubbles: true, cancelable: true });

    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);
    element.blur();

    return true;
  }

  // 格式化卡号（添加空格）
  function formatCardNumber(cardNumber) {
    // 移除所有非数字字符
    const cleaned = cardNumber.replace(/\D/g, '');
    // 每4位添加空格
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  // 格式化过期日期
  function formatExpiry(month, year) {
    // 确保月份是两位数
    const mm = month.toString().padStart(2, '0');
    // 取年份后两位
    const yy = year.toString().slice(-2);
    return `${mm} / ${yy}`;
  }

  // 执行自动填卡
  async function handleAutoFill() {
    const button = document.getElementById('windsurf-autofill-btn');
    if (!button) return;

    button.disabled = true;
    button.textContent = '填卡中...';
    showStatus('正在获取信用卡信息...', 'info');

    try {
      // 从 background 获取随机信用卡
      const response = await chrome.runtime.sendMessage({ action: 'getRandomCard' });

      if (!response.success) {
        showStatus(response.error || '获取信用卡失败', 'error');
        return;
      }

      const card = response.card;
      console.log('[Windsurf] 获取到信用卡:', card.number.slice(-4));

      // 等待页面元素加载
      await new Promise(resolve => setTimeout(resolve, 100));

      // 填写信用卡号
      const cardNumberInput = document.getElementById('cardNumber');
      if (cardNumberInput) {
        simulateInput(cardNumberInput, formatCardNumber(card.number));
        console.log('[Windsurf] 已填写卡号');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // 填写过期日期
      const cardExpiryInput = document.getElementById('cardExpiry');
      if (cardExpiryInput) {
        simulateInput(cardExpiryInput, formatExpiry(card.month, card.year));
        console.log('[Windsurf] 已填写过期日期');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // 填写 CVC
      const cardCvcInput = document.getElementById('cardCvc');
      if (cardCvcInput) {
        simulateInput(cardCvcInput, card.cvc);
        console.log('[Windsurf] 已填写 CVC');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // 填写姓名
      const billingNameInput = document.getElementById('billingName');
      if (billingNameInput) {
        simulateInput(billingNameInput, FIXED_INFO.billingName);
        console.log('[Windsurf] 已填写姓名');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // 选择国家
      const billingCountrySelect = document.getElementById('billingCountry');
      if (billingCountrySelect) {
        simulateSelect(billingCountrySelect, FIXED_INFO.billingCountry);
        console.log('[Windsurf] 已选择国家');
      }

      await new Promise(resolve => setTimeout(resolve, 80));

      // 选择城市/地区
      const billingAreaSelect = document.getElementById('billingAdministrativeArea');
      if (billingAreaSelect) {
        simulateSelect(billingAreaSelect, FIXED_INFO.billingAdministrativeArea);
        console.log('[Windsurf] 已选择城市');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // 填写地区
      const billingLocalityInput = document.getElementById('billingLocality');
      if (billingLocalityInput) {
        simulateInput(billingLocalityInput, FIXED_INFO.billingLocality);
        console.log('[Windsurf] 已填写地区');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // 填写地址
      const billingAddressInput = document.getElementById('billingAddressLine1');
      if (billingAddressInput) {
        simulateInput(billingAddressInput, FIXED_INFO.billingAddressLine1);
        console.log('[Windsurf] 已填写地址');
      }

      showStatus('✓ 填卡完成！等待自动提交...', 'success');
      console.log('[Windsurf] 自动填卡完成，开始监测金额变化');

      // 自动点击"开始试用"按钮
      await autoClickSubmit();

    } catch (error) {
      console.error('[Windsurf] 填卡失败:', error);
      showStatus('填卡失败: ' + error.message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = '一键填卡';
    }
  }

  // 自动点击"开始试用"按钮
  // 监测金额稳定后自动提交
  async function autoClickSubmit() {
    console.log('[Windsurf] 开始监测金额变化...');
    
    // 查找提交按钮（开始试用）
    const findSubmitButton = () => {
      // 尝试多种选择器
      const selectors = [
        'button[type="submit"]',
        '.SubmitButton',
        '[data-testid="hosted-payment-submit-button"]',
        'button.SubmitButton-IconContainer',
        '.SubmitButton-IconContainer'
      ];
      
      for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn) return btn;
      }
      
      // 通过按钮文本查找
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('开始试用') || 
            btn.textContent.includes('Start trial') ||
            btn.textContent.includes('Subscribe')) {
          return btn;
        }
      }
      return null;
    };

    // 获取当前金额文本
    const getAmountText = () => {
      const amountElements = document.querySelectorAll('[class*="Amount"], [class*="amount"], [class*="total"], [class*="Total"]');
      let text = '';
      amountElements.forEach(el => {
        text += el.textContent + '|';
      });
      return text;
    };

    // 等待金额稳定（连续3次检测相同）
    let lastAmount = '';
    let stableCount = 0;
    const maxWait = 30; // 最多等待30秒
    let waitCount = 0;

    while (stableCount < 3 && waitCount < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitCount++;
      
      const currentAmount = getAmountText();
      
      if (currentAmount === lastAmount && currentAmount !== '') {
        stableCount++;
        console.log(`[Windsurf] 金额稳定检测 ${stableCount}/3`);
      } else {
        stableCount = 0;
        lastAmount = currentAmount;
        console.log('[Windsurf] 金额变化中，继续等待...');
      }
    }

    if (waitCount >= maxWait) {
      console.log('[Windsurf] 等待超时，尝试点击提交按钮');
    }

    // 查找并点击提交按钮
    const submitBtn = findSubmitButton();
    if (submitBtn) {
      console.log('[Windsurf] 找到提交按钮，准备点击');
      showStatus('金额已稳定，自动提交中...', 'info');
      
      // 等待一下再点击
      await new Promise(resolve => setTimeout(resolve, 500));
      
      submitBtn.click();
      console.log('[Windsurf] 已点击"开始试用"按钮');
      showStatus('✓ 已自动提交！', 'success');
    } else {
      console.log('[Windsurf] 未找到提交按钮');
      showStatus('填卡完成，请手动点击提交', 'info');
    }
  }

  // 初始化
  function init() {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createFloatingWindow);
    } else {
      createFloatingWindow();
    }
  }

  init();
})();

