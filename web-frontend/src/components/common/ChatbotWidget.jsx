import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, ShoppingCart, Info } from 'lucide-react';
import chatAPI from '../../api/chatAPI';
import useCart from '../../hooks/useCart';
import { useNavigate } from 'react-router-dom';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Chào bạn! Mình là trợ lý ảo của Pizza Store. Bạn cần tìm bánh hay tư vấn gì hôm nay?',
      products: [],
      suggestions: ['Pizza Hải Sản', 'Có pizza chay không?', 'Dưới 150k']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatPrice = (amount) => {
    return Number(amount).toLocaleString('vi-VN') + 'đ';
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // Build conversation history from recent messages (last 6 messages = 3 turns)
    const recentMessages = updatedMessages
      .filter(m => m.sender === 'user' || m.sender === 'bot')
      .slice(-6)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    try {
      const response = await chatAPI.sendMessage(text, recentMessages);
      const data = response.data || response;
      
      const botMsg = {
        sender: 'bot',
        text: data.reply_message,
        products: data.products || [],
        suggestions: data.suggested_queries || []
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau nhé!'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] flex flex-col overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Pizza Store AI</h3>
                <p className="text-[10px] text-red-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Đang hoạt động
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex gap-2 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-gray-200' : 'bg-red-100'}`}>
                    {msg.sender === 'user' ? <UserIcon className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-red-600" />}
                  </div>
                  
                  {/* Text Bubble */}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-red-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>

                {/* Product Cards (if any) */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 ml-10 w-[260px] sm:w-[300px] flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
                    {msg.products.map(product => (
                      <div key={product.id} className="min-w-[160px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col snap-start">
                        <img 
                          src={product.image_url || 'https://via.placeholder.com/150'} 
                          alt={product.name}
                          className="w-full h-24 object-cover"
                        />
                        <div className="p-2.5 flex flex-col flex-1">
                          <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{product.name}</h4>
                          <p className="font-extrabold text-red-600 text-xs mt-1">{formatPrice(product.base_price)}</p>
                          <div className="mt-auto pt-2.5 flex gap-1.5">
                            <button 
                              onClick={() => navigate(`/product/${product.id}`)}
                              className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg transition cursor-pointer"
                              title="Chi tiết"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => addToCart(product.id, 1, null, [])}
                              className="flex-[2] flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Thêm
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Replies (if any and if this is the last message) */}
                {idx === messages.length - 1 && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 ml-10 flex flex-wrap gap-2">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2 max-w-[90%] flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100">
                  <Bot className="w-4 h-4 text-red-600" />
                </div>
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Nhập câu hỏi..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition max-h-[100px]"
              rows="1"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl transition cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer relative"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;
