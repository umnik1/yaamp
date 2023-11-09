import type { ApiRequestOptions } from './ApiRequestOptions';
import { BaseHttpRequest } from './BaseHttpRequest';
import type { CancelablePromise } from './CancelablePromise';
import type { OpenAPIConfig } from './OpenAPI';
export declare class AxiosHttpRequest extends BaseHttpRequest {
    constructor(config: OpenAPIConfig);
    /**
     * Request method
     * @param options The request options from the service
     * @returns CancelablePromise<T>
     * @throws ApiError
     */
    request<T>(options: ApiRequestOptions): CancelablePromise<T>;
}
