/**
 * Stripe Payment Integration for LAPA Premium
 *
 * This module provides integration with Stripe for processing payments,
 * managing subscriptions, and handling billing for premium features.
 */
import Stripe from 'stripe';
/**
 * Stripe Payment Integration class
 */
export declare class StripePaymentIntegration {
    private stripe;
    private webhookSecret;
    constructor(secretKey?: string, webhookSecret?: string);
    /**
     * Creates a new customer in Stripe
     * @param email Customer email
     * @param name Customer name
     * @param metadata Additional metadata
     * @returns Created customer
     */
    createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Stripe.Customer>;
    /**
     * Creates a payment intent
     * @param amount Amount in cents
     * @param currency Currency code (e.g., 'usd')
     * @param customerId Customer ID (optional)
     * @param metadata Additional metadata
     * @returns Created payment intent
     */
    createPaymentIntent(amount: number, currency?: string, customerId?: string, metadata?: Record<string, string>): Promise<Stripe.PaymentIntent>;
    /**
     * Creates a subscription for a customer
     * @param customerId Customer ID
     * @param priceId Price ID for the subscription
     * @param metadata Additional metadata
     * @returns Created subscription
     */
    createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<Stripe.Subscription>;
    /**
     * Cancels a subscription
     * @param subscriptionId Subscription ID
     * @returns Cancelled subscription
     */
    cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    /**
     * Gets a customer's subscriptions
     * @param customerId Customer ID
     * @returns List of subscriptions
     */
    getCustomerSubscriptions(customerId: string): Promise<Stripe.ApiList<Stripe.Subscription>>;
    /**
     * Handles a Stripe webhook event
     * @param payload Webhook payload
     * @param signature Webhook signature
     * @returns Event object
     */
    handleWebhook(payload: Buffer, signature: string): Promise<Stripe.Event>;
    /**
     * Gets product information
     * @param productId Product ID
     * @returns Product information
     */
    getProduct(productId: string): Promise<Stripe.Product>;
    /**
     * Lists available prices for a product
     * @param productId Product ID
     * @returns List of prices
     */
    getProductPrices(productId: string): Promise<Stripe.ApiList<Stripe.Price>>;
}
export declare const stripePaymentIntegration: StripePaymentIntegration;
