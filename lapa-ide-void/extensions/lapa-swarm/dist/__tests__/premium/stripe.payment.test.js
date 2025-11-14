"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const stripe_payment_ts_1 = require("../../premium/stripe.payment.ts");
const stripe_1 = __importDefault(require("stripe"));
// Mock the Stripe module
const mockStripe = {
    customers: {
        create: vitest_1.vi.fn()
    },
    paymentIntents: {
        create: vitest_1.vi.fn()
    },
    subscriptions: {
        create: vitest_1.vi.fn(),
        cancel: vitest_1.vi.fn(),
        list: vitest_1.vi.fn()
    },
    webhooks: {
        constructEvent: vitest_1.vi.fn()
    },
    products: {
        retrieve: vitest_1.vi.fn()
    },
    prices: {
        list: vitest_1.vi.fn()
    }
};
vitest_1.vi.mock('stripe', () => {
    return {
        default: vitest_1.vi.fn().mockImplementation(() => mockStripe)
    };
});
(0, vitest_1.describe)('StripePaymentIntegration', () => {
    let stripeIntegration;
    (0, vitest_1.beforeEach)(() => {
        // Clear all mocks before each test
        vitest_1.vi.clearAllMocks();
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
        process.env = {
            STRIPE_SECRET_KEY: 'sk_test_1234567890',
            STRIPE_WEBHOOK_SECRET: 'whsec_test1234567890'
        };
        stripeIntegration = new stripe_payment_ts_1.StripePaymentIntegration();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with provided secret key', () => {
            const integration = new stripe_payment_ts_1.StripePaymentIntegration('sk_custom_key');
            (0, vitest_1.expect)(stripe_1.default).toHaveBeenCalledWith('sk_custom_key', {
                apiVersion: '2025-10-29.clover'
            });
        });
        (0, vitest_1.it)('should initialize with secret key from environment', () => {
            const integration = new stripe_payment_ts_1.StripePaymentIntegration();
            (0, vitest_1.expect)(stripe_1.default).toHaveBeenCalledWith('sk_test_1234567890', {
                apiVersion: '2025-10-29.clover'
            });
        });
        (0, vitest_1.it)('should throw error when no secret key is provided', () => {
            // Remove the environment variable
            process.env = {};
            (0, vitest_1.expect)(() => new stripe_payment_ts_1.StripePaymentIntegration()).toThrow('Stripe secret key is required');
        });
    });
    (0, vitest_1.describe)('createCustomer', () => {
        (0, vitest_1.it)('should create customer successfully', async () => {
            const customer = await stripeIntegration.createCustomer('test@example.com', 'Test User', {
                accountId: 'account123'
            });
            (0, vitest_1.expect)(customer).toEqual({
                id: 'cus_test123',
                email: 'test@example.com',
                name: 'Test User'
            });
            (0, vitest_1.expect)(mockStripe.customers.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                name: 'Test User',
                metadata: {
                    accountId: 'account123'
                }
            });
        });
        (0, vitest_1.it)('should create customer without optional parameters', async () => {
            const customer = await stripeIntegration.createCustomer('test@example.com');
            (0, vitest_1.expect)(customer).toEqual({
                id: 'cus_test123',
                email: 'test@example.com',
                name: 'Test User'
            });
            (0, vitest_1.expect)(mockStripe.customers.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                name: undefined,
                metadata: undefined
            });
        });
        (0, vitest_1.it)('should handle customer creation failure', async () => {
            const errorMessage = 'Customer creation failed';
            mockStripe.customers.create.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(stripeIntegration.createCustomer('test@example.com'))
                .rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('createPaymentIntent', () => {
        (0, vitest_1.it)('should create payment intent successfully', async () => {
            const paymentIntent = await stripeIntegration.createPaymentIntent(1000, 'usd', 'cus_test123', {
                orderId: 'order123'
            });
            (0, vitest_1.expect)(paymentIntent).toEqual({
                id: 'pi_test123',
                amount: 1000,
                currency: 'usd',
                client_secret: 'test_secret'
            });
            (0, vitest_1.expect)(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
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
        (0, vitest_1.it)('should create payment intent with default currency', async () => {
            const paymentIntent = await stripeIntegration.createPaymentIntent(1000);
            (0, vitest_1.expect)(paymentIntent).toEqual({
                id: 'pi_test123',
                amount: 1000,
                currency: 'usd',
                client_secret: 'test_secret'
            });
            (0, vitest_1.expect)(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
                amount: 1000,
                currency: 'usd',
                customer: undefined,
                metadata: undefined,
                automatic_payment_methods: {
                    enabled: true
                }
            });
        });
        (0, vitest_1.it)('should handle payment intent creation failure', async () => {
            const errorMessage = 'Payment intent creation failed';
            mockStripe.paymentIntents.create.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(stripeIntegration.createPaymentIntent(1000))
                .rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('createSubscription', () => {
        (0, vitest_1.it)('should create subscription successfully', async () => {
            const subscription = await stripeIntegration.createSubscription('cus_test123', 'price_test123', {
                plan: 'premium'
            });
            (0, vitest_1.expect)(subscription).toEqual({
                id: 'sub_test123',
                customer: 'cus_test123',
                status: 'active'
            });
            (0, vitest_1.expect)(mockStripe.subscriptions.create).toHaveBeenCalledWith({
                customer: 'cus_test123',
                items: [{ price: 'price_test123' }],
                metadata: {
                    plan: 'premium'
                },
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent']
            });
        });
        (0, vitest_1.it)('should create subscription without metadata', async () => {
            const subscription = await stripeIntegration.createSubscription('cus_test123', 'price_test123');
            (0, vitest_1.expect)(subscription).toEqual({
                id: 'sub_test123',
                customer: 'cus_test123',
                status: 'active'
            });
            (0, vitest_1.expect)(mockStripe.subscriptions.create).toHaveBeenCalledWith({
                customer: 'cus_test123',
                items: [{ price: 'price_test123' }],
                metadata: undefined,
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent']
            });
        });
        (0, vitest_1.it)('should handle subscription creation failure', async () => {
            const errorMessage = 'Subscription creation failed';
            mockStripe.subscriptions.create.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(stripeIntegration.createSubscription('cus_test123', 'price_test123'))
                .rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('cancelSubscription', () => {
        (0, vitest_1.it)('should cancel subscription successfully', async () => {
            const subscription = await stripeIntegration.cancelSubscription('sub_test123');
            (0, vitest_1.expect)(subscription).toEqual({
                id: 'sub_test123',
                customer: 'cus_test123',
                status: 'canceled'
            });
            (0, vitest_1.expect)(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
        });
        (0, vitest_1.it)('should handle subscription cancellation failure', async () => {
            const errorMessage = 'Subscription cancellation failed';
            mockStripe.subscriptions.cancel.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(stripeIntegration.cancelSubscription('sub_test123'))
                .rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('getCustomerSubscriptions', () => {
        (0, vitest_1.it)('should retrieve customer subscriptions successfully', async () => {
            const subscriptions = await stripeIntegration.getCustomerSubscriptions('cus_test123');
            (0, vitest_1.expect)(subscriptions).toEqual({
                data: [
                    {
                        id: 'sub_test123',
                        customer: 'cus_test123',
                        status: 'active'
                    }
                ]
            });
            (0, vitest_1.expect)(mockStripe.subscriptions.list).toHaveBeenCalledWith({
                customer: 'cus_test123'
            });
        });
        (0, vitest_1.it)('should handle subscription retrieval failure', async () => {
            const errorMessage = 'Subscription retrieval failed';
            mockStripe.subscriptions.list.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(stripeIntegration.getCustomerSubscriptions('cus_test123'))
                .rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('handleWebhook', () => {
        (0, vitest_1.it)('should handle payment intent succeeded event', async () => {
            const payload = Buffer.from('test payload');
            const signature = 'test_signature';
            mockStripe.webhooks.constructEvent.mockReturnValue({
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test123',
                        amount: 1000
                    }
                }
            });
            const event = await stripeIntegration.handleWebhook(payload, signature);
            (0, vitest_1.expect)(event.type).toBe('payment_intent.succeeded');
            (0, vitest_1.expect)(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(payload, signature, 'whsec_test1234567890');
        });
        (0, vitest_1.it)('should handle customer subscription created event', async () => {
            const payload = Buffer.from('test payload');
            const signature = 'test_signature';
            mockStripe.webhooks.constructEvent.mockReturnValue({
                type: 'customer.subscription.created',
                data: {
                    object: {
                        id: 'sub_test123',
                        customer: 'cus_test123'
                    }
                }
            });
            const event = await stripeIntegration.handleWebhook(payload, signature);
            (0, vitest_1.expect)(event.type).toBe('customer.subscription.created');
        });
        (0, vitest_1.it)('should handle customer subscription deleted event', async () => {
            const payload = Buffer.from('test payload');
            const signature = 'test_signature';
            mockStripe.webhooks.constructEvent.mockReturnValue({
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: 'sub_test123',
                        customer: 'cus_test123'
                    }
                }
            });
            const event = await stripeIntegration.handleWebhook(payload, signature);
            (0, vitest_1.expect)(event.type).toBe('customer.subscription.deleted');
        });
        (0, vitest_1.it)('should handle unhandled event types', async () => {
            const payload = Buffer.from('test payload');
            const signature = 'test_signature';
            mockStripe.webhooks.constructEvent.mockReturnValue({
                type: 'unknown.event',
                data: {
                    object: {}
                }
            });
            const event = await stripeIntegration.handleWebhook(payload, signature);
            (0, vitest_1.expect)(event.type).toBe('unknown.event');
        });
        (0, vitest_1.it)('should handle webhook construction failure', async () => {
            const errorMessage = 'Webhook construction failed';
            mockStripe.webhooks.constructEvent.mockImplementation(() => {
                throw new Error(errorMessage);
            });
            const payload = Buffer.from('test payload');
            const signature = 'test_signature';
            await (0, vitest_1.expect)(stripeIntegration.handleWebhook(payload, signature))
                .rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('getProduct', () => {
        (0, vitest_1.it)('should retrieve product successfully', async () => {
            const product = await stripeIntegration.getProduct('prod_test123');
            (0, vitest_1.expect)(product).toEqual({
                id: 'prod_test123',
                name: 'Test Product',
                active: true
            });
            (0, vitest_1.expect)(mockStripe.products.retrieve).toHaveBeenCalledWith('prod_test123');
        });
        (0, vitest_1.it)('should handle product retrieval failure', async () => {
            const errorMessage = 'Product retrieval failed';
            mockStripe.products.retrieve.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(stripeIntegration.getProduct('prod_test123'))
                .rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('getProductPrices', () => {
        (0, vitest_1.it)('should retrieve product prices successfully', async () => {
            const prices = await stripeIntegration.getProductPrices('prod_test123');
            (0, vitest_1.expect)(prices).toEqual({
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
            (0, vitest_1.expect)(mockStripe.prices.list).toHaveBeenCalledWith({
                product: 'prod_test123',
                active: true
            });
        });
        (0, vitest_1.it)('should handle price retrieval failure', async () => {
            const errorMessage = 'Price retrieval failed';
            mockStripe.prices.list.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(stripeIntegration.getProductPrices('prod_test123'))
                .rejects.toThrow(errorMessage);
        });
    });
});
//# sourceMappingURL=stripe.payment.test.js.map