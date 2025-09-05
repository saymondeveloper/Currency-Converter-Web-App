// ---------------------- CONFIG ----------------------  

// ---------------------- FULL CURRENCY → COUNTRY FLAG MAPPING ----------------------
const currencyFlags = {
    USD: 'us', EUR: 'eu', GBP: 'gb', INR: 'in', JPY: 'jp', AUD: 'au', CAD: 'ca',
    CHF: 'ch', CNY: 'cn', NZD: 'nz', SEK: 'se', NOK: 'no', DKK: 'dk', RUB: 'ru',
    BRL: 'br', ZAR: 'za', HKD: 'hk', SGD: 'sg', KRW: 'kr', MXN: 'mx', TRY: 'tr',
    PLN: 'pl', THB: 'th', MYR: 'my', IDR: 'id', CZK: 'cz', HUF: 'hu', ILS: 'il',
    PHP: 'ph', CLP: 'cl', COP: 'co', SAR: 'sa', AED: 'ae'
};

// ---------------------- CURRENCY SYMBOLS ----------------------
const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$',
    CHF: 'CHF', CNY: '¥', NZD: 'NZ$', SEK: 'kr', NOK: 'kr', DKK: 'kr', RUB: '₽',
    BRL: 'R$', ZAR: 'R', HKD: 'HK$', SGD: 'S$', KRW: '₩', MXN: 'MX$', TRY: '₺',
    PLN: 'zł', THB: '฿', MYR: 'RM', IDR: 'Rp', CZK: 'Kč', HUF: 'Ft', ILS: '₪',
    PHP: '₱', CLP: '$', COP: '$', SAR: '﷼', AED: 'د.إ'
};

// Cache for exchange rates
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let ratesCache = { timestamp: 0, rates: null };

// ---------------------- UTILITY ----------------------

// Show error message (optionally with retry button)
function showError(message, showRetry = true) {
    const result = document.getElementById('result');
    result.style.color = 'red';
    result.innerHTML = message;

    if (showRetry) {
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.style.marginLeft = '10px';
        retryButton.onclick = () => initializeCurrencies();
        result.appendChild(retryButton);
    }
}

// Update flags based on selected currencies
function updateFlags() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const fromFlag = document.getElementById('fromFlag');
    const toFlag = document.getElementById('toFlag');

    if (currencyFlags[fromSelect.value]) {
        fromFlag.src = `https://flagcdn.com/24x18/${currencyFlags[fromSelect.value]}.png`;
    }
    if (currencyFlags[toSelect.value]) {
        toFlag.src = `https://flagcdn.com/24x18/${currencyFlags[toSelect.value]}.png`;
    }
}

// Fetch exchange rates from backend with caching
async function fetchExchangeRates() {
    try {
        if (ratesCache.rates && (Date.now() - ratesCache.timestamp) < CACHE_DURATION) {
            return ratesCache.rates;
        }

        const response = await fetch('/api/rates');
        if (!response.ok) throw new Error('Failed to fetch exchange rates from server');

        const data = await response.json();
        if (data.success === false) throw new Error(data.error.message || 'API Error from server');

        ratesCache = { timestamp: Date.now(), rates: data.rates };
        return data.rates;
    } catch (error) {
        console.error('Error fetching rates:', error);
        showError('Unable to fetch current exchange rates.');
        throw error;
    }
}

// ---------------------- CORE FUNCTIONS ----------------------

// Convert currency
async function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const result = document.getElementById('result');

    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount', false);
        return;
    }

    try {
        // Fade out old result
        result.classList.add('fade-out');

        // Show converting message with spinner
        result.style.color = 'black';
        result.innerHTML = 'Converting <span class="spinner"></span>';

        const rates = await fetchExchangeRates();
        if (!rates[fromCurrency] || !rates[toCurrency]) {
            showError('Selected currency is not available.', true);
            return;
        }

        // Conversion logic (EUR base)
        const eurAmount = fromCurrency === 'EUR' ? amount : amount / rates[fromCurrency];
        const finalAmount = toCurrency === 'EUR' ? eurAmount : eurAmount * rates[toCurrency];

        // Use currency symbols if available
        const fromSymbol = currencySymbols[fromCurrency] || fromCurrency;
        const toSymbol = currencySymbols[toCurrency] || toCurrency;

        // Fade in new result after delay
        setTimeout(() => {
            result.classList.remove('fade-out');
            result.textContent = `${fromSymbol} ${amount.toFixed(2)} = ${toSymbol} ${finalAmount.toFixed(2)}`;
        }, 300); // match CSS transition
    } catch (error) {
        showError('Conversion failed. Please try again.');
    }
}

// Swap currencies
async function swapCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const swapBtn = document.getElementById('swapButton');

    // Animate swap button
    swapBtn.classList.add('animate');

    // Swap values
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;

    // Update custom select displays
    updateCustomSelectDisplay('fromCurrency');
    updateCustomSelectDisplay('toCurrency');

    updateFlags();

    setTimeout(() => swapBtn.classList.remove('animate'), 600);

    await convertCurrency();
}

// Initialize currency options
async function initializeCurrencies() {
    try {
        const rates = await fetchExchangeRates();
        const currencies = Object.keys(rates).sort();
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');

        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        currencies.forEach(currency => {
            fromSelect.add(new Option(currency, currency));
            toSelect.add(new Option(currency, currency));
        });

        // Default selections
        fromSelect.value = 'USD';
        toSelect.value = 'EUR';

        // Initialize custom select displays
        setupCustomSelect('fromCurrency');
        setupCustomSelect('toCurrency');

        updateFlags();
        await convertCurrency();
    } catch {
        showError('Failed to initialize currency options.');
    }
}

// ---------------------- CUSTOM SELECT FUNCTIONS ----------------------

function setupCustomSelect(selectId) {
    const selectElement = document.getElementById(selectId);
    const wrapper = document.getElementById(`${selectId}Wrapper`);
    const selectedOptionSpan = wrapper.querySelector('.selected-option');
    const optionsContainer = wrapper.querySelector('.options-container');

    // Populate custom options
    optionsContainer.innerHTML = '';
    Array.from(selectElement.options).forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option');
        optionDiv.dataset.value = option.value;
        optionDiv.innerHTML = `
            <div class="flag-wrapper">
                <img class="flag" src="https://flagcdn.com/24x18/${currencyFlags[option.value]}.png" alt="${option.value} Flag">
            </div>
            ${option.value} ${currencySymbols[option.value] || ''}
        `;
        optionDiv.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent bubbling
            selectElement.value = option.value;
            updateCustomSelectDisplay(selectId);
            optionsContainer.classList.remove('active');
            updateFlags();
            convertCurrency();
        });
        optionsContainer.appendChild(optionDiv);
    });

    // Set initial display
    updateCustomSelectDisplay(selectId);

    // Toggle options container visibility
    selectedOptionSpan.parentNode.addEventListener('click', (event) => {
        event.stopPropagation();
        // Close other open dropdowns
        document.querySelectorAll('.options-container.active').forEach(container => {
            if (container !== optionsContainer) {
                container.classList.remove('active');
            }
        });
        // Toggle current dropdown
        optionsContainer.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (event) => {
        if (!wrapper.contains(event.target)) {
            optionsContainer.classList.remove('active');
        }
    });
}

function updateCustomSelectDisplay(selectId) {
    const selectElement = document.getElementById(selectId);
    const wrapper = document.getElementById(`${selectId}Wrapper`);
    const selectedOptionSpan = wrapper.querySelector('.selected-option');
    const flagImg = wrapper.querySelector('.flag');

    const selectedValue = selectElement.value;
    const selectedText = selectedValue + ' ' + (currencySymbols[selectedValue] || '');

    selectedOptionSpan.textContent = selectedText;
    if (currencyFlags[selectedValue]) {
        flagImg.src = `https://flagcdn.com/24x18/${currencyFlags[selectedValue]}.png`;
    }
}

// ---------------------- EVENT LISTENERS ----------------------
document.getElementById('amount').addEventListener('input', convertCurrency);
// Remove change listeners for select elements as custom select handles it
// document.getElementById('fromCurrency').addEventListener('change', () => { updateFlags(); convertCurrency(); });
// document.getElementById('toCurrency').addEventListener('change', () => { updateFlags(); convertCurrency(); });
document.getElementById('swapButton').addEventListener('click', swapCurrencies);
document.getElementById('convertButton').addEventListener('click', convertCurrency);

// Initialize on page load
initializeCurrencies();
