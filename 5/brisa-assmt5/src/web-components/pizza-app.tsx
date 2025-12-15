import type { WebContext } from 'brisa';
import '../styles/style.css';

// Define types for pizza options and cart items
// this hydrates on the client side after SSR
type SizeOption = 'small' | 'medium' | 'large';
type CrustOption = 'regular' | 'thin' | 'thick';

interface Pizza {
  name: string;
  basePrice: number;
  description: string;
  image: string;
}

interface CartItem {
  id: number;
  name: string;
  basePrice: number;
  size: SizeOption;
  crust: CrustOption;
  unitPrice: number;
  quantity: number;
}

const pizzas: Pizza[] = [
  {
    name: 'Cheese',
    basePrice: 8.0,
    description:
      'Mozzarella cheese, tomato sauce... Ted’s classic! Simple, reliable, and never disappoints.',
    image: '/images/cheese-pizza.jpeg',
  },
  {
    name: 'Pepperoni',
    basePrice: 9.0,
    description:
      'Pepperoni, mozzarella cheese, tomato sauce... Hannah’s favorite! A little spicy, a little bold, and always the life of the party.',
    image: '/images/pepperoni-pizza.jpeg',
  },
  {
    name: 'Hawaiian',
    basePrice: 10.0,
    description:
      'Ham, pineapple, mozzarella cheese, tomato sauce... Madi’s go-to. Sweet, salty, and just controversial enough to start a debate.',
    image: '/images/hawaiian-pizza.jpeg',
  },
  {
    name: 'Meatlovers',
    basePrice: 11.0,
    description:
      'Pepperoni, sausage, bacon, ham, mozzarella cheese... pure chaos in pizza form, but somehow it works (like our group projects).',
    image: '/images/meatlovers-pizza.jpeg',
  },
];

const sizeUpcharges: Record<SizeOption, number> = {
  small: 0,
  medium: 1,
  large: 2,
};

const crustUpcharges: Record<CrustOption, number> = {
  regular: 0,
  thin: 1,
  thick: 1,
};

// Brisa SSR delivers the HTML
// PizzaApp component hydrates after load
export default function PizzaApp(_: unknown, { state }: WebContext) {
  // Webcontext pulls state
  // each pizza row has its own size/crust state
  const selections = pizzas.map(() => ({
    size: state<SizeOption>('small'),
    crust: state<CrustOption>('regular'),
  }));

  const cart = state<CartItem[]>([]);
  const orderMessage = state(''); // transient confirmation banner text
  const idCounter = state(0); // simple incremental id for stable keys/input ids

  const priceFor = (pizza: Pizza, size: SizeOption, crust: CrustOption) =>
    pizza.basePrice + sizeUpcharges[size] + crustUpcharges[crust];

  const updateQuantity = (id: number, qty: number) => {
    cart.value = cart.value.map((item) =>
      item.id === id ? { ...item, quantity: qty } : item,
    );
  };

  const removeItem = (id: number) => {
    cart.value = cart.value.filter((item) => item.id !== id);
  };

  const cartTotal = () =>
    cart.value.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const confirmOrder = () => {
    const total = cartTotal();
    if (total === 0) return;

    const summary = cart.value
      .map(
        (item) =>
          `${item.quantity}x ${item.name} — $${(item.unitPrice * item.quantity).toFixed(2)}`,
      )
      .join('\n');

    orderMessage.value = `Order Confirmed!\n${summary}\nTotal: $${total.toFixed(
      2,
    )}\n\nThank you for your order!`;

    cart.value = []; // clear cart after order confirmation
  };

  // event handlers mutate Brisa state directly
  const addToCart = (index: number) => {
    const pizza = pizzas[index];
    const { size, crust } = selections[index];
    const unitPrice = priceFor(pizza, size.value, crust.value);

    cart.value = [
      ...cart.value,
      {
        id: idCounter.value++,
        name: pizza.name,
        basePrice: pizza.basePrice,
        size: size.value,
        crust: crust.value,
        unitPrice,
        quantity: 1,
      },
    ];

    // reset selectors to defaults
    size.value = 'small';
    crust.value = 'regular';
  };

  const formatSelectionDetails = (item: CartItem) => {
    const sizeLabel = item.size.charAt(0).toUpperCase() + item.size.slice(1);
    const crustLabel = item.crust.charAt(0).toUpperCase() + item.crust.slice(1);

    const sizeText =
      sizeUpcharges[item.size] > 0
        ? `${sizeLabel}: +$${sizeUpcharges[item.size].toFixed(2)}`
        : sizeLabel;

    const crustText =
      crustUpcharges[item.crust] > 0
        ? `${crustLabel} crust: +$${crustUpcharges[item.crust].toFixed(2)}`
        : `${crustLabel} crust`;

    return `Base: $${item.basePrice.toFixed(2)} | ${sizeText} | ${crustText}`;
  };

  return (
    <div class="page">
      <header class="top-bar">
        <img src="public/images/logo.png" alt="logo" class="logo" />
        <div class="bar-title">Hannah, Ted &amp; Madi’s Super Swaggy Pizza</div>
      </header>

      <div class="container">
        <section class="pizzas-section">
          <div class="about-card">
            <div class="about-title">ABOUT</div>
            <p>
              Welcome to our family friendly pizza spot! We’re Hannah, Ted, and
              Madi... three CS majors who love good crust, melty cheese, and
              keeping it super swaggy. We can promise you that this website
              works, but we cannot promise you pizza. We hope you enjoy our site
              as much as we enjoyed making it!
            </p>
          </div>

          <h2 class="pizza-options-title">PIZZA OPTIONS</h2>
          <div class="pizza-grid">
            {pizzas.map((pizza, index) => {
              const sizeState = selections[index].size;
              const crustState = selections[index].crust;
              const unitPrice = priceFor(
                pizza,
                sizeState.value,
                crustState.value,
              );

              return (
                <div class="pizza-card">
                  <img class="pizza-image" src={pizza.image} alt={pizza.name} />
                  <div class="pizza-details">
                    <div class="pizza-name">{pizza.name}</div>
                    <div class="pizza-description">{pizza.description}</div>
                    <div class="pizza-controls">
                      <div class="control-group">
                        <label>Size</label>
                        <div class="button-group size-group">
                          {(['small', 'medium', 'large'] as SizeOption[]).map(
                            (size) => (
                              <button
                                class={[
                                  'option-btn',
                                  sizeState.value === size ? 'active' : '',
                                ].join(' ')}
                                // toggles size state values
                                onClick={() => (sizeState.value = size)}
                              >
                                {size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : 'Large'}
                                {sizeUpcharges[size] > 0 && (
                                  <span class="option-price">
                                    +${sizeUpcharges[size].toFixed(2)}
                                  </span>
                                )}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      <div class="control-group">
                        <label>Crust</label>
                        <div class="button-group crust-group">
                          {(['regular', 'thin', 'thick'] as CrustOption[]).map(
                            (crust) => (
                              <button
                                class={[
                                  'option-btn',
                                  crustState.value === crust ? 'active' : '',
                                ].join(' ')}
                                onClick={() => (crustState.value = crust)}
                              >
                                {crust === 'regular'
                                  ? 'Regular'
                                  : crust === 'thin'
                                    ? 'Thin'
                                    : 'Thick'}
                                {crustUpcharges[crust] > 0 && (
                                  <span class="option-price">
                                    +${crustUpcharges[crust].toFixed(2)}
                                  </span>
                                )}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    <div class="price-display">
                      Total: ${unitPrice.toFixed(2)}
                    </div>
                    <button class="add-btn" onClick={() => addToCart(index)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside class="cart-section">
          <div class="cart-header">CART</div>
          <div class="cart-items">
            {cart.value.length === 0 && (
              <div class="empty-cart">Your cart is empty</div>
            )}

            {cart.value.map((item) => (
              <div class="cart-item">
                <div class="cart-item-name">{item.name}</div>
                <div class="cart-item-details">
                  {formatSelectionDetails(item)}
                </div>
                <div class="cart-item-controls">
                  <div class="quantity-control">
                    <label for={`qty-${item.id}`}>Qty:</label>
                    <input
                      id={`qty-${item.id}`}
                      type="number"
                      min="1"
                      max="99"
                      value={item.quantity}
                      onInput={(event: Event) => {
                        const value = parseInt(
                          (event.target as HTMLInputElement).value,
                          10,
                        );
                        updateQuantity(item.id, isNaN(value) ? 1 : value);
                      }}
                    />
                  </div>
                  <div class="cart-item-price">
                    ${ (item.unitPrice * item.quantity).toFixed(2) }
                  </div>
                  <button class="remove-btn" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div class="cart-total">Total: ${cartTotal().toFixed(2)}</div>
          <button
            class="confirm-order-btn"
            disabled={cartTotal() === 0}
            onClick={confirmOrder}>
            Confirm Order
          </button>

          {orderMessage.value && (
            <div class="order-message">{orderMessage.value}</div>
          )}
        </aside>
      </div>
    </div>
  );
}
