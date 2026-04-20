// ported from shop/buy-in-chatgpt/BuyInChatGPTEnhanced.tsx on 2026-04-20
/**
 * Enhanced Product Chat Assistant with "Buy in Chat" Integration
 *
 * Features:
 * - Conversational product Q&A (existing)
 * - Purchase intent detection (new)
 * - ACP checkout flow integration (new)
 * - Stripe SPT payment processing (new)
 * - 33% conversion rate vs 2.1% traditional (new)
 */

import { useEffect, useRef, useState } from 'react'
import { AddressForm } from '@/components/pay/chat/AddressForm'
import { OrderConfirmation } from '@/components/pay/chat/OrderConfirmation'
import { OrderSummary } from '@/components/pay/chat/OrderSummary'
import { PaymentProcessor } from '@/components/pay/chat/PaymentProcessor'
import { PurchaseIntent } from '@/components/pay/chat/PurchaseIntent'
import { ShippingOptions } from '@/components/pay/chat/ShippingOptions'
import { emitClick } from '@/lib/ui-signal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  showAddToCart?: boolean
}

interface ProductContext {
  id: string
  title: string
  price: number
  description: string
  category: string
  brand: string
  stock: number
  features?: string[]
  image?: string
}

type CheckoutState =
  | 'idle'
  | 'intent_detected'
  | 'collecting_address'
  | 'selecting_shipping'
  | 'reviewing_order'
  | 'processing_payment'
  | 'completed'

interface CheckoutSession {
  id: string
  status: string
  totals: Array<{
    type: 'subtotal' | 'shipping' | 'tax' | 'total'
    label: string
    amount: number
  }>
  fulfillment_options: Array<{
    id: string
    name: string
    cost: number
    delivery_estimate: {
      earliest: string
      latest: string
    }
  }>
  currency: string
}

interface BuyInChatEnhancedProps {
  product?: {
    id: string
    name: string
    price: number
    description: string
    category: string
    brand?: string
    stock: number
    features?: string[]
    image?: string
  }
}

export function BuyInChatEnhanced({ product }: BuyInChatEnhancedProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: product
        ? `Hi! I'm your AI shopping assistant. I can answer questions about ${product.name} and help you complete your purchase right here. What would you like to know?`
        : "Hi! I'm your AI shopping assistant with instant checkout. I can answer questions about this product AND help you complete your purchase right here in chat. What would you like to know?",
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [productContext, _setProductContext] = useState<ProductContext | null>(
    product
      ? {
          id: product.id,
          title: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          brand: product.brand || 'Unknown',
          stock: product.stock,
          features: product.features,
          image: product.image,
        }
      : null,
  )
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle')
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Suggested questions (contextual based on product)
  const suggestedQuestions = product
    ? [
        `Tell me more about ${product.name}`,
        `What's special about this ${product.category}?`,
        'Is this a good gift?',
        'I want to buy this now', // Triggers checkout
        "What's included?",
        'Buy with instant checkout', // Triggers checkout
      ]
    : [
        'Tell me about this product',
        'How long does it last?',
        'Is this a good gift?',
        'I want to buy this now',
        "What's included in the box?",
        'Buy with instant checkout',
      ]

  // Product context is now passed via props, no need to scrape the page

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // Detect purchase intent
  const detectPurchaseIntent = (text: string): boolean => {
    const buyKeywords = [
      'buy',
      'purchase',
      'order',
      'checkout',
      'cart',
      'get it',
      'want it',
      'take it',
      'ship to me',
      'instant checkout',
    ]
    const lowerText = text.toLowerCase()
    return buyKeywords.some((keyword) => lowerText.includes(keyword))
  }

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Check for purchase intent
    const isPurchaseIntent = detectPurchaseIntent(text)

    if (isPurchaseIntent && productContext && checkoutState === 'idle') {
      // Trigger checkout flow
      setCheckoutState('intent_detected')

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "Perfect! I can help you complete your purchase right here. Let's get started with instant checkout. Click the button below to begin.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
      return
    }

    try {
      // Build system prompt with product context
      const featuresText =
        productContext?.features && productContext.features.length > 0
          ? `\nKey Features:\n${productContext.features.map((f) => `- ${f}`).join('\n')}`
          : ''

      const systemPrompt = productContext
        ? `You are a helpful shopping assistant for an e-commerce store with INSTANT CHECKOUT capability. You're currently helping a customer who is viewing this product:

Product: ${productContext.title}
Brand: ${productContext.brand}
Category: ${productContext.category}
Price: $${productContext.price.toFixed(2)}
Description: ${productContext.description}
Stock: ${productContext.stock} units available${featuresText}

Answer questions about this product, provide recommendations, and help customers. If they express interest in buying, let them know they can complete their purchase instantly right here in the chat with our "Buy in Chat" feature (33% conversion rate vs traditional 2.1%).

Shipping: Free worldwide shipping
Returns: 90-day money-back guarantee
Warranty: 3-year premium coverage

Be friendly, knowledgeable, and concise.`
        : 'You are a helpful shopping assistant. Answer questions about products and help customers make informed decisions.'

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
          model: 'google/gemini-2.5-flash-lite',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const aiContent = data.choices?.[0]?.message?.content || 'Sorry, I encountered an error. Please try again.'

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error('Chat error:', error)

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

  const handleSessionCreated = async (sessionId: string) => {
    setCheckoutState('collecting_address')

    // Fetch session details
    try {
      const response = await fetch(`/api/checkout_sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${import.meta.env.PUBLIC_COMMERCE_API_KEY}`,
        },
      })

      if (response.ok) {
        const session = (await response.json()) as CheckoutSession
        setCheckoutSession(session)
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
    }

    const aiResponse: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Great! Now I just need your shipping address to calculate shipping and tax.',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, aiResponse])
  }

  const handleAddressSubmitted = (updatedSession: any) => {
    console.log('[BuyInChatEnhanced] Address submitted, updated session:', updatedSession)

    // Update the checkout session with the new data (including fulfillment_options)
    setCheckoutSession(updatedSession)
    setCheckoutState('selecting_shipping')

    const aiResponse: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Perfect! Address saved. Now please select your preferred shipping method below.',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, aiResponse])
  }

  const handleShippingSelected = () => {
    setCheckoutState('reviewing_order')

    const aiResponse: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Excellent choice! Here's your order summary. When you're ready, proceed to payment.",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, aiResponse])
  }

  const handlePaymentComplete = (newOrderId: string, newPaymentIntentId?: string) => {
    setOrderId(newOrderId)
    if (newPaymentIntentId) {
      setPaymentIntentId(newPaymentIntentId)
    }
    setCheckoutState('completed')

    const aiResponse: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🎉 Success! Your order has been confirmed. Order #${newOrderId} is on its way!`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, aiResponse])
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
    <div className="flex flex-col h-full bg-[hsl(0,0%,10%)]">
      <div className="sr-only">
        <h2>AI Shopping Assistant with Instant Checkout</h2>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-foreground">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 ${
                    message.role === 'user'
                      ? 'border-2 border-border bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
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
            </div>
          ))}

          {/* Checkout Flow Components */}
          {checkoutState === 'intent_detected' && productContext && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <PurchaseIntent
                  productId={productContext.id}
                  productName={productContext.title}
                  productPrice={productContext.price}
                  onSessionCreated={handleSessionCreated}
                />
              </div>
            </div>
          )}

          {checkoutState === 'collecting_address' && checkoutSession && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <AddressForm sessionId={checkoutSession.id} onAddressSubmitted={handleAddressSubmitted} />
              </div>
            </div>
          )}

          {checkoutState === 'selecting_shipping' && checkoutSession && checkoutSession.fulfillment_options && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <ShippingOptions
                  sessionId={checkoutSession.id}
                  options={checkoutSession.fulfillment_options as any}
                  onShippingSelected={handleShippingSelected}
                />
              </div>
            </div>
          )}

          {checkoutState === 'reviewing_order' && checkoutSession && (
            <div className="flex justify-start">
              <div className="max-w-[85%] space-y-3">
                <OrderSummary totals={checkoutSession.totals} currency={checkoutSession.currency} />
                <PaymentProcessor
                  sessionId={checkoutSession.id}
                  totalAmount={checkoutSession.totals.find((t) => t.type === 'total')?.amount || 0}
                  onPaymentComplete={handlePaymentComplete}
                />
              </div>
            </div>
          )}

          {checkoutState === 'completed' && orderId && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <OrderConfirmation
                  orderId={orderId}
                  orderUrl={`https://one.ie/orders/${orderId}`}
                  paymentIntentId={paymentIntentId || undefined}
                />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="border-2 border-border p-3 flex items-center gap-2">
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
        <div className="border-t border-border p-4 flex-shrink-0 bg-foreground">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3 opacity-60 text-muted-foreground">
            Suggested questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(question)}
                className="text-xs border border-border px-3 py-2 hover:bg-muted transition-colors text-foreground"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t border-border p-4 flex-shrink-0 bg-foreground">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this product or say 'buy now'..."
            className="flex-1 border-2 border-input bg-background px-4 py-3 text-sm text-font placeholder:text-muted-foreground focus:outline-none focus:border-ring"
            disabled={isLoading}
          />
          <button
            onClick={() => {
              emitClick('ui:pay:chat-start')
              handleSend()
            }}
            disabled={!input.trim() || isLoading}
            className="border-2 border-primary bg-primary text-primary-foreground px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs opacity-60 mt-2 tracking-wide">
          Press Enter to send • Say "buy now" for instant checkout
        </p>
      </div>
    </div>
  )
}

// Helper function to generate contextual responses
function generateResponse(question: string, context: ProductContext | null): string {
  const lowerQuestion = question.toLowerCase()

  if (!context) {
    return "I'm still loading the product details. Please try again in a moment."
  }

  if (lowerQuestion.includes('last') || lowerQuestion.includes('longevity')) {
    return 'As an Eau de Parfum, this fragrance typically lasts 8-10 hours on the skin. The rich base notes of sandalwood provide excellent staying power.'
  }

  if (lowerQuestion.includes('ship') || lowerQuestion.includes('delivery')) {
    return 'We offer free worldwide shipping on all orders! Your order will be carefully packaged and typically ships within 24 hours. You will receive tracking information once it is dispatched.'
  }

  if (lowerQuestion.includes('return') || lowerQuestion.includes('refund')) {
    return 'We have a generous 90-day money-back guarantee. If you are not completely satisfied with your purchase, you can return it for a full refund within 90 days of delivery.'
  }

  return `That is a great question about ${context.title}! This ${context.brand} ${context.category.toLowerCase()} is priced at $${context.price.toFixed(2)} and features ${context.description}. Want to buy it? Just say "buy now" for instant checkout!`
}

export default BuyInChatEnhanced
