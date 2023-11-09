import type { ApiRequestOptions } from './ApiRequestOptions';
import type { CancelablePromise } from './CancelablePromise';
import type { OpenAPIConfig } from './OpenAPI';
export declare abstract class BaseHttpRequest {
    readonly config: OpenAPIConfig;
    constructor(config: OpenAPIConfig);
    abstract request<T>(options: ApiRequestOptions): CancelablePromise<T>;
}
