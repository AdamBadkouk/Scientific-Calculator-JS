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
document.getElementById('basic-tab').addEventListener('click', () => switchTab('basic'));
document.getElementById('scientific-tab').addEventListener('click', () => switchTab('scientific'));
document.getElementById('history-tab').addEventListener('click', () => switchTab('history'));

function switchTab(tabName) {
    // Hide all panels and deactivate all tabs
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    
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
            'Math.sin(', 'Math.cos(', 'Math.tan(', 
            'Math.asin(', 'Math.acos(', 'Math.atan(', 
            'Math.sqrt(', 'Math.log(', 'Math.log10(',
            'Math.abs(', 'Math.pow(', 'Math.exp(',
            'Math.PI', 'Math.E'
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
            throw new Error("Invalid expression");
        }
        
        // Replace all instances of × with * for evaluation
        let expressionToEvaluate = currentExpression.replace(/×/g, '*');
        
        // Check for balanced parentheses
        if ((expressionToEvaluate.match(/\(/g) || []).length !== (expressionToEvaluate.match(/\)/g) || []).length) {
            const missingCount = (expressionToEvaluate.match(/\(/g) || []).length - (expressionToEvaluate.match(/\)/g) || []).length;
            if (missingCount > 0) {
                // Add missing closing parentheses
                expressionToEvaluate += ')'.repeat(missingCount);
            }
        }
        
        // Evaluate expression
        let result = Function('"use strict"; return (' + expressionToEvaluate + ')')();
        
        // Format result
        if (!isFinite(result)) {
            throw new Error("Result is not a finite number");
        }
        
        // Add to history
        addToHistory(currentExpression, result);
        
        // Update display
        lastResult = result;
        currentExpression = result.toString();
        currentDisplay = result.toString();
        waitingForOperand = true;
    } catch (error) {
        currentDisplay = 'Error';
        waitingForOperand = true;
    }
    updateDisplay();
}

// Scientific functions
function calculateFunction(funcName) {
    try {
        let value, args;
        
        if (waitingForOperand || currentExpression === '0') {
            value = parseFloat(currentDisplay);
            args = currentDisplay;
        } else {
            // Evaluate current expression first
            calculate();
            if (currentDisplay === 'Error') return;
            value = parseFloat(currentDisplay);
            args = currentDisplay;
        }
        
        // Execute specific function
        let result;
        switch (funcName) {
            case 'sin':
                result = Math.sin(value * (Math.PI / 180)); // Degrees
                currentExpression = `Math.sin(${args})`;
                break;
            case 'cos':
                result = Math.cos(value * (Math.PI / 180));
                currentExpression = `Math.cos(${args})`;
                break;
            case 'tan':
                result = Math.tan(value * (Math.PI / 180));
                currentExpression = `Math.tan(${args})`;
                break;
            case 'asin':
                result = Math.asin(value) * (180 / Math.PI);
                currentExpression = `Math.asin(${args})`;
                break;
            case 'acos':
                result = Math.acos(value) * (180 / Math.PI);
                currentExpression = `Math.acos(${args})`;
                break;
            case 'atan':
                result = Math.atan(value) * (180 / Math.PI);
                currentExpression = `Math.atan(${args})`;
                break;
            case 'sqrt':
                result = Math.sqrt(value);
                currentExpression = `Math.sqrt(${args})`;
                break;
            case 'square':
                result = value * value;
                currentExpression = `Math.pow(${args}, 2)`;
                break;
            case 'cube':
                result = value * value * value;
                currentExpression = `Math.pow(${args}, 3)`;
                break;
            case 'log10':
                result = Math.log10(value);
                currentExpression = `Math.log10(${args})`;
                break;
            case 'log':
                result = Math.log(value);
                currentExpression = `Math.log(${args})`;
                break;
            case 'exp':
                result = Math.exp(value);
                currentExpression = `Math.exp(${args})`;
                break;
            case 'abs':
                result = Math.abs(value);
                currentExpression = `Math.abs(${args})`;
                break;
            default:
                throw new Error("Unknown function");
        }
        
        if (!isFinite(result)) {
            throw new Error("Result is not a finite number");
        }
        
        // Add to history
        addToHistory(currentExpression, result);
        
        // Update displays
        currentDisplay = result.toString();
        waitingForOperand = true;
    } catch (error) {
        currentDisplay = 'Error';
        waitingForOperand = true;
    }
    updateDisplay();
}

function calculateFactorial() {
    try {
        const num = parseInt(currentDisplay);
        if (num < 0 || !Number.isInteger(num)) {
            throw new Error("Factorial only works on non-negative integers");
        }
        
        let result = 1;
        for (let i = 2; i <= num; i++) {
            result *= i;
            if (!isFinite(result)) {
                throw new Error("Result too large");
            }
        }
        
        const expression = `${num}!`;
        addToHistory(expression, result);
        
        currentExpression = result.toString();
        currentDisplay = result.toString();
        waitingForOperand = true;
    } catch (error) {
        currentDisplay = 'Error';
        waitingForOperand = true;
    }
    updateDisplay();
}

function calculatePower() {
    if (waitingForOperand || currentExpression === '0') {
        appendToDisplay('Math.pow(' + currentDisplay + ',');
    } else {
        calculate(); // Evaluate current expression first
        if (currentDisplay !== 'Error') {
            appendToDisplay('Math.pow(' + currentDisplay + ',');
        }
    }
}

function calculatePercentage() {
    try {
        // Find the last number and operator
        const regex = /([+\-*/])\s*(\d*\.?\d+)$/;
        const match = currentExpression.match(regex);
        
        if (match) {
            const [fullMatch, operator, number] = match;
            const baseValue = parseFloat(currentExpression.replace(fullMatch, ''));
            const percentage = parseFloat(number);
            
            let result;
            switch (operator) {
                case '+':
                case '-':
                    // Percentage of base value
                    result = baseValue * (1 + (operator === '+' ? 1 : -1) * percentage / 100);
                    break;
                case '*':
                case '/':
                    // Direct percentage
                    result = parseFloat(currentExpression.replace(number, number / 100));
                    break;
            }
            
            // Add to history
            addToHistory(currentExpression + '%', result);
            
            currentExpression = result.toString();
            currentDisplay = result.toString();
            waitingForOperand = true;
        } else {
            // Just convert to percentage (divide by 100)
            const value = parseFloat(currentDisplay) / 100;
            
            // Add to history
            addToHistory(currentDisplay + '%', value);
            
            currentExpression = value.toString();
            currentDisplay = value.toString();
            waitingForOperand = true;
        }
    } catch (error) {
        currentDisplay = 'Error';
        waitingForOperand = true;
    }
    updateDisplay();
}

function calculateReciprocal() {
    try {
        const value = parseFloat(currentDisplay);
        if (value === 0) {
            throw new Error("Cannot divide by zero");
        }
        
        const result = 1 / value;
        
        // Add to history
        addToHistory(`1/${currentDisplay}`, result);
        
        currentExpression = result.toString();
        currentDisplay = result.toString();
        waitingForOperand = true;
    } catch (error) {
        currentDisplay = 'Error';
        waitingForOperand = true;
    }
    updateDisplay();
}

// Memory functions
function memoryStore() {
    memoryValue = parseFloat(currentDisplay);
    waitingForOperand = true;
}

function memoryRecall() {
    if (memoryValue !== null) {
        currentDisplay = memoryValue.toString();
        if (waitingForOperand || currentExpression === '0') {
            currentExpression = memoryValue.toString();
        } else {
            // Check if we're in the middle of entering a number
            const lastChar = currentExpression.slice(-1);
            if ('0123456789.'.includes(lastChar)) {
                // Replace the current number with the memory value
                const regex = /[\d.]+$/;
                currentExpression = currentExpression.replace(regex, memoryValue.toString());
            } else {
                currentExpression += memoryValue.toString();
            }
        }
        waitingForOperand = false;
        updateDisplay();
    }
}

function memoryAdd() {
    if (memoryValue === null) {
        memoryValue = 0;
    }
    memoryValue += parseFloat(currentDisplay);
    waitingForOperand = true;
}

function memoryClear() {
    memoryValue = null;
}

// History functions
function addToHistory(expression, result) {
    const formattedExpression = formatExpression(expression);
    const formattedResult = formatDisplay(result.toString());
    
    calculationHistory.push({
        expression: formattedExpression,
        result: formattedResult
    });
    
    // Update history UI
    updateHistoryUI();
}

function updateHistoryUI() {
    // Clear existing history
    historyListEl.innerHTML = '';
    
    if (calculationHistory.length === 0) {
        historyListEl.innerHTML = '<div class="no-history">No calculation history yet</div>';
        return;
    }
    
    // Add history items in reverse order (newest first)
    calculationHistory.slice().reverse().forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">${item.result}</div>
        `;
        
        // Add click event to reuse this calculation
        historyItem.addEventListener('click', () => {
            const originalIndex = calculationHistory.length - 1 - index;
            reuseHistoryItem(originalIndex);
        });
        
        historyListEl.appendChild(historyItem);
    });
}

function reuseHistoryItem(index) {
    if (index >= 0 && index < calculationHistory.length) {
        const item = calculationHistory[index];
        currentDisplay = item.result.replace(/[×π]/g, (match) => match === '×' ? '*' : 'Math.PI');
        currentExpression = currentDisplay;
        waitingForOperand = true;
        updateDisplay();
        
        // Switch back to basic tab
        switchTab('basic');
    }
}

function clearHistory() {
    calculationHistory = [];
    updateHistoryUI();
}

// Theme functions
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    
    // Update theme button icon
    const themeButton = document.getElementById('theme-button');
    themeButton.innerHTML = isDarkTheme ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
}

// Initialize display
updateDisplay();
updateHistoryUI();