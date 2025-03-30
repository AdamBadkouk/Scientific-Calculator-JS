let currentDisplay = '0';
let waitingForOperand = false;
const display = document.getElementById('display');

function updateDisplay() {
    display.textContent = currentDisplay;
}

function appendToDisplay(value) {
    if (waitingForOperand) {
    currentDisplay = value;
    waitingForOperand = false;
    } else {
    // Prevent multiple decimals
    if (value === '.' && currentDisplay.includes('.')) return;
    currentDisplay = currentDisplay === '0' ? value : currentDisplay + value;
    }
    updateDisplay();
}

function clearDisplay() {
    currentDisplay = '0';
    waitingForOperand = false;
    updateDisplay();
}

function deleteLast() {
    if (currentDisplay.length > 1) {
    currentDisplay = currentDisplay.slice(0, -1);
    } else {
    currentDisplay = '0';
    }
    updateDisplay();
}

function calculate() {
    try {
    currentDisplay = String(eval(currentDisplay.replace('×', '*')));
    waitingForOperand = true;
    } catch {
    currentDisplay = 'Error';
    }
    updateDisplay();
}