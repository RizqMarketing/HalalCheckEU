/**
 * Event Bus System
 *
 * Provides event-driven communication between agents
 */
export interface EventData {
    [key: string]: any;
}
export interface Event {
    id: string;
    type: string;
    data: EventData;
    timestamp: Date;
    source?: string;
    target?: string;
}
export type EventHandler = (event: Event) => void | Promise<void>;
export interface EventSubscription {
    id: string;
    eventType: string;
    handler: EventHandler;
    source?: string;
}
export declare class EventBus {
    private subscribers;
    private eventHistory;
    private maxHistorySize;
    private nextSubscriptionId;
    constructor(maxHistorySize?: number);
    /**
     * Subscribe to events of a specific type
     */
    subscribe(eventType: string, handler: EventHandler, source?: string): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Emit an event to all subscribers
     */
    emit(eventType: string, data: EventData, source?: string, target?: string): Promise<void>;
    /**
     * Get event history
     */
    getEventHistory(eventType?: string, limit?: number): Event[];
    /**
     * Clear event history
     */
    clearHistory(): void;
    /**
     * Get all active subscriptions
     */
    getSubscriptions(): EventSubscription[];
    /**
     * Get subscription count for an event type
     */
    getSubscriptionCount(eventType: string): number;
    /**
     * Wait for a specific event to occur
     */
    waitForEvent(eventType: string, timeout?: number, filter?: (event: Event) => boolean): Promise<Event>;
    /**
     * Create a request-response pattern using events
     */
    request(requestType: string, responseType: string, data: EventData, timeout?: number): Promise<Event>;
    private addToHistory;
    /**
     * Get statistics about the event bus
     */
    getStats(): {
        totalSubscriptions: number;
        eventTypes: string[];
        historySize: number;
        recentEventTypes: string[];
    };
}
//# sourceMappingURL=EventBus.d.ts.map