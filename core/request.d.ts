import type { ApiRequestOptions } from './ApiRequestOptions';
import { CancelablePromise } from './CancelablePromise';
import type { OpenAPIConfig } from './OpenAPI';
/**
 * Request method
 * @param config The OpenAPI configuration object
 * @param options The request options from the service
 * @returns CancelablePromise<T>
 * @throws ApiError
 */
export declare const request: <T>(config: OpenAPIConfig, options: ApiRequestOptions) => CancelablePromise<T>;
