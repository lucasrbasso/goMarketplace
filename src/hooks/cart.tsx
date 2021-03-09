import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productList = await AsyncStorage.getItem('@GoMarketplace:products');

      if (productList) {
        setProducts(JSON.parse(productList));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newList = products.map(product => {
        if (product.id === id) {
          product.quantity += 1;
          return product;
        }
        return product;
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newList),
      );

      setProducts(newList);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        increment(product.id);
        return;
      }

      const newList = [...products];
      product.quantity = 1;
      newList.push(product);

      setProducts(newList);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newList),
      );
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      let decrementIndex = '';

      const newList = products.map(product => {
        if (product.id === id) {
          if (product.quantity - 1 > 0) {
            product.quantity -= 1;
            return product;
          }
          decrementIndex = product.id;
        }
        return product;
      });

      if (decrementIndex !== '') {
        const listWithItemRemoved = newList.filter(
          product => product.id !== decrementIndex,
        );

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(listWithItemRemoved),
        );

        setProducts(listWithItemRemoved);
      } else {
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newList),
        );

        setProducts(newList);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
