
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Star, Menu, X, MessageCircle, Truck, Phone, Search, Send, Plus, Minus, Trash2, CheckCircle, ArrowRight, MapPin, Facebook, Instagram, Twitter, ChevronRight, Settings, Heart } from 'lucide-react';
import { Cake, CakeCategory, CartItem, Order, Review, ChatMessage, CustomCakeConfig } from './types';
import { INITIAL_CAKES, INITIAL_REVIEWS, WHATSAPP_NUMBER, CAKE_FLAVORS, CAKE_FILLINGS, CAKE_FROSTINGS, BASE_PRICE_PER_KG } from './constants';
import { getGeminiResponse } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<'home' | 'cart' | 'tracking' | 'checkout' | 'builder'>('home');
  const [cakes, setCakes] = useState<Cake[]>(INITIAL_CAKES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [activeCategory, setActiveCategory] = useState<CakeCategory | 'All'>('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Custom Builder State
  const [builderStep, setBuilderStep] = useState(1);
  const [customConfig, setCustomConfig] = useState<CustomCakeConfig>({
    flavor: CAKE_FLAVORS[0],
    filling: CAKE_FILLINGS[0],
    frosting: CAKE_FROSTINGS[0],
    toppers: [],
    weight: 1, // kg
    message: ''
  });
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'model', text: "Habari! I'm your virtual baking assistant from Jayli. Need help choosing a cake for your special occasion?" }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Order Tracking State
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<Order | null>(null);

  // Checkout State
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'MPESA'
  });

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  // SEO: Inject JSON-LD Schema
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Bakery",
      "name": "Jayli Bakers",
      "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
      "telephone": "+254706816485",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Mbita Town",
        "addressLocality": "Mbita",
        "addressRegion": "South Nyanza",
        "addressCountry": "KE"
      },
      "priceRange": "KES 2000 - KES 15000",
      "servesCuisine": "Cake",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "120"
      }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // --- Helpers ---
  const scrollToMenu = () => {
    const menuElement = document.getElementById('menu');
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const calculateCustomPrice = (config: CustomCakeConfig) => {
    const base = BASE_PRICE_PER_KG * config.weight;
    const modifiers = (config.flavor.priceModifier + config.filling.priceModifier + config.frosting.priceModifier) * config.weight;
    return base + modifiers;
  };

  const addToCart = (cake: Cake) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === cake.id && !item.isCustom);
      if (existing) {
        return prev.map(item => item.id === cake.id && !item.isCustom ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...cake, quantity: 1, weight: 1, isCustom: false }];
    });
  };

  const addCustomToCart = () => {
    const price = calculateCustomPrice(customConfig);
    const customItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: `Custom ${customConfig.flavor.name} Cake`,
      description: `${customConfig.filling.name}, ${customConfig.frosting.name}`,
      price: price / customConfig.weight, // Store per-unit price roughly
      category: CakeCategory.GENERAL,
      imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800&auto=format&fit=crop',
      rating: 5,
      quantity: 1,
      weight: customConfig.weight,
      isCustom: true,
      configuration: customConfig
    };
    
    setCart(prev => [...prev, customItem]);
    setBuilderStep(1); // Reset
    setView('cart');
  };

  const handleBuyNow = (cake: Cake) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === cake.id);
        if (existing) {
          return prev; 
        }
        return [...prev, { ...cake, quantity: 1, weight: 1 }];
    });
    
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => {
    if (item.isCustom && item.configuration) {
       return acc + calculateCustomPrice(item.configuration);
    }
    return acc + (item.price * item.quantity);
  }, 0);

  // --- Chat Logic ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${m.text}`);
    const responseText = await getGeminiResponse(userMsg.text, history);

    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsTyping(false);
  };

  // --- Checkout & WhatsApp Logic ---
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderId = `JL-${Math.floor(Math.random() * 8999) + 1000}`; // 4 digit random
    
    const newOrder: Order = {
      id: orderId,
      items: [...cart],
      total: cartTotal,
      status: 'Pending',
      customerName: checkoutForm.name,
      date: new Date().toISOString()
    };
    
    setOrders(prev => [...prev, newOrder]);

    // Format WhatsApp Message
    let itemsText = "";
    cart.forEach(item => {
        if (item.isCustom && item.configuration) {
            itemsText += `• *CUSTOM CAKE* (${item.configuration.weight}kg)\n`;
            itemsText += `  - Flavor: ${item.configuration.flavor.name}\n`;
            itemsText += `  - Filling: ${item.configuration.filling.name}\n`;
            itemsText += `  - Finish: ${item.configuration.frosting.name}\n`;
            if (item.configuration.message) itemsText += `  - Message: "${item.configuration.message}"\n`;
            itemsText += `  @ KES ${calculateCustomPrice(item.configuration).toLocaleString()}\n`;
        } else {
            itemsText += `• ${item.name} (${item.quantity} x 1kg) @ KES ${(item.price * item.quantity).toLocaleString()}\n`;
        }
    });

    const message = `*NEW ORDER ${orderId}* 🎂\n\n*Customer:* ${checkoutForm.name}\n*Phone:* ${checkoutForm.phone}\n*Location:* ${checkoutForm.address}\n\n*Order Details:*\n${itemsText}\n\n*Total:* KES ${cartTotal.toLocaleString()}\n*Payment:* ${checkoutForm.paymentMethod}\n\nPlease confirm order.`;
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    
    setCart([]);
    setView('home');
    window.open(url, '_blank');
  };

  const handleTrackOrder = () => {
    const found = orders.find(o => o.id === trackId);
    setTrackResult(found || null);
    if (!found) alert('Order not found. Please check ID.');
  };

  // --- Views ---

  const renderNavbar = () => (
    <nav className="bg-brand-600 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
             <span className="text-3xl font-bold font-serif italic text-white">Jayli</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <button onClick={() => { setView('home'); setTimeout(scrollToMenu, 100); }} className="hover:text-pink-100 hover:scale-105 transition-all px-3 py-2 rounded-md font-medium text-white">Menu</button>
              <button onClick={() => setView('builder')} className="hover:text-pink-100 hover:scale-105 transition-all px-3 py-2 rounded-md font-medium text-white flex items-center gap-1"><Settings className="w-4 h-4"/> Build Your Cake</button>
              <button onClick={() => setView('tracking')} className="hover:text-pink-100 hover:scale-105 transition-all px-3 py-2 rounded-md font-medium text-white">Track Order</button>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative cursor-pointer hover:text-pink-100 transition-colors" onClick={() => setView('cart')}>
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-brand-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border border-brand-600">
                  {cart.length}
                </span>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-pink-100 focus:outline-none">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-brand-700 animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => { setView('home'); scrollToMenu(); setIsMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-brand-600 w-full text-left">Menu</button>
            <button onClick={() => { setView('builder'); setIsMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-pink-200 hover:bg-brand-600 w-full text-left font-bold">Build Your Cake</button>
            <button onClick={() => { setView('tracking'); setIsMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-brand-600 w-full text-left">Track Order</button>
            <button onClick={() => { setView('cart'); setIsMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-brand-600 w-full text-left">Cart ({cart.length})</button>
          </div>
        </div>
      )}
    </nav>
  );

  const renderHero = () => (
    <div className="relative bg-cream-dark overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-cream-dark sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-chocolate sm:text-5xl md:text-6xl font-serif">
                <span className="block xl:inline">Premium Cakes for</span>{' '}
                <span className="block text-brand-600 xl:inline">Every Moment</span>
              </h1>
              <p className="mt-3 text-base text-gray-700 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Crafting sweet memories in <strong>Mbita, South Nyanza</strong>. From elegant weddings to fun kids' parties, we bake with love and passion.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => { setView('home'); setTimeout(scrollToMenu, 100); }} 
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-brand-600 hover:bg-brand-700 md:py-4 md:text-lg md:px-10 transition-all transform hover:-translate-y-1 shadow-lg"
                >
                  Order Menu Cake
                </button>
                <button 
                  onClick={() => setView('builder')}
                  className="flex items-center justify-center px-8 py-3 border-2 border-brand-600 text-base font-medium rounded-full text-brand-600 bg-white hover:bg-brand-50 md:py-4 md:text-lg md:px-10 transition-all transform hover:-translate-y-1"
                >
                  Build Custom Cake
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1600&auto=format&fit=crop" alt="Delicious Cake Display" />
      </div>
    </div>
  );

  const renderBuilder = () => {
    const currentPrice = calculateCustomPrice(customConfig);
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
         <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-chocolate font-serif mb-4">Cake Configurator</h2>
            <p className="text-gray-600">Design your dream cake in 4 simple steps.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Steps Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Progress Bar */}
              <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    builderStep >= step ? 'bg-brand-600 text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                ))}
              </div>

              {/* Step 1: Flavor */}
              {builderStep === 1 && (
                <div className="bg-white p-6 rounded-2xl shadow-md animate-fade-in">
                  <h3 className="text-2xl font-bold text-chocolate mb-6">Choose Your Sponge Base</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CAKE_FLAVORS.map(flavor => (
                      <button
                        key={flavor.id}
                        onClick={() => setCustomConfig({...customConfig, flavor})}
                        className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                          customConfig.flavor.id === flavor.id 
                            ? 'border-brand-500 bg-brand-50' 
                            : 'border-gray-200 hover:border-brand-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-900">{flavor.name}</span>
                          {flavor.priceModifier > 0 && <span className="text-xs font-medium text-brand-600 bg-brand-100 px-2 py-1 rounded-full">+{flavor.priceModifier} KES/kg</span>}
                        </div>
                        <p className="text-sm text-gray-500">{flavor.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Filling & Frosting */}
              {builderStep === 2 && (
                <div className="bg-white p-6 rounded-2xl shadow-md animate-fade-in">
                   <h3 className="text-2xl font-bold text-chocolate mb-6">Inside & Out</h3>
                   <div className="mb-8">
                     <h4 className="text-lg font-semibold mb-3">Filling</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {CAKE_FILLINGS.map(filling => (
                          <button
                            key={filling.id}
                            onClick={() => setCustomConfig({...customConfig, filling})}
                            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                              customConfig.filling.id === filling.id ? 'bg-chocolate text-white border-chocolate' : 'bg-white text-gray-600 border-gray-200 hover:border-chocolate'
                            }`}
                          >
                            {filling.name}
                          </button>
                        ))}
                     </div>
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold mb-3">Outer Finish (Frosting)</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {CAKE_FROSTINGS.map(frosting => (
                          <button
                            key={frosting.id}
                            onClick={() => setCustomConfig({...customConfig, frosting})}
                            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                              customConfig.frosting.id === frosting.id ? 'bg-chocolate text-white border-chocolate' : 'bg-white text-gray-600 border-gray-200 hover:border-chocolate'
                            }`}
                          >
                            {frosting.name}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>
              )}

              {/* Step 3: Size & Message */}
              {builderStep === 3 && (
                <div className="bg-white p-6 rounded-2xl shadow-md animate-fade-in">
                   <h3 className="text-2xl font-bold text-chocolate mb-6">Size & Personalization</h3>
                   <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cake Weight (KG)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="5" 
                          step="0.5" 
                          value={customConfig.weight}
                          onChange={(e) => setCustomConfig({...customConfig, weight: parseFloat(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                        />
                        <span className="text-2xl font-bold text-brand-600 w-20 text-center">{customConfig.weight} KG</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Serves approx {customConfig.weight * 6}-{customConfig.weight * 8} people.</p>
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Message on Cake (Optional)</label>
                      <input 
                        type="text" 
                        maxLength={30}
                        placeholder="e.g., Happy Birthday Mom!"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        value={customConfig.message}
                        onChange={(e) => setCustomConfig({...customConfig, message: e.target.value})}
                      />
                   </div>
                </div>
              )}

              {/* Step 4: Review */}
              {builderStep === 4 && (
                <div className="bg-white p-6 rounded-2xl shadow-md animate-fade-in text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-chocolate mb-2">Ready to Bake!</h3>
                  <p className="text-gray-600 mb-8">Your custom cake configuration is complete. Add to cart to proceed.</p>
                  
                  <div className="text-left bg-gray-50 p-6 rounded-xl mb-6 space-y-2">
                    <p><strong>Base:</strong> {customConfig.flavor.name}</p>
                    <p><strong>Filling:</strong> {customConfig.filling.name}</p>
                    <p><strong>Finish:</strong> {customConfig.frosting.name}</p>
                    <p><strong>Weight:</strong> {customConfig.weight} KG</p>
                    <p><strong>Message:</strong> {customConfig.message || "None"}</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {builderStep > 1 && (
                  <button 
                    onClick={() => setBuilderStep(prev => prev - 1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                <div className="flex-1"></div>
                {builderStep < 4 ? (
                  <button 
                    onClick={() => setBuilderStep(prev => prev + 1)}
                    className="px-8 py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center"
                  >
                    Next Step <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                ) : (
                  <button 
                    onClick={addCustomToCart}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center shadow-lg transform hover:-translate-y-1"
                  >
                    Add Custom Cake to Cart
                  </button>
                )}
              </div>

            </div>

            {/* Sticky Summary Column */}
            <div className="lg:col-span-1">
               <div className="bg-chocolate text-cream p-6 rounded-2xl sticky top-24 shadow-xl">
                 <h3 className="text-xl font-bold mb-6 font-serif border-b border-white/20 pb-4">Estimated Price</h3>
                 
                 <div className="space-y-4 text-sm mb-6">
                   <div className="flex justify-between">
                     <span>Base Price ({customConfig.weight}kg)</span>
                     <span>{(BASE_PRICE_PER_KG * customConfig.weight).toLocaleString()}</span>
                   </div>
                   {customConfig.flavor.priceModifier > 0 && (
                     <div className="flex justify-between text-pink-300">
                       <span>Flavor Upgrade</span>
                       <span>+{(customConfig.flavor.priceModifier * customConfig.weight).toLocaleString()}</span>
                     </div>
                   )}
                   {customConfig.filling.priceModifier > 0 && (
                     <div className="flex justify-between text-pink-300">
                       <span>Filling Upgrade</span>
                       <span>+{(customConfig.filling.priceModifier * customConfig.weight).toLocaleString()}</span>
                     </div>
                   )}
                   {customConfig.frosting.priceModifier > 0 && (
                     <div className="flex justify-between text-pink-300">
                       <span>Finish Upgrade</span>
                       <span>+{(customConfig.frosting.priceModifier * customConfig.weight).toLocaleString()}</span>
                     </div>
                   )}
                 </div>
                 
                 <div className="border-t border-white/20 pt-4 mb-8">
                   <div className="flex justify-between text-2xl font-bold">
                     <span>Total</span>
                     <span>KES {currentPrice.toLocaleString()}</span>
                   </div>
                 </div>

                 <p className="text-xs text-white/60 text-center italic">Final price may vary slightly based on complex custom decorations requested later.</p>
               </div>
            </div>
         </div>
      </div>
    );
  }

  const renderMenu = () => {
    const categories = ['All', ...Object.values(CakeCategory)];
    const filteredCakes = activeCategory === 'All' 
      ? cakes 
      : cakes.filter(c => c.category === activeCategory);
    
    return (
      <div id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <h2 className="text-4xl font-extrabold text-chocolate text-center mb-4 font-serif">Our Creations</h2>
        <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">Handpicked ingredients, baked to perfection. Choose your favorite category below.</p>
        
        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 shadow-sm ${
                activeCategory === cat 
                  ? 'bg-brand-600 text-white ring-2 ring-offset-2 ring-brand-500' 
                  : 'bg-white text-gray-700 hover:bg-brand-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCakes.map(cake => (
            <div key={cake.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group border border-gray-100">
              <div className="relative overflow-hidden h-60 bg-gray-200">
                <img src={cake.imageUrl} alt={cake.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-chocolate uppercase tracking-wide shadow-sm">
                  {cake.category}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center mb-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-600">{cake.rating}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-serif mb-2 group-hover:text-brand-600 transition-colors">{cake.name}</h3>
                <p className="text-gray-600 text-sm flex-1 leading-relaxed">{cake.description}</p>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-2xl font-bold text-brand-600">KES {cake.price.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => addToCart(cake)}
                      className="flex items-center justify-center py-2.5 px-4 border-2 border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors font-bold text-sm focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                      aria-label={`Add ${cake.name} to cart`}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </button>
                    <button 
                      onClick={() => handleBuyNow(cake)}
                      className="flex items-center justify-center py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-bold text-sm shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                      aria-label={`Order ${cake.name} now`}
                    >
                      Order Now <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReviews = () => (
    <div className="bg-brand-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-chocolate text-center mb-12 font-serif">Customer Love</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map(review => (
            <div key={review.id} className="bg-white p-8 rounded-xl shadow-md border-t-4 border-brand-400">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 italic mb-6 leading-relaxed">"{review.comment}"</p>
              <div className="flex justify-between items-center text-sm border-t pt-4">
                <span className="font-bold text-chocolate">{review.customerName}</span>
                <span className="text-gray-400">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-600">Have you tasted our cakes? Send your review to our WhatsApp!</p>
        </div>
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-8 text-chocolate font-serif">Your Basket</h2>
      {cart.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl shadow border border-gray-100">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-6 text-lg">Your basket is empty.</p>
          <button onClick={() => setView('home')} className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-colors">
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {cart.map(item => (
              <div key={item.id} className="flex bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 transition-shadow hover:shadow-md">
                <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600" aria-label="Remove item">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  {item.isCustom && item.configuration ? (
                     <div className="text-xs text-gray-500 mt-1 mb-2 space-y-0.5">
                       <p>Flavor: {item.configuration.flavor.name}</p>
                       <p>Filling: {item.configuration.filling.name}</p>
                       <p>Weight: {item.configuration.weight}kg</p>
                       <p className="font-bold text-brand-600">KES {calculateCustomPrice(item.configuration).toLocaleString()}</p>
                     </div>
                  ) : (
                    <p className="text-brand-600 font-bold mt-1">KES {item.price.toLocaleString()}</p>
                  )}
                  
                  {!item.isCustom && (
                    <div className="flex items-center mt-3">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="mx-4 font-medium text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold mb-6 text-gray-800">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>KES {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery (Mbita/Environs)</span>
                  <span>KES 300</span>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-300 pt-4 flex justify-between font-bold text-xl mb-8 text-chocolate">
                <span>Total</span>
                <span>KES {(cartTotal + 300).toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setView('checkout')}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition-all flex justify-center items-center shadow-lg transform hover:-translate-y-0.5"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCheckout = () => (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <button onClick={() => setView('cart')} className="mb-6 text-gray-500 hover:text-brand-600 flex items-center font-medium transition-colors">
        &larr; Back to Cart
      </button>
      <h2 className="text-3xl font-bold mb-8 text-chocolate font-serif">Secure Checkout</h2>
      <form onSubmit={handleCheckout} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-slide-up">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input 
              required 
              type="text" 
              className="w-full border-gray-300 rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              placeholder="e.g. Jane Doe"
              value={checkoutForm.name}
              onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">M-Pesa Number</label>
            <input 
              required 
              type="tel" 
              placeholder="07..."
              className="w-full border-gray-300 rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              value={checkoutForm.phone}
              onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Location Details</label>
            <textarea 
              required 
              rows={3}
              placeholder="e.g. Near Mbita Ferry Terminal, Blue Gate"
              className="w-full border-gray-300 rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              value={checkoutForm.address}
              onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})}
            />
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
            <div className="flex gap-4">
               <div className="flex items-center border p-4 rounded-xl w-full cursor-pointer bg-green-50 border-green-200">
                 <div className="h-5 w-5 rounded-full border-2 border-green-600 flex items-center justify-center">
                   <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
                 </div>
                 <label className="ml-3 block text-sm font-bold text-gray-800">
                   Lipa na M-Pesa / Send Money
                 </label>
               </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 flex items-start">
               <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
               <p>We'll create a WhatsApp order for you. You'll receive the specific <strong>Till Number</strong> or <strong>Send Money</strong> details directly in the chat to confirm your payment securely.</p>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full mt-8 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-1"
        >
          <MessageCircle className="w-6 h-6" />
          Complete Order via WhatsApp
        </button>
      </form>
    </div>
  );

  const renderTracking = () => (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-8 text-center text-chocolate font-serif">Track Your Cake</h2>
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border border-gray-100">
        <p className="text-gray-500 mb-4 text-center">Enter the Order ID you received on WhatsApp (e.g., JL-1234)</p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <input 
            type="text" 
            placeholder="Order ID" 
            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
          />
          <button onClick={handleTrackOrder} className="bg-brand-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors">
            Track
          </button>
        </div>
      </div>

      {trackResult && (
        <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-md animate-fade-in">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <h3 className="text-xl font-bold text-gray-800">Order #{trackResult.id}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              trackResult.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {trackResult.status}
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex items-start text-gray-600">
              <Truck className="w-5 h-5 mr-3 text-brand-500 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Status: {trackResult.status}</p>
                <p className="text-sm">{trackResult.status === 'Pending' ? 'Order received, awaiting payment confirmation.' : 'Your order is being processed.'}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700 mb-2">Items:</p>
              <ul className="list-disc ml-5 text-gray-600 space-y-1">
                {trackResult.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} 
                    {item.isCustom ? ` (${item.weight}kg Custom)` : ` (${item.quantity}kg)`}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-right font-bold text-lg text-chocolate">
              Total: KES {trackResult.total.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {renderNavbar()}

      <div className="flex-grow">
        {view === 'home' && (
          <>
            {renderHero()}
            {renderMenu()}
            {renderReviews()}
          </>
        )}
        {view === 'builder' && renderBuilder()}
        {view === 'cart' && renderCart()}
        {view === 'checkout' && renderCheckout()}
        {view === 'tracking' && renderTracking()}
      </div>

      {/* Footer */}
      <footer className="bg-chocolate text-cream py-8 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Brand Section */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-2xl font-bold mb-3 font-serif italic text-white">Jayli</h3>
              <p className="text-cream/80 leading-relaxed mb-4 text-xs">
                Making sweet memories since 2015. We bake premium cakes for weddings, birthdays, and graduations in South Nyanza.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/jaylibakers" target="_blank" rel="noreferrer" className="text-cream/60 hover:text-white transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5"/></a>
                <a href="#" className="text-cream/60 hover:text-white transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5"/></a>
                <a href="#" className="text-cream/60 hover:text-white transition-colors" aria-label="Twitter"><Twitter className="h-5 w-5"/></a>
              </div>
            </div>

            {/* Quick Links Section - Responsive */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
              <h3 className="text-lg font-bold mb-3 text-white font-serif tracking-wide border-b border-brand-600 pb-1 inline-block">Quick Links</h3>
              <ul className="space-y-2 w-full">
                <li>
                  <button 
                    className="text-cream/80 hover:text-brand-300 transition-colors w-full md:w-auto md:text-left text-center block hover:translate-x-1 duration-200" 
                    onClick={() => { setView('home'); setActiveCategory(CakeCategory.WEDDING); setTimeout(scrollToMenu, 100); }}
                  >
                    Wedding Cakes
                  </button>
                </li>
                <li>
                  <button 
                    className="text-cream/80 hover:text-brand-300 transition-colors w-full md:w-auto md:text-left text-center block hover:translate-x-1 duration-200" 
                    onClick={() => { setView('home'); setActiveCategory(CakeCategory.GRADUATION); setTimeout(scrollToMenu, 100); }}
                  >
                    Graduation Cakes
                  </button>
                </li>
                <li>
                  <button 
                    className="text-cream/80 hover:text-brand-300 transition-colors w-full md:w-auto md:text-left text-center block hover:translate-x-1 duration-200" 
                    onClick={() => setView('builder')}
                  >
                    Custom Cake Builder
                  </button>
                </li>
                <li>
                  <button 
                    className="text-cream/80 hover:text-brand-300 transition-colors w-full md:w-auto md:text-left text-center block hover:translate-x-1 duration-200" 
                    onClick={() => setView('tracking')}
                  >
                    Track Your Order
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-lg font-bold mb-3 text-white font-serif tracking-wide border-b border-brand-600 pb-1 inline-block">Get In Touch</h3>
              <div className="space-y-2">
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center text-cream/80 hover:text-white transition-colors group justify-center md:justify-start"
                >
                  <Phone className="h-4 w-4 mr-2 text-brand-500 group-hover:scale-110 transition-transform" /> 
                  0706 816 485
                </a>
                <div className="flex items-center text-cream/80 group justify-center md:justify-start">
                  <MapPin className="h-4 w-4 mr-2 text-brand-500" />
                  <span>Mbita, South Nyanza</span>
                </div>
                <div className="flex items-center text-cream/80 justify-center md:justify-start">
                  <Truck className="h-4 w-4 mr-2 text-brand-500" />
                  <span>Delivery within South Nyanza</span>
                </div>
              </div>
            </div>

          </div>
          <div className="border-t border-chocolate-light mt-8 pt-4 text-center text-cream/40 text-xs">
            &copy; {new Date().getFullYear()} Bussllus Bertrand. All rights reserved.
          </div>
        </div>
      </footer>

      {/* AI Chat Bot */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen && (
          <button 
            onClick={() => setChatOpen(true)}
            className="bg-brand-600 text-white p-4 rounded-full shadow-2xl hover:bg-brand-700 transition-transform hover:scale-110 flex items-center justify-center animate-bounce-slow"
            aria-label="Open support chat"
          >
            <MessageCircle className="h-7 w-7" />
          </button>
        )}
        
        {chatOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 md:w-96 flex flex-col overflow-hidden border border-gray-200 animate-slide-up" style={{ maxHeight: '600px' }}>
            <div className="bg-chocolate p-4 flex justify-between items-center text-cream">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Star className="h-4 w-4 text-brand-400 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Jayli Assistant</h3>
                  <p className="text-xs text-cream/70">Online</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="hover:text-white transition-colors bg-white/10 p-1 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 h-80">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start mb-3">
                  <div className="bg-gray-200 text-gray-500 rounded-lg p-2 text-xs italic">
                    Baking a response...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder="Ask about flavors..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isTyping}
                className="bg-brand-600 text-white p-2.5 rounded-full hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-md"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
