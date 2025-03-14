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
                currentDisplay = String(Function('return ' + currentDisplay)());
                waitingForOperand = true;
                updateDisplay();
            } catch (error) {
                currentDisplay = 'Error';
                waitingForOperand = true;
                updateDisplay();
            }
        }