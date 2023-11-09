export declare class CancelError extends Error {
    constructor(message: string);
    get isCancelled(): boolean;
}
export interface OnCancel {
    readonly isResolved: boolean;
    readonly isRejected: boolean;
    readonly isCancelled: boolean;
    (cancelHandler: () => void): void;
}
export declare class CancelablePromise<T> implements Promise<T> {
    readonly [Symbol.toStringTag]: string;
    private _isResolved;
    private _isRejected;
    private _isCancelled;
    private readonly _cancelHandlers;
    private readonly _promise;
    private _resolve?;
    private _reject?;
    constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void, onCancel: OnCancel) => void);
    then<TResult1 = T, TResult2 = never>(onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null, onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
    catch<TResult = never>(onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<T | TResult>;
    finally(onFinally?: (() => void) | null): Promise<T>;
    cancel(): void;
    get isCancelled(): boolean;
}
