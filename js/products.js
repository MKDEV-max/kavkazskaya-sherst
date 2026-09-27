// Ассортимент магазина. Этот файл читают и сайт, и сервер оплаты,
// поэтому цена в заказе всегда считается по нему, а не по данным из браузера.
//
// ВНИМАНИЕ: цены ниже — примерные. Замените их на свои перед запуском.
//   price  — цена за 1 кг, ₽
//   min    — минимальный заказ, кг
//   step   — шаг количества, кг
(function (root) {
  var PRODUCTS = [
    { id: 'fine-washed',     grade: 'fine',       state: 'Мытая',   color: 'Белая',  breed: 'Ставропольская',                 micron: '20–23 мкм',   use: 'пряжа, трикотаж, тонкие ткани',  price: 900,  min: 1,  step: 1 },
    { id: 'fine-raw',        grade: 'fine',       state: 'Немытая', color: 'Белая',  breed: 'Грозненская',                    micron: '21–25 мкм',   use: 'для своей мойки и переработки',  price: 350,  min: 10, step: 5 },
    { id: 'fine-combed',     grade: 'fine',       state: 'Чёсаная', color: 'Белая',  breed: 'Кавказская тонкорунная',         micron: '21–23 мкм',   use: 'прядение, мокрое валяние',       price: 1800, min: 1,  step: 1 },
    { id: 'semifine-washed', grade: 'semifine',   state: 'Мытая',   color: 'Белая',  breed: 'Цигайская',                      micron: '27–31 мкм',   use: 'костюмные ткани, пряжа',         price: 650,  min: 1,  step: 1 },
    { id: 'semifine-raw',    grade: 'semifine',   state: 'Немытая', color: 'Белая',  breed: 'Северокавказская мясо-шерстная', micron: '25–31 мкм',   use: 'для своей мойки и переработки',  price: 250,  min: 10, step: 5 },
    { id: 'semifine-combed', grade: 'semifine',   state: 'Чёсаная', color: 'Белая',  breed: 'Цигайская',                      micron: '27–31 мкм',   use: 'пряжа, валяние',                 price: 1200, min: 1,  step: 1 },
    { id: 'semic-washed',    grade: 'semicoarse', state: 'Мытая',   color: 'Серая',  breed: 'Тушинская',                      micron: 'неоднородная', use: 'ковры, пряжа ручного прядения', price: 400,  min: 1,  step: 1 },
    { id: 'semic-raw',       grade: 'semicoarse', state: 'Немытая', color: 'Белая',  breed: 'Тушинская',                      micron: 'неоднородная', use: 'ковры, войлок',                 price: 120,  min: 10, step: 5 },
    { id: 'semic-combed',    grade: 'semicoarse', state: 'Чёсаная', color: 'Серая',  breed: 'Тушинская',                      micron: 'неоднородная', use: 'войлок, валяние',               price: 800,  min: 1,  step: 1 },
    { id: 'coarse-washed',   grade: 'coarse',     state: 'Мытая',   color: 'Чёрная', breed: 'Карачаевская',                   micron: 'неоднородная', use: 'войлок, валенки, бурки',        price: 250,  min: 1,  step: 1 },
    { id: 'coarse-raw',      grade: 'coarse',     state: 'Немытая', color: 'Серая',  breed: 'Лезгинская',                     micron: 'неоднородная', use: 'войлок, утеплитель',            price: 60,   min: 10, step: 5 },
    { id: 'coarse-combed',   grade: 'coarse',     state: 'Чёсаная', color: 'Чёрная', breed: 'Андийская',                      micron: 'неоднородная', use: 'валяние, бурки',                price: 600,  min: 1,  step: 1 }
  ];
  var GRADES = {
    fine:       { name: 'Тонкая',     q: 4 },
    semifine:   { name: 'Полутонкая', q: 3 },
    semicoarse: { name: 'Полугрубая', q: 2 },
    coarse:     { name: 'Грубая',     q: 1 }
  };
  PRODUCTS.forEach(function (p) { p.name = GRADES[p.grade].name + ' шерсть, ' + p.state.toLowerCase(); });

  var data = { PRODUCTS: PRODUCTS, GRADES: GRADES };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.SHOP_DATA = data;
})(this);
