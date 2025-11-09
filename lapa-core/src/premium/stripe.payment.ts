/**
 * Stripe Payment Integration for LAPA Premium
 * 
 * This module provides integration with Stripe for processing payments,
 * managing subscriptions, and handling billing for premium features.
 */

// Import necessary modules
import Stripe from 'stripe';

/**
 * Stripe Payment Integration class
 */
export class StripePaymentIntegration {
    private stripe: Stripe;
    private webhookSecret: string;
    
    constructor(secretKey?: string, webhookSecret?: string) {
        const key = secretKey || process.env.STRIPE_SECRET_KEY || '';
        this.webhookSecret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
        
        if (!key) {
            throw new Error('Stripe secret key is required');
        }
        
        this.stripe = new Stripe(key, {
            apiVersion: '2024-06-20',
        });
    }
    
    /**
     * Creates a new customer in Stripe
     * @param email Customer email
     * @param name Customer name
     * @param metadata Additional metadata
     * @returns Created customer
     */
    async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
                metadata,
            });
            
            return customer;
        } catch (error) {
            console.error('Failed to create Stripe customer:', error);
            throw error;
        }
    }
    
    /**
     * Creates a payment intent
     * @param amount Amount in cents
     * @param currency Currency code (e.g., 'usd')
     * @param customerId Customer ID (optional)
     * @param metadata Additional metadata
     * @returns Created payment intent
     */
    async createPaymentIntent(
        amount: number,
        currency: string = 'usd',
        customerId?: string,
        metadata?: Record<string, string>
    ): Promise<Stripe.PaymentIntent> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount,
                currency,
                customer: customerId,
                metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            
            return paymentIntent;
        } catch (error) {
            console.error('Failed to create Stripe payment intent:', error);
            throw error;
        }
    }
    
    /**
     * Creates a subscription for a customer
     * @param customerId Customer ID
     * @param priceId Price ID for the subscription
     * @param metadata Additional metadata
     * @returns Created subscription
     */
    async createSubscription(
        customerId: string,
        priceId: string,
        metadata?: Record<string, string>
    ): Promise<Stripe.Subscription> {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                metadata,
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
            });
            
            return subscription;
        } catch (error) {
            console.error('Failed to create Stripe subscription:', error);
            throw error;
        }
    }
    
    /**
     * Cancels a subscription
     * @param subscriptionId Subscription ID
     * @returns Cancelled subscription
     */
    async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
        try {
            const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
            return subscription;
        } catch (error) {
            console.error('Failed to cancel Stripe subscription:', error);
            throw error;
        }
    }
    
    /**
     * Gets a customer's subscriptions
     * @param customerId Customer ID
     * @returns List of subscriptions
     */
    async getCustomerSubscriptions(customerId: string): Promise<Stripe.ApiList<Stripe.Subscription>> {
        try {
            const subscriptions = await this.stripe.subscriptions.list({
                customer: customerId,
            });
            
            return subscriptions;
        } catch (error) {
            console.error('Failed to get customer subscriptions:', error);
            throw error;
        }
    }
    
    /**
     * Handles a Stripe webhook event
     * @param payload Webhook payload
     * @param signature Webhook signature
     * @returns Event object
     */
    async handleWebhook(payload: Buffer, signature: string): Promise<Stripe.Event> {
        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                this.webhookSecret
            );
            
            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    console.log(`Payment succeeded for ${paymentIntent.amount}`);
                    break;
                case 'customer.subscription.created':
                    const subscription = event.data.object as Stripe.Subscription;
                    console.log(`Subscription created for customer ${subscription.customer}`);
                    break;
                case 'customer.subscription.deleted':
                    const deletedSubscription = event.data.object as Stripe.Subscription;
                    console.log(`Subscription deleted for customer ${deletedSubscription.customer}`);
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            
            return event;
        } catch (error) {
            console.error('Failed to handle Stripe webhook:', error);
            throw error;
        }
    }
    
    /**
     * Gets product information
     * @param productId Product ID
     * @returns Product information
     */
    async getProduct(productId: string): Promise<Stripe.Product> {
        try {
            const product = await this.stripe.products.retrieve(productId);
            return product;
        } catch (error) {
            console.error('Failed to get Stripe product:', error);
            throw error;
        }
    }
    
    /**
     * Lists available prices for a product
     * @param productId Product ID
     * @returns List of prices
     */
    async getProductPrices(productId: string): Promise<Stripe.ApiList<Stripe.Price>> {
        try {
            const prices = await this.stripe.prices.list({
                product: productId,
                active: true,
            });
            
            return prices;
        } catch (error) {
            console.error('Failed to get product prices:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const stripePaymentIntegration = new StripePaymentIntegration();