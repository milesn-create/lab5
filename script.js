// Глобальная переменная для хранения загруженных блюд
window.dishesData = [];

let selectedDishes = {
    soup: null,
    main: null,
    salad: null,
    drink: null,
    dessert: null
};

let activeFilters = {
    soup: 'all',
    main: 'all',
    salad: 'all',
    drink: 'all',
    dessert: 'all'
};

async function loadDishes() {
    try {
        const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes?key=fdb746ba-4802-46af-9f21-10ccd05a1b63');
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const dishes = await response.json();
        window.dishesData = dishes;

        displayDishes(dishes);
        setupFilters();
    } catch (error) {
        console.error('Не удалось загрузить блюда:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'color:red;text-align:center;padding:20px;background:#ffe6e6;margin:20px;border-radius:8px;';
        errorDiv.textContent = 'Ошибка загрузки меню. Попробуйте позже.';
        document.querySelector('.lunch-container').prepend(errorDiv);
    }
}

function displayDishes(dishes) {
    const normalizedDishes = dishes.map(dish => {
        let normalizedCategory = dish.category;
        
        if (dish.category === 'main-course') normalizedCategory = 'main';
        if (dish.category === 'first-course') normalizedCategory = 'soup';
        if (dish.category === 'salad') normalizedCategory = 'salad';
        if (dish.category === 'drink') normalizedCategory = 'drink';
        if (dish.category === 'dessert') normalizedCategory = 'dessert';
        
        return {
            ...dish,
            category: normalizedCategory
        };
    });

    const sortedDishes = [...normalizedDishes].sort((a, b) => a.name.localeCompare(b.name));
    
    const categories = {
        soup: filterDishes(sortedDishes.filter(dish => dish.category === 'soup'), 'soup'),
        main: filterDishes(sortedDishes.filter(dish => dish.category === 'main'), 'main'),
        salad: filterDishes(sortedDishes.filter(dish => dish.category === 'salad'), 'salad'),
        drink: filterDishes(sortedDishes.filter(dish => dish.category === 'drink'), 'drink'),
        dessert: filterDishes(sortedDishes.filter(dish => dish.category === 'dessert'), 'dessert')
    };

    displayCategory('soup-dishes', categories.soup);
    displayCategory('main-dishes', categories.main);
    displayCategory('salad-dishes', categories.salad);
    displayCategory('drink-dishes', categories.drink);
    displayCategory('dessert-dishes', categories.dessert);

    updateOrderSummary();
}

function filterDishes(dishesArray, category) {
    const filter = activeFilters[category];
    if (filter === 'all') {
        return dishesArray;
    }
    return dishesArray.filter(dish => dish.kind === filter);
}

function setupFilters() {
    const filterContainers = document.querySelectorAll('.filters');
    
    filterContainers.forEach(container => {
        const filterButtons = container.querySelectorAll('.filter-btn');
        const category = container.id.replace('-filters', '');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const kind = this.getAttribute('data-kind');
                
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                if (activeFilters[category] === kind) {
                    activeFilters[category] = 'all';
                    this.classList.remove('active');
                    container.querySelector('[data-kind="all"]').classList.add('active');
                } else {
                    activeFilters[category] = kind;
                    this.classList.add('active');
                }
                
                displayDishes(window.dishesData);
            });
        });
    });
}

function displayCategory(containerId, dishes) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (dishes.length === 0) {
        container.innerHTML = '<p>Блюда временно отсутствуют</p>';
        return;
    }

    dishes.forEach(dish => {
        const dishElement = createDishElement(dish);
        container.appendChild(dishElement);
    });
}

function createDishElement(dish) {
    const dishDiv = document.createElement('div');
    dishDiv.className = 'dish-card';
    if (selectedDishes[dish.category] && selectedDishes[dish.category].keyword === dish.keyword) {
        dishDiv.classList.add('selected');
    }
    dishDiv.setAttribute('data-dish', dish.keyword);
    
    dishDiv.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}" class="dish-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        <div class="dish-price">${dish.price} ₽</div>
        <div class="dish-name">${dish.name}</div>
        <div class="dish-weight">${dish.count}</div>
        <button class="add-button">${selectedDishes[dish.category] && selectedDishes[dish.category].keyword === dish.keyword ? 'Выбрано' : 'Добавить'}</button>
    `;

    dishDiv.addEventListener('click', function() {
        selectDish(dish);
    });

    return dishDiv;
}

function selectDish(dish) {
    selectedDishes[dish.category] = dish;
    updateOrderSummary();
    
    document.querySelectorAll('.dish-card').forEach(card => {
        card.classList.remove('selected');
        const button = card.querySelector('.add-button');
        if (button) button.textContent = 'Добавить';
    });
    
    const selectedCard = document.querySelector(`[data-dish="${dish.keyword}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        const button = selectedCard.querySelector('.add-button');
        if (button) button.textContent = 'Выбрано';
    }
}

function updateOrderSummary() {
    const orderSection = document.getElementById('order-items');
    const totalSection = document.getElementById('total-section');
    
    let hasSelectedDishes = false;
    let totalPrice = 0;
    let orderHTML = '';

    const categories = [
        { key: 'soup', name: 'Суп', emptyText: 'Блюдо не выбрано' },
        { key: 'main', name: 'Главное блюдо', emptyText: 'Блюдо не выбрано' },
        { key: 'salad', name: 'Салат/стартер', emptyText: 'Блюдо не выбрано' },
        { key: 'drink', name: 'Напиток', emptyText: 'Напиток не выбран' },
        { key: 'dessert', name: 'Десерт', emptyText: 'Десерт не выбран' }
    ];

    categories.forEach(cat => {
        const dish = selectedDishes[cat.key];
        if (dish) {
            hasSelectedDishes = true;
            totalPrice += dish.price;
            orderHTML += `
                <div class="order-item">
                    <strong>${cat.name}</strong><br>
                    ${dish.name} ${dish.price}₽
                </div>
            `;
        } else {
            orderHTML += `
                <div class="order-item">
                    <strong>${cat.name}</strong><br>
                    ${cat.emptyText}
                </div>
            `;
        }
    });

    if (hasSelectedDishes) {
        orderSection.innerHTML = orderHTML;
        document.getElementById('total-price').textContent = totalPrice;
        totalSection.style.display = 'block';
    } else {
        orderSection.innerHTML = '<div class="empty-order">Ничего не выбрано</div>';
        totalSection.style.display = 'none';
    }
}

// Запускаем загрузку при готовности DOM
document.addEventListener('DOMContentLoaded', loadDishes);