/**
 * Application Lifecycle Manager
 * 
 * Manages the complete lifecycle of the FinalDestination application,
 * including initialization, startup, shutdown, and error recovery.
 */

class AppLifecycle {
    constructor() {
        this.state = 'uninitialized'; // uninitialized, initializing, ready, error, shutdown
        this.initializationSteps = [];
        this.shutdownSteps = [];
        this.errorHandlers = [];
        this.lifecycleListeners = new Map();
        this.startTime = null;
        this.readyTime = null;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.shutdown = this.shutdown.bind(this);
        this.handleError = this.handleError.bind(this);
        this.addInitializationStep = this.addInitializationStep.bind(this);
        this.addShutdownStep = this.addShutdownStep.bind(this);
    }
    
    /**
     * Add initialization step
     */
    addInitializationStep(name, handler, dependencies = []) {
        this.initializationSteps.push({
            name,
            handler,
            dependencies,
            completed: false,
            error: null,
            duration: 0
        });
    }
    
    /**
     * Add shutdown step
     */
    addShutdownStep(name, handler) {
        this.shutdownSteps.push({
            name,
            handler,
            completed: false,
            error: null
        });
    }
    
    /**
     * Add error handler
     */
    addErrorHandler(handler) {
        this.errorHandlers.push(handler);
    }
    
    /**
     * Add lifecycle listener
     */
    addLifecycleListener(event, handler) {
        if (!this.lifecycleListeners.has(event)) {
            this.lifecycleListeners.set(event, []);
        }
        this.lifecycleListeners.get(event).push(handler);
    }
    
    /**
     * Remove lifecycle listener
     */
    removeLifecycleListener(event, handler) {
        if (this.lifecycleListeners.has(event)) {
            const handlers = this.lifecycleListeners.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit lifecycle event
     */
    emitLifecycleEvent(event, data = null) {
        if (this.lifecycleListeners.has(event)) {
            const handlers = this.lifecycleListeners.get(event);
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[AppLifecycle] Error in ${event} listener:`, error);
                }
            }
        }
    }
    
    /**
     * Initialize application
     */
    async initialize() {
        if (this.state !== 'uninitialized') {
            console.warn('[AppLifecycle] Application already initialized or in process');
            return false;
        }
        
        this.state = 'initializing';
        this.startTime = Date.now();
        
        console.log('[AppLifecycle] Starting application initialization...');
        this.emitLifecycleEvent('initialization:start');
        
        try {
            // Sort steps by dependencies
            const sortedSteps = this.sortStepsByDependencies();
            
            // Execute initialization steps
            for (const step of sortedSteps) {
                await this.executeInitializationStep(step);
            }
            
            this.state = 'ready';
            this.readyTime = Date.now();
            const totalDuration = this.readyTime - this.startTime;
            
            console.log(`[AppLifecycle] Application initialized successfully in ${totalDuration}ms`);
            this.emitLifecycleEvent('initialization:complete', {
                duration: totalDuration,
                steps: this.initializationSteps
            });
            
            // Set up error handling
            this.setupGlobalErrorHandling();
            
            // Set up beforeunload handler
            this.setupBeforeUnloadHandler();
            
            return true;
            
        } catch (error) {
            this.state = 'error';
            console.error('[AppLifecycle] Application initialization failed:', error);
            this.emitLifecycleEvent('initialization:error', { error });
            
            // Attempt error recovery
            await this.handleError(error);
            
            return false;
        }
    }
    
    /**
     * Execute single initialization step
     */
    async executeInitializationStep(step) {
        console.log(`[AppLifecycle] Executing step: ${step.name}`);
        this.emitLifecycleEvent('step:start', { step: step.name });
        
        const stepStartTime = Date.now();
        
        try {
            await step.handler();
            step.completed = true;
            step.duration = Date.now() - stepStartTime;
            
            console.log(`[AppLifecycle] Step completed: ${step.name} (${step.duration}ms)`);
            this.emitLifecycleEvent('step:complete', { 
                step: step.name, 
                duration: step.duration 
            });
            
        } catch (error) {
            step.error = error;
            step.duration = Date.now() - stepStartTime;
            
            console.error(`[AppLifecycle] Step failed: ${step.name}`, error);
            this.emitLifecycleEvent('step:error', { 
                step: step.name, 
                error, 
                duration: step.duration 
            });
            
            throw error;
        }
    }
    
    /**
     * Sort initialization steps by dependencies
     */
    sortStepsByDependencies() {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        
        const visit = (step) => {
            if (visiting.has(step.name)) {
                throw new Error(`Circular dependency detected: ${step.name}`);
            }
            
            if (visited.has(step.name)) {
                return;
            }
            
            visiting.add(step.name);
            
            // Visit dependencies first
            for (const depName of step.dependencies) {
                const depStep = this.initializationSteps.find(s => s.name === depName);
                if (depStep) {
                    visit(depStep);
                } else {
                    console.warn(`[AppLifecycle] Dependency not found: ${depName}`);
                }
            }
            
            visiting.delete(step.name);
            visited.add(step.name);
            sorted.push(step);
        };
        
        for (const step of this.initializationSteps) {
            visit(step);
        }
        
        return sorted;
    }
    
    /**
     * Shutdown application
     */
    async shutdown() {
        if (this.state === 'shutdown') {
            console.warn('[AppLifecycle] Application already shut down');
            return;
        }
        
        console.log('[AppLifecycle] Starting application shutdown...');
        this.state = 'shutdown';
        this.emitLifecycleEvent('shutdown:start');
        
        // Execute shutdown steps in reverse order
        const reversedSteps = [...this.shutdownSteps].reverse();
        
        for (const step of reversedSteps) {
            try {
                console.log(`[AppLifecycle] Executing shutdown step: ${step.name}`);
                await step.handler();
                step.completed = true;
                
            } catch (error) {
                step.error = error;
                console.error(`[AppLifecycle] Shutdown step failed: ${step.name}`, error);
            }
        }
        
        console.log('[AppLifecycle] Application shutdown complete');
        this.emitLifecycleEvent('shutdown:complete');
    }
    
    /**
     * Handle application error
     */
    async handleError(error) {
        console.error('[AppLifecycle] Handling application error:', error);
        this.emitLifecycleEvent('error:occurred', { error });
        
        // Execute error handlers
        for (const handler of this.errorHandlers) {
            try {
                await handler(error);
            } catch (handlerError) {
                console.error('[AppLifecycle] Error handler failed:', handlerError);
            }
        }
        
        // Attempt recovery based on error type
        if (this.canRecover(error)) {
            console.log('[AppLifecycle] Attempting error recovery...');
            this.emitLifecycleEvent('recovery:start', { error });
            
            try {
                await this.recoverFromError(error);
                console.log('[AppLifecycle] Error recovery successful');
                this.emitLifecycleEvent('recovery:success', { error });
                
            } catch (recoveryError) {
                console.error('[AppLifecycle] Error recovery failed:', recoveryError);
                this.emitLifecycleEvent('recovery:failed', { error, recoveryError });
            }
        }
    }
    
    /**
     * Check if error is recoverable
     */
    canRecover(error) {
        // Define recoverable error types
        const recoverableErrors = [
            'NetworkError',
            'TimeoutError',
            'ServiceUnavailableError'
        ];
        
        return recoverableErrors.includes(error.name) || 
               error.message.includes('network') ||
               error.message.includes('timeout');
    }
    
    /**
     * Attempt to recover from error
     */
    async recoverFromError(error) {
        // Implement recovery strategies based on error type
        if (error.name === 'NetworkError' || error.message.includes('network')) {
            // Wait and retry network operations
            await this.delay(2000);
            
            // Re-initialize network-dependent services
            const networkSteps = this.initializationSteps.filter(step => 
                step.name.includes('api') || step.name.includes('network')
            );
            
            for (const step of networkSteps) {
                if (step.error) {
                    step.error = null;
                    step.completed = false;
                    await this.executeInitializationStep(step);
                }
            }
        }
        
        // Reset state if recovery successful
        if (this.state === 'error') {
            this.state = 'ready';
        }
    }
    
    /**
     * Set up global error handling
     */
    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[AppLifecycle] Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
        
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('[AppLifecycle] JavaScript error:', event.error);
            this.handleError(event.error);
        });
        
        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                console.error('[AppLifecycle] Resource loading error:', event.target);
                this.emitLifecycleEvent('resource:error', { target: event.target });
            }
        }, true);
    }
    
    /**
     * Set up beforeunload handler
     */
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', (event) => {
            console.log('[AppLifecycle] Page unloading, starting shutdown...');
            
            // Perform synchronous cleanup
            this.performSyncCleanup();
            
            // Don't prevent unload, just clean up
        });
    }
    
    /**
     * Perform synchronous cleanup
     */
    performSyncCleanup() {
        // Clear timers, intervals, etc.
        this.emitLifecycleEvent('cleanup:start');
        
        // Notify components to clean up
        if (window.FinalDestination && window.FinalDestination.infrastructure) {
            const { componentIntegration } = window.FinalDestination.infrastructure;
            if (componentIntegration) {
                componentIntegration.destroyAllComponents();
            }
        }
        
        this.emitLifecycleEvent('cleanup:complete');
    }
    
    /**
     * Get application state
     */
    getState() {
        return {
            state: this.state,
            startTime: this.startTime,
            readyTime: this.readyTime,
            initializationSteps: this.initializationSteps.map(step => ({
                name: step.name,
                completed: step.completed,
                error: step.error ? step.error.message : null,
                duration: step.duration
            })),
            shutdownSteps: this.shutdownSteps.map(step => ({
                name: step.name,
                completed: step.completed,
                error: step.error ? step.error.message : null
            }))
        };
    }
    
    /**
     * Check if application is ready
     */
    isReady() {
        return this.state === 'ready';
    }
    
    /**
     * Check if application is initializing
     */
    isInitializing() {
        return this.state === 'initializing';
    }
    
    /**
     * Check if application has error
     */
    hasError() {
        return this.state === 'error';
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppLifecycle;
} else {
    window.AppLifecycle = AppLifecycle;
}


