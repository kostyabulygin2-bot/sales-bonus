/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;

  let bonusRate = 0;
  if (index === 0) {
    bonusRate = 0.15;
  } else if (index === total - 1) {
    bonusRate = 0;
  } else if (index === 1 || index === 2) {
    bonusRate = 0.1;
  } else {
    bonusRate = 0.05;
  }

  return profit * bonusRate;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options;

  if (
    typeof options !== "object" ||
    !calculateRevenue ||
    !calculateBonus ||
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Некорректные опции");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    bonus: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller]),
  );

  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product]),
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    // Увеличить общую сумму выручки всех продаж
    seller.sales_count++;
    seller.revenue += record.total_amount;
    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue_item = calculateSimpleRevenue(item, product);
      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue_item - cost;
      seller.revenue += Number(revenue_item.toFixed(2));
      seller.profit += profit;
      // Увеличить общую накопленную прибыль (profit) у продавца
      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
      // По артикулу товара увеличить его проданное количество у продавца
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((min, max) => max.profit - min.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller); // Считаем бонус
    seller.top_products = Object.entries(seller.products_sold)
      .map((product) => ({ sku: product[0], quantity: product[1] }))
      .sort((min, max) => max.quantity - min.quantity)
      .slice(0, 10); // Формируем топ-10 товаров
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
