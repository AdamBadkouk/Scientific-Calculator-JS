// Calculator state
let currentExpression = '0';
let currentDisplay = '0';
let waitingForOperand = false;
let lastResult = null;
let memoryValue = null;
let calculationHistory = [];
let isDarkTheme = false;

// DOM elements
const expressionEl = document.getElementById('expression');
const displayEl = document.getElementById('display');
const historyListEl = document.getElementById('history-list');

// Tab functionality
document
  .getElementById('basic-tab')
  .addEventListener('click', () => switchTab('basic'));
document
  .getElementById('scientific-tab')
  .addEventListener('click', () => switchTab('scientific'));
document
  .getElementById('history-tab')
  .addEventListener('click', () => switchTab('history'));
document
  .getElementById('unit-tab')
  .addEventListener('click', () => switchTab('unit'));

function switchTab(tabName) {
  // Hide all panels and deactivate all tabs
  document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach((tab) => tab.classList.remove('active'));

  // Activate selected tab and panel
  document.getElementById(`${tabName}-tab`).classList.add('active');
  document.getElementById(`${tabName}-panel`).classList.add('active');
}

// Display functions
function updateDisplay() {
  expressionEl.textContent = currentExpression === '0' ? '' : formatExpression(currentExpression);
  displayEl.textContent = formatDisplay(currentDisplay);
}

function formatExpression(expr) {
  // Format the expression for display
  return expr
    .replace(/\*/g, '×')
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e')
    .replace(/Math\.sin/g, 'sin')
    .replace(/Math\.cos/g, 'cos')
    .replace(/Math\.tan/g, 'tan')
    .replace(/Math\.asin/g, 'sin⁻¹')
    .replace(/Math\.acos/g, 'cos⁻¹')
    .replace(/Math\.atan/g, 'tan⁻¹')
    .replace(/Math\.sqrt/g, '√')
    .replace(/Math\.log/g, 'ln')
    .replace(/Math\.log10/g, 'log')
    .replace(/Math\.abs/g, '|')
    .replace(/\|([^|]*)\|/g, '|$1|') // Format absolute value
    .replace(/Math\.pow\(([^,]*),\s*2\)/g, '$1²')
    .replace(/Math\.pow\(([^,]*),\s*3\)/g, '$1³')
    .replace(/Math\.pow\(([^,]*),\s*([^)]*)\)/g, '$1^$2')
    .replace(/Math\.exp\(([^)]*)\)/g, 'e^$1');
}

function formatDisplay(value) {
  // Format numbers for display
  if (value === 'Error') return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Handle large and small numbers
  if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(6);
  }

  // Limit decimal places but preserve integers
  const decimalPlaces = value.includes('.') ? Math.min(10, value.split('.')[1].length) : 0;
  return Number(num.toFixed(decimalPlaces)).toString();
}

// Input handling
function appendToDisplay(value) {
  // Handle special constants
  if (value === 'Math.PI' || value === 'Math.E') {
    if (waitingForOperand || currentExpression === '0') {
      currentExpression = value;
      currentDisplay = value === 'Math.PI' ? Math.PI.toString() : Math.E.toString();
    } else {
      currentExpression += value;
      currentDisplay = value === 'Math.PI' ? Math.PI.toString() : Math.E.toString();
    }
    waitingForOperand = false;
    updateDisplay();
    return;
  }

  // Reset if waiting for operand
  if (waitingForOperand) {
    if ('+-*/'.includes(value)) {
      currentExpression = currentDisplay + value;
    } else {
      currentExpression = value;
      currentDisplay = value;
    }
    waitingForOperand = false;
  } else {
    // Prevent consecutive operators
    if ('+-*/'.includes(value) && '+-*/'.includes(currentExpression.slice(-1))) {
      currentExpression = currentExpression.slice(0, -1) + value;
    } else if (currentExpression === '0' && value !== '.') {
      currentExpression = value;
      if (!'+-*/()'.includes(value)) currentDisplay = value;
    } else {
      // Check for decimal point
      if (value === '.' && currentDisplay.includes('.') && !'+-*/()'.includes(currentExpression.slice(-1))) {
        return; // Prevent multiple decimals
      }
      currentExpression += value;

      // Update current display for numbers and decimal point
      if (!'+-*/()'.includes(value)) {
        if ('+-*/()'.includes(currentExpression.slice(-2, -1)) || currentDisplay === '0') {
          currentDisplay = value;
        } else {
          currentDisplay += value;
        }
      }
    }
  }
  updateDisplay();
}

function clearDisplay() {
  currentExpression = '0';
  currentDisplay = '0';
  waitingForOperand = false;
  updateDisplay();
}

function deleteLast() {
  if (waitingForOperand) {
    clearDisplay();
    return;
  }
  if (currentExpression.length > 1) {
    // Check for special functions and constants to delete them entirely
    const specialTerms = [
      'Math.sin(',
      'Math.cos(',
      'Math.tan(',
      'Math.asin(',
      'Math.acos(',
      'Math.atan(',
      'Math.sqrt(',
      'Math.log(',
      'Math.log10(',
      'Math.abs(',
      'Math.pow(',
      'Math.exp(',
      'Math.PI',
      'Math.E',
    ];
    for (const term of specialTerms) {
      if (currentExpression.endsWith(term)) {
        currentExpression = currentExpression.slice(0, -term.length);
        updateDisplay();
        return;
      }
    }
    currentExpression = currentExpression.slice(0, -1);

    // If we deleted an operator, update display
    if ('+-*/()'.includes(currentExpression.slice(-1))) {
      // Find the last number in the expression
      const matches = currentExpression.match(/[\d.]+$/);
      currentDisplay = matches ? matches[0] : '0';
    } else if (currentDisplay.length > 1) {
      currentDisplay = currentDisplay.slice(0, -1);
    } else {
      currentDisplay = '0';
    }
  } else {
    currentExpression = '0';
    currentDisplay = '0';
  }
  updateDisplay();
}

function toggleSign() {
  if (currentDisplay === '0') return;

  if (currentDisplay.startsWith('-')) {
    currentDisplay = currentDisplay.substring(1);
  } else {
    currentDisplay = '-' + currentDisplay;
  }

  // Update the expression
  const lastNumberRegex = /(-?\d*\.?\d+)$/;
  if (lastNumberRegex.test(currentExpression)) {
    currentExpression = currentExpression.replace(lastNumberRegex, currentDisplay);
  } else {
    currentExpression = currentDisplay;
  }
  updateDisplay();
}

// Calculation functions
function calculate() {
  try {
    // Avoid eval security issues by checking for valid mathematical expression
    if (!/^[0-9+\-*/(). Math\w]*$/.test(currentExpression)) {
      throw new Error('Invalid expression');
    }

    // Replace all instances of × with * for evaluation
    let expressionToEvaluate = currentExpression.replace(/×/g, '*');

    // Check for balanced parentheses
    if (
      (expressionToEvaluate.match(/\(/g) || []).length !==
      (expressionToEvaluate.match(/\)/g) || []).length
    ) {
      const missingCount =
        (expressionToEvaluate.match(/\(/g) || []).length -
        (expressionToEvaluate.match(/\)/g) || []).length;
      if (missingCount > 0) {
        // Add missing closing parentheses
        expressionToEvaluate += ')'.repeat(missingCount);
      }
    }

    // Evaluate expression
    let result = Function('"use strict"; return (' + expressionToEvaluate + ')')();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      lastResult = result.toString();
      currentExpression = lastResult;
      currentDisplay = lastResult;
      waitingForOperand = true;
      calculationHistory.push({ expression: currentExpression, result: lastResult });
      updateDisplay();
      updateHistory();
    } else {
      throw new Error('Calculation error');
    }
  } catch (e) {
    currentDisplay = 'Error';
    currentExpression = '0';
    updateDisplay();
  }
}

// History update functions
function updateHistory() {
  historyListEl.innerHTML = '';
  if (calculationHistory.length === 0) {
    const noHistoryEl = document.createElement('div');
    noHistoryEl.className = 'no-history';
    noHistoryEl.textContent = 'No calculation history yet';
    historyListEl.appendChild(noHistoryEl);
    return;
  }
  calculationHistory.forEach((item) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-expression">${item.expression}</div>
      <div class="history-result">${item.result}</div>
    `;
    historyItem.addEventListener('click', () => {
      currentExpression = item.expression;
      currentDisplay = item.result;
      updateDisplay();
      switchTab('basic');
    });
    historyListEl.appendChild(historyItem);
  });
}

// Clear history
function clearHistory() {
  calculationHistory = [];
  updateHistory();
}

// Dark mode toggle
function toggleDarkMode() {
  const body = document.body;
  const btn = document.querySelector('.theme-toggle button');

  // Toggle the dark-theme class on body
  body.classList.toggle('dark-theme');

  // Update button icon/text based on current theme
  if (body.classList.contains('dark-theme')) {
    btn.textContent = '☀️'; // sun icon for light mode toggle
  } else {
    btn.textContent = '🌙'; // moon icon for dark mode toggle
  }
}

// Tab switch outside function
function switchTab(tabName) {
  document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach((tab) => tab.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
  document.getElementById(`${tabName}-panel`).classList.add('active');
}

// Initialize display and history on load
updateDisplay();
updateHistory();
