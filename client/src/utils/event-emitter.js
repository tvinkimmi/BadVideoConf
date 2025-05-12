const STALE_TIME = 60000;

export class EventEmitter {
    events = new Map();
    cached = new Map();

    on(event, listener) {
        if (!this.events.has(event)) {
        this.events.set(event, []);
    }
    this.events.get(event).push(listener);

    if (this.cached.has(event)) {
        const cachedEvent = this.cached.get(event);

        const isStale = Date.now() - STALE_TIME > cachedEvent.timestamp;

        this.cached.delete(event);

        if (isStale) {
            return;
        }

        listener(...cachedEvent.args);
    }
}

    off(event, listener){
        if (this.events.has(event)) {
        this.events.set(
            event,
            this.events.get(event).filter((l) => l !== listener),
    );
    }
}

    emit(event, ...args) {
        if (this.events.has(event)) {
        this.events.get(event).forEach((listener) => listener(...args));
    } else {
        this.cached.set(event, {
            args,
            timestamp: Date.now(),
        });
    }
}
}
