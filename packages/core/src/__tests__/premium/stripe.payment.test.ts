import { describe, it, expect, vi, beforeEach } from "vitest";
import { StripePaymentIntegration } from '../../premium/stripe.payment.ts';
import Stripe from 'stripe';

// Mock the Stripe module
const mockStripe = {
  customers: {
    create: vi.fn()
  },
  paymentIntents: {
    create: vi.fn()
  },
  subscriptions: {
    create: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn()
  },
  webhooks: {
    constructEvent: vi.fn()
  },
  products: {
    retrieve: vi.fn()
  },
  prices: {
    list: vi.fn()
  }
};

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => mockStripe)
  };
});

describe('StripePaymentIntegration', () => {
  let stripeIntegration: StripePaymentIntegration;
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock behaviors
    mockStripe.customers.create.mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
      name: 'Test User'
    });
    
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test123',
      amount: 1000,
      currency: 'usd',
      client_secret: 'test_secret'
    });
    
    mockStripe.subscriptions.create.mockResolvedValue({
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'active'
    });
    
    mockStripe.subscriptions.cancel.mockResolvedValue({
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'canceled'
    });
    
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [
        {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active'
        }
      ]
    });
    
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test123',
          amount: 1000
        }
      }
    });
    
    mockStripe.products.retrieve.mockResolvedValue({
      id: 'prod_test123',
      name: 'Test Product',
      active: true
    });
    
    mockStripe.prices.list.mockResolvedValue({
      data: [
        {
          id: 'price_test123',
          product: 'prod_test123',
          unit_amount: 1000,
          currency: 'usd',
          active: true
        }
      ]
    });
    
    // Mock process.env for testing
    (process as any).env = {
      STRIPE_SECRET_KEY: 'sk_test_1234567890',
      STRIPE_WEBHOOK_SECRET: 'whsec_test1234567890'
    };
    
    stripeIntegration = new StripePaymentIntegration();
  });

  describe('constructor', () => {
    it('should initialize with provided secret key', () => {
      const integration = new StripePaymentIntegration('sk_custom_key');
      expect(Stripe).toHaveBeenCalledWith('sk_custom_key', {
        apiVersion: '2025-10-29.clover'
      });
    });

    it('should initialize with secret key from environment', () => {
      const integration = new StripePaymentIntegration();
      expect(Stripe).toHaveBeenCalledWith('sk_test_1234567890', {
        apiVersion: '2025-10-29.clover'
      });
    });

    it('should throw error when no secret key is provided', () => {
      // Remove the environment variable
      (process as any).env = {};
      
      expect(() => new StripePaymentIntegration()).toThrow('Stripe secret key is required');
    });
  });

  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      const customer = await stripeIntegration.createCustomer('test@example.com', 'Test User', {
        accountId: 'account123'
      });
      
      expect(customer).toEqual({
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          accountId: 'account123'
        }
      });
    });

    it('should create customer without optional parameters', async () => {
      const customer = await stripeIntegration.createCustomer('test@example.com');
      
      expect(customer).toEqual({
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: undefined,
        metadata: undefined
      });
    });

    it('should handle customer creation failure', async () => {
      const errorMessage = 'Customer creation failed';
      mockStripe.customers.create.mockRejectedValue(new Error(errorMessage));
      
      await expect(stripeIntegration.createCustomer('test@example.com'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const paymentIntent = await stripeIntegration.createPaymentIntent(1000, 'usd', 'cus_test123', {
        orderId: 'order123'
      });
      
      expect(paymentIntent).toEqual({
        id: 'pi_test123',
        amount: 1000,
        currency: 'usd',
        client_secret: 'test_secret'
      });
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        customer: 'cus_test123',
        metadata: {
          orderId: 'order123'
        },
        automatic_payment_methods: {
          enabled: true
        }
      });
    });

    it('should create payment intent with default currency', async () => {
      const paymentIntent = await stripeIntegration.createPaymentIntent(1000);
      
      expect(paymentIntent).toEqual({
        id: 'pi_test123',
        amount: 1000,
        currency: 'usd',
        client_secret: 'test_secret'
      });
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        customer: undefined,
        metadata: undefined,
        automatic_payment_methods: {
          enabled: true
        }
      });
    });

    it('should handle payment intent creation failure', async () => {
      const errorMessage = 'Payment intent creation failed';
      mockStripe.paymentIntents.create.mockRejectedValue(new Error(errorMessage));
      
      await expect(stripeIntegration.createPaymentIntent(1000))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const subscription = await stripeIntegration.createSubscription('cus_test123', 'price_test123', {
        plan: 'premium'
      });
      
      expect(subscription).toEqual({
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active'
      });
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        items: [{ price: 'price_test123' }],
        metadata: {
          plan: 'premium'
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });
    });

    it('should create subscription without metadata', async () => {
      const subscription = await stripeIntegration.createSubscription('cus_test123', 'price_test123');
      
      expect(subscription).toEqual({
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active'
      });
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        items: [{ price: 'price_test123' }],
        metadata: undefined,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });
    });

    it('should handle subscription creation failure', async () => {
      const errorMessage = 'Subscription creation failed';
      mockStripe.subscriptions.create.mockRejectedValue(new Error(errorMessage));
      
      await expect(stripeIntegration.createSubscription('cus_test123', 'price_test123'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const subscription = await stripeIntegration.cancelSubscription('sub_test123');
      
      expect(subscription).toEqual({
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'canceled'
      });
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
    });

    it('should handle subscription cancellation failure', async () => {
      const errorMessage = 'Subscription cancellation failed';
      mockStripe.subscriptions.cancel.mockRejectedValue(new Error(errorMessage));
      
      await expect(stripeIntegration.cancelSubscription('sub_test123'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getCustomerSubscriptions', () => {
    it('should retrieve customer subscriptions successfully', async () => {
      const subscriptions = await stripeIntegration.getCustomerSubscriptions('cus_test123');
      
      expect(subscriptions).toEqual({
        data: [
          {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active'
          }
        ]
      });
      expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_test123'
      });
    });

    it('should handle subscription retrieval failure', async () => {
      const errorMessage = 'Subscription retrieval failed';
      mockStripe.subscriptions.list.mockRejectedValue(new Error(errorMessage));
      
      await expect(stripeIntegration.getCustomerSubscriptions('cus_test123'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment intent succeeded event', async () => {
      const payload = Buffer.from('test payload');
      const signature = 'test_signature';
      
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 1000
          } as Stripe.PaymentIntent
        }
      });
      
      const event = await stripeIntegration.handleWebhook(payload, signature);
      
      expect(event.type).toBe('payment_intent.succeeded');
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test1234567890'
      );
    });

    it('should handle customer subscription created event', async () => {
      const payload = Buffer.from('test payload');
      const signature = 'test_signature';
      
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123'
          } as Stripe.Subscription
        }
      });
      
      const event = await stripeIntegration.handleWebhook(payload, signature);
      
      expect(event.type).toBe('customer.subscription.created');
    });

    it('should handle customer subscription deleted event', async () => {
      const payload = Buffer.from('test payload');
      const signature = 'test_signature';
      
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123'
          } as Stripe.Subscription
        }
      });
      
      const event = await stripeIntegration.handleWebhook(payload, signature);
      
      expect(event.type).toBe('customer.subscription.deleted');
    });

    it('should handle unhandled event types', async () => {
      const payload = Buffer.from('test payload');
      const signature = 'test_signature';
      
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'unknown.event',
        data: {
          object: {}
        }
      });
      
      const event = await stripeIntegration.handleWebhook(payload, signature);
      
      expect(event.type).toBe('unknown.event');
    });

    it('should handle webhook construction failure', async () => {
      const errorMessage = 'Webhook construction failed';
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      const payload = Buffer.from('test payload');
      const signature = 'test_signature';
      
      await expect(stripeIntegration.handleWebhook(payload, signature))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getProduct', () => {
    it('should retrieve product successfully', async () => {
      const product = await stripeIntegration.getProduct('prod_test123');
      
      expect(product).toEqual({
        id: 'prod_test123',
        name: 'Test Product',
        active: true
      });
      expect(mockStripe.products.retrieve).toHaveBeenCalledWith('prod_test123');
    });

    it('should handle product retrieval failure', async () => {
      const errorMessage = 'Product retrieval failed';
      mockStripe.products.retrieve.mockRejectedValue(new Error(errorMessage));
      
      await expect(stripeIntegration.getProduct('prod_test123'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getProductPrices', () => {
    it('should retrieve product prices successfully', async () => {
      const prices = await stripeIntegration.getProductPrices('prod_test123');
      
      expect(prices).toEqual({
        data: [
          {
            id: 'price_test123',
            product: 'prod_test123',
            unit_amount: 1000,
            currency: 'usd',
            active: true
          }
        ]
      });
      expect(mockStripe.prices.list).toHaveBeenCalledWith({
        product: 'prod_test123',
        active: true
      });
    });

    it('should handle price retrieval failure', async () => {
      const errorMessage = 'Price retrieval failed';
      mockStripe.prices.list.mockRejectedValue(new Error(errorMessage));
      
      await expect(stripeIntegration.getProductPrices('prod_test123'))
        .rejects.toThrow(errorMessage);
    });
  });
});