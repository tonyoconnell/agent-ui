// ported from shop/buy-in-chatgpt/BuyInChatGPT.tsx on 2026-04-20
/**
 * Product Chat Assistant
 *
 * A specialized chat interface for product pages:
 * - Messages displayed at top (scrollable)
 * - Suggested questions about the product
 * - Reads page context (product details) automatically
 * - Input fixed at bottom
 *
 * NOTE: AddToCartCard import dropped — outside the 8-file port scope.
 * showAddToCart messages will display the assistant text only.
 */

import { useEffect, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  showAddToCart?: boolean
}

interface ProductContext {
  title: string
  price: number
  description: string
  category: string
  brand: string
  stock: number
  features?: string[]
  image?: string
}

export function BuyInChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your AI shopping assistant. I can help you learn more about this product, compare features, or answer any questions you have. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [productContext, setProductContext] = useState<ProductContext | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Suggested questions based on product
  const suggestedQuestions = [
    'Tell me about this fragrance',
    'How long does it last?',
    'Is this a good gift?',
    'I want to buy this', // Triggers add to cart
    "What's included in the box?",
    'How do I purchase?', // Triggers add to cart
  ]

  // Extract product context from the page
  useEffect(() => {
    try {
      // Read product data from the page
      const title = document.querySelector('h1')?.textContent || ''

      // Get product price (look for the main price, not strikethrough)
      let price = 0

      // Try to find price in main product section (avoid strikethrough prices)
      const priceElements = document.querySelectorAll('[class*="tabular-nums"]:not([class*="line-through"])')

      // Find the first significant price (likely the main product price)
      for (const el of Array.from(priceElements)) {
        const val = parseFloat(el.textContent?.replace(/[^0-9.]/g, '') || '0')
        if (val > 10 && price === 0) {
          // First significant price found
          price = val
          break
        }
      }

      // Get description (first paragraph with leading-relaxed class)
      const descriptionElement = document.querySelector('p[class*="leading-relaxed"]')
      const description = descriptionElement?.textContent || ''

      // Extract category (uppercase tracking text)
      const categoryElement = document.querySelector('[class*="tracking"][class*="uppercase"]')
      const category = categoryElement?.textContent || ''

      // Extract brand (look for "Brand" spec or in title)
      let brand = ''
      const brandSpec = Array.from(document.querySelectorAll('span')).find((el) =>
        el.textContent?.toLowerCase().includes('brand'),
      )
      if (brandSpec) {
        brand = brandSpec.nextElementSibling?.textContent || ''
      } else {
        // Try to extract from title
        const brandMatch = title.match(/^([A-Z][a-z]+)/)
        brand = brandMatch ? brandMatch[1] : 'Brand'
      }

      // Extract stock (look for "units available" or "stock" text)
      let stock = 0
      const stockText = Array.from(document.querySelectorAll('*')).find(
        (el) => el.textContent?.includes('units available') || el.textContent?.includes('stock'),
      )
      if (stockText) {
        const stockMatch = stockText.textContent?.match(/(\d+)\s*units?/i)
        stock = stockMatch ? parseInt(stockMatch[1], 10) : 0
      }

      // Extract features (look for bullet points or feature lists)
      const features: string[] = []
      document.querySelectorAll('li, [class*="feature"]').forEach((el) => {
        const text = el.textContent?.trim()
        if (text && text.length > 10 && text.length < 200) {
          features.push(text)
        }
      })

      // Extract product image (first img tag in main content)
      const imageElement = document.querySelector('img[alt*="product" i], img[src*="product" i], main img, article img')
      const image = imageElement?.getAttribute('src') || ''

      setProductContext({
        title,
        price,
        description,
        category,
        brand,
        stock,
        features: features.slice(0, 5), // Limit to 5 key features
        image,
      })
    } catch (error) {
      console.error('Error extracting product context:', error)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build system prompt with product context
      const featuresText =
        productContext?.features && productContext.features.length > 0
          ? `\nKey Features:\n${productContext.features.map((f) => `- ${f}`).join('\n')}`
          : ''

      const systemPrompt = productContext
        ? `You are a helpful shopping assistant for an e-commerce store. You're currently helping a customer who is viewing this product:

Product: ${productContext.title}
Brand: ${productContext.brand}
Category: ${productContext.category}
Price: $${productContext.price.toFixed(2)}
Description: ${productContext.description}
Stock: ${productContext.stock} units available${featuresText}

Answer questions about this product, provide recommendations, compare it to alternatives, and help the customer make an informed purchase decision. Be friendly, knowledgeable, and concise. If they ask about shipping, returns, or warranties, mention: Free shipping worldwide, 90-day money-back guarantee, and 3-year warranty.`
        : 'You are a helpful shopping assistant. Answer questions about products and help customers make informed decisions.'

      // Call Product Chat API (no auth required)
      const response = await fetch('/api/buy-in-chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
          model: 'google/gemini-2.5-flash-lite', // Gemini Flash Lite - free, unlimited
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const aiContent = data.choices?.[0]?.message?.content || 'Sorry, I encountered an error. Please try again.'

      // Check if user is asking to buy or add to cart
      const buyKeywords = ['buy', 'purchase', 'order', 'cart', 'checkout', 'get it', 'want it', 'take it']
      const showCart = buyKeywords.some((keyword) => text.toLowerCase().includes(keyword))

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        showAddToCart: showCart,
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error('Chat error:', error)

      // Fallback to generated response if API fails
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(text, productContext),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (question: string) => {
    emitClick('ui:pay:chat-start')
    handleSend(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* Header - Removed since ChatSidebar has header */}
      <div className="sr-only">
        <h2>AI Shopping Assistant</h2>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] border-2 p-3 ${
                    message.role === 'user'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-black/20 dark:border-white/20 bg-white dark:bg-black'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2 tracking-wide">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* AddToCartCard dropped — outside port scope (see file header note) */}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="border-2 border-black/20 dark:border-white/20 p-3 flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-sm opacity-60">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="border-t border-black dark:border-white p-4 flex-shrink-0">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3 opacity-60">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(question)}
                className="text-xs border border-black dark:border-white px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t-2 border-black dark:border-white p-4 flex-shrink-0 bg-white dark:bg-black">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this product..."
            className="flex-1 border-2 border-black dark:border-white bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white"
            disabled={isLoading}
          />
          <button
            onClick={() => {
              emitClick('ui:pay:chat-start')
              handleSend()
            }}
            disabled={!input.trim() || isLoading}
            className="border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-4 py-3 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs opacity-60 mt-2 tracking-wide">Press Enter to send</p>
      </div>
    </div>
  )
}

// Helper function to generate contextual responses
function generateResponse(question: string, context: ProductContext | null): string {
  const lowerQuestion = question.toLowerCase()

  // Product-specific responses based on context
  if (!context) {
    return "I'm still loading the product details. Please try again in a moment."
  }

  if (lowerQuestion.includes('special') || lowerQuestion.includes('unique')) {
    return `${context.title} stands out for its exceptional quality and timeless design. At $${context.price.toFixed(2)}, it offers luxury craftsmanship with ${context.description}. The ${context.brand} brand is renowned for excellence, making this a worthy investment.`
  }

  if (lowerQuestion.includes('sensitive skin') || lowerQuestion.includes('skin')) {
    return "This is a premium Eau de Parfum formulated with high-quality ingredients. While it's designed for most skin types, I'd recommend testing on a small area first if you have very sensitive skin. The concentration is gentle yet long-lasting."
  }

  if (lowerQuestion.includes('last') || lowerQuestion.includes('longevity') || lowerQuestion.includes('duration')) {
    return 'As an Eau de Parfum, this fragrance typically lasts 8-10 hours on the skin. The rich base notes of sandalwood provide excellent staying power, while the top notes evolve beautifully throughout the day.'
  }

  if (lowerQuestion.includes('occasion') || lowerQuestion.includes('when') || lowerQuestion.includes('wear')) {
    return 'This sophisticated fragrance is perfect for evening events, special occasions, or whenever you want to make a memorable impression. Its mysterious and elegant character makes it ideal for formal settings, romantic dinners, or any time you want to feel confident and refined.'
  }

  if (lowerQuestion.includes('compare') || lowerQuestion.includes('similar') || lowerQuestion.includes('alternative')) {
    return `${context.title} is positioned in the luxury fragrance category. At $${context.price.toFixed(2)}, it offers exceptional value compared to other ${context.brand} fragrances. The unique combination of grapefruit, rose, and sandalwood sets it apart from competitors in the same price range.`
  }

  if (lowerQuestion.includes('stock') || lowerQuestion.includes('available')) {
    return `Great question! We currently have ${context.stock} units in stock. Given the popularity of this fragrance, I'd recommend ordering soon to avoid missing out. We offer free shipping and a 90-day return policy.`
  }

  if (lowerQuestion.includes('price') || lowerQuestion.includes('cost') || lowerQuestion.includes('discount')) {
    return `${context.title} is currently priced at $${context.price.toFixed(2)}, which includes a special discount. We also offer free worldwide shipping and a 3-year warranty. It's a premium product at a competitive price point.`
  }

  if (lowerQuestion.includes('ship') || lowerQuestion.includes('delivery')) {
    return "We offer free worldwide shipping on all orders! Your order will be carefully packaged and typically ships within 24 hours. You'll receive tracking information once it's dispatched."
  }

  if (lowerQuestion.includes('return') || lowerQuestion.includes('refund')) {
    return "We have a generous 90-day money-back guarantee. If you're not completely satisfied with your purchase, you can return it for a full refund within 90 days of delivery. No questions asked!"
  }

  // Default helpful response
  return `That's a great question about ${context.title}! This ${context.brand} ${context.category.toLowerCase()} is priced at $${context.price.toFixed(2)} and features ${context.description}. Is there a specific aspect you'd like to know more about? I can tell you about ingredients, longevity, occasions to wear it, or help you compare it to similar products.`
}

// Default export for Astro component usage
export default BuyInChat
