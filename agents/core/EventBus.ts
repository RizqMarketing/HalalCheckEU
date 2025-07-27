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

export class EventBus {
  private subscribers: Map<string, EventSubscription[]>;
  private eventHistory: Event[];
  private maxHistorySize: number;
  private nextSubscriptionId: number;

  constructor(maxHistorySize: number = 1000) {
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = maxHistorySize;
    this.nextSubscriptionId = 1;
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe(
    eventType: string, 
    handler: EventHandler, 
    source?: string
  ): string {
    const subscription: EventSubscription = {
      id: `sub_${this.nextSubscriptionId++}`,
      eventType,
      handler,
      source
    };

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    this.subscribers.get(eventType)!.push(subscription);
    
    return subscription.id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscribers.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.subscribers.delete(eventType);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Emit an event to all subscribers
   */
  async emit(eventType: string, data: EventData, source?: string, target?: string): Promise<void> {
    const event: Event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      data,
      timestamp: new Date(),
      source,
      target
    };

    // Add to history
    this.addToHistory(event);

    // Get subscribers for this event type
    const subscriptions = this.subscribers.get(eventType) || [];
    
    // Filter by target if specified
    const filteredSubscriptions = target 
      ? subscriptions.filter(sub => sub.source === target)
      : subscriptions;

    // Execute all handlers
    const promises = filteredSubscriptions.map(async subscription => {
      try {
        await subscription.handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get event history
   */
  getEventHistory(eventType?: string, limit?: number): Event[] {
    let events = eventType 
      ? this.eventHistory.filter(event => event.type === eventType)
      : this.eventHistory;

    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): EventSubscription[] {
    const allSubscriptions: EventSubscription[] = [];
    for (const subscriptions of this.subscribers.values()) {
      allSubscriptions.push(...subscriptions);
    }
    return allSubscriptions;
  }

  /**
   * Get subscription count for an event type
   */
  getSubscriptionCount(eventType: string): number {
    return this.subscribers.get(eventType)?.length || 0;
  }

  /**
   * Wait for a specific event to occur
   */
  waitForEvent(
    eventType: string, 
    timeout: number = 30000,
    filter?: (event: Event) => boolean
  ): Promise<Event> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const subscriptionId = this.subscribe(eventType, (event) => {
        if (!filter || filter(event)) {
          clearTimeout(timeoutId);
          this.unsubscribe(subscriptionId);
          resolve(event);
        }
      });
    });
  }

  /**
   * Create a request-response pattern using events
   */
  async request(
    requestType: string, 
    responseType: string, 
    data: EventData,
    timeout: number = 30000
  ): Promise<Event> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up response listener first
    const responsePromise = this.waitForEvent(
      responseType, 
      timeout,
      (event) => event.data.requestId === requestId
    );

    // Send the request
    await this.emit(requestType, { ...data, requestId });

    return responsePromise;
  }

  private addToHistory(event: Event): void {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get statistics about the event bus
   */
  getStats(): {
    totalSubscriptions: number;
    eventTypes: string[];
    historySize: number;
    recentEventTypes: string[];
  } {
    const eventTypes = Array.from(this.subscribers.keys());
    const recentEvents = this.eventHistory.slice(-10);
    const recentEventTypes = [...new Set(recentEvents.map(e => e.type))];

    return {
      totalSubscriptions: this.getSubscriptions().length,
      eventTypes,
      historySize: this.eventHistory.length,
      recentEventTypes
    };
  }
}