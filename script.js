function createProductImageElement(imageSource) {
  const img = document.createElement('img');
  img.className = 'item__image';
  img.src = imageSource;
  return img;
}

function createCustomElement(element, className, innerText) {
  const e = document.createElement(element);
  e.className = className;
  e.innerText = innerText;
  return e;
}

function createProductItemElement({ sku, name, image }) {
  const section = document.createElement('section');
  section.className = 'item';
  section.appendChild(createCustomElement('span', 'item__sku', sku));
  section.appendChild(createCustomElement('span', 'item__title', name));
  section.appendChild(createProductImageElement(image));
  section.appendChild(createCustomElement('button', 'item__details', 'ver detalhes'));
  section.appendChild(createCustomElement('button', 'item__add', 'Adicionar ao carrinho! '));
  return section;
}

function clearMessage(event, container) {
  container.removeChild(event.target.parentElement);
}

function message(text) {
  const container = document.querySelector('.container');
  const messageContainer = createCustomElement('div', 'message', '');
  container.appendChild(messageContainer);
  messageContainer.appendChild(createCustomElement('h2', 'message-title', 'Erro'));
  messageContainer.appendChild(createCustomElement('p', 'text-message', text));
  const btn = createCustomElement('button', 'btn-message', 'OK');
  btn.addEventListener('click', (event) => clearMessage(event));
  messageContainer.appendChild(btn);
}

function checkResponse(response) {
  if (response.ok) return response.json();
  throw new Error('Ocorreu um erro com a requisição');
}

function fetchApi(url) {
  return fetch(url)
    .then((response) => checkResponse(response))
    .catch((err) => console.log(err));
}

function removeItemStorage(item) {
  const idRemove = Number(item.id);
  const items = localStorage.getItem('cart');
  const listItems = JSON.parse(items);
  const newList = listItems.filter(({ id }) => id !== idRemove);
  localStorage.setItem('cart', JSON.stringify(newList));
}

function sumTotal() {
  const totalPrice = document.querySelector('.total-price');
  const cartItems = document.querySelectorAll('.cart__item');
  const priceItems = Array.prototype.map.call(cartItems, 
      (item) => Number(item.innerText.slice(item.innerText.indexOf('$') + 1)))
    .reduce((total, price) => total + price, 0);
  totalPrice.innerText = priceItems;
}

function cartItemClickListener(event) {
  const item = event.target;
  if (item.src) item.parentNode.parentNode.removeChild(item.parentNode);
  item.parentElement.removeChild(item);
  removeItemStorage(item);
  sumTotal();
}

function createCartItemElement({ sku, name, salePrice, thumbnail }) { 
  const li = document.createElement('li');
  const img = document.createElement('img');
  img.src = thumbnail;
  li.className = 'cart__item';
  li.innerText = `SKU: ${sku} | NAME: ${name} | PRICE: $${salePrice}`;
  li.appendChild(img);
  li.addEventListener('click', cartItemClickListener);
  return li;
}

function addInLocalStorage(item) {
  const items = localStorage.getItem('cart') || '[]';
  const listItems = JSON.parse(items);
  listItems.push(item);
  localStorage.setItem('cart', JSON.stringify(listItems));
}

function addItemInCart(event) {
  const cartItem = document.querySelector('.cart__items');
  const idItem = event.target.parentNode.firstChild.innerText;
  fetchApi(`https://api.mercadolibre.com/items/${idItem}`)
    .then(({ id: sku, title: name, price: salePrice, thumbnail }) => {
      const id = Date.now();
      const li = createCartItemElement({ sku, name, salePrice, thumbnail });
      li.id = id;
      cartItem.appendChild(li);
      addInLocalStorage({ sku, name, salePrice, thumbnail, id });
      sumTotal();
    })
    .catch(() => message('O item adicionado não está disponível'));
}

function returnToItems(event, element) {
  element.remove();
  const items = document.querySelector('.items');
  items.style.display = 'flex';
}

function renderImage(event) {
  const image = document.querySelector('.picture-main');
  image.src = event.target.src;
}

function fillMenuPictures(urls, menuPictures) {
  urls.forEach((url) => {
    const img = document.createElement('img');
    img.src = url;
    img.addEventListener('click', renderImage);
    menuPictures.appendChild(img);
  });
}

function createPicturesContainer(pictures, textDetails) {
  const picturesContainer = createCustomElement('div', 'pictures-container', '');
  const menuPictures = createCustomElement('div', 'pictures-menu', '');
  const urls = pictures.map(({ url }) => url);
  menuPictures.appendChild(createCustomElement('div', 'text-details', textDetails));
  fillMenuPictures(urls, menuPictures);
  const pictureMain = createCustomElement('img', 'picture-main', '');
  const [path] = urls;
  pictureMain.src = path;
  picturesContainer.appendChild(menuPictures);
  picturesContainer.appendChild(pictureMain);
  return picturesContainer;
}

function createDetailsContainer({ title, pictures, price, warranty, id }) {
  const detailsContainer = createCustomElement('div', 'deatails-container', '');
  detailsContainer.appendChild(createCustomElement('span', 'id-details', id));
  const btnBack = document.createElement('button');
  btnBack.innerHTML = '<i class="fas fa-chevron-left"></i> Back';
  btnBack.addEventListener('click', (event) => returnToItems(event, detailsContainer));
  detailsContainer.appendChild(btnBack);
  detailsContainer.appendChild(createCustomElement('h2', 'details-title', title));
  const textDetails = `Preço: ${price.toFixed(2)} \n Garantia: ${warranty}`;
  detailsContainer.appendChild(createPicturesContainer(pictures, textDetails));
  const btn = createCustomElement('button', 'item__add', 'Adicionar ao carrinho! ');
  btn.addEventListener('click', addItemInCart);
  detailsContainer.appendChild(btn);
  return detailsContainer;
}

function renderDetails(event) {
  const container = document.querySelector('.container');
  const items = document.querySelector('.items');
  const idItem = event.target.parentNode.firstChild.innerText;
  fetchApi(`https://api.mercadolibre.com/items/${idItem}`)
    .then((response) => {
      const deatailsContainer = createDetailsContainer(response);
      items.style.display = 'none';
      container.insertAdjacentElement('afterbegin', deatailsContainer);
    })
    .catch(() => message('Os detalhes deste item não está disponível'));
}

function addBtnEvent(className, callback) {
  const btnArray = document.querySelectorAll(className);
  btnArray.forEach((btn) => {
    btn.addEventListener('click', (event) => callback(event));
  });
}

function addItems(results, items) {
  const loading = items;
  loading.innerHTML = '';
  const arrayResults = results
    .map(({ id: sku, title: name, thumbnail }) => {
      const image = thumbnail.replace(/-I.jpg/g, '-O.jpg');
      return ({ sku, name, image });
    });
  arrayResults.forEach((objResult) => items.appendChild(createProductItemElement(objResult)));
  addBtnEvent('.item__add', addItemInCart);
  addBtnEvent('.item__details', renderDetails);
}

function createTotalPriceContainer() {
  const cart = document.querySelector('.cart');
  const totalContainer = createCustomElement('section', 'total-container', ' ');
  cart.firstElementChild.insertAdjacentElement('afterend', totalContainer);
  const text = createCustomElement('p', 'text-price', 'TOTAL R$');
  totalContainer.appendChild(text);
  const totalPrice = createCustomElement('p', 'total-price', 0);
  totalContainer.appendChild(totalPrice);
}

function loadCart(cartItems) {
  const items = localStorage.getItem('cart') || '[]';
  const listItems = JSON.parse(items); 
  listItems.forEach((item) => {
    const li = createCartItemElement(item);
    li.id = item.id;
    cartItems.appendChild(li);
  });
  sumTotal();
}

function clearItems(cartItems) {
  const items = cartItems;
  items.innerHTML = '';
  localStorage.setItem('cart', '[]');
  sumTotal();
}

function addEventEmptyCart(cartItems) {
  const emptyCart = document.querySelector('.empty-cart');
  emptyCart.addEventListener('click', () => clearItems(cartItems));
}

function addLoading(items) {
  const loading = createCustomElement('p', 'loading', 'loading...');
  items.appendChild(loading);
}

function search(searchWord, items) {
  const loading = items;
  loading.innerHTML = '';
  addLoading(items);
  fetchApi(`https://api.mercadolibre.com/sites/MLB/search?q=${searchWord}`)
    .then(({ results }) => addItems(results, items))
    .catch(() => message('O produto procurado não foi encontrado'));
} 

window.onload = function onload() { 
  const items = document.querySelector('.items');
  const cartItems = document.querySelector('.cart__items');
  const searchWord = document.getElementById('search');
  createTotalPriceContainer();
  loadCart(cartItems);
  addEventEmptyCart(cartItems);
  search('computador', items);
  searchWord.addEventListener('input', (event) => search(event.target.value, items));
};
