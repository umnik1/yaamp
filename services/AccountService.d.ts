import type { Experiments } from '../models/Experiments';
import type { InvocationInfo } from '../models/InvocationInfo';
import type { PromoCodeStatus } from '../models/PromoCodeStatus';
import type { Status } from '../models/Status';
import type { UserSettings } from '../models/UserSettings';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class AccountService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * @returns any Ok
     * @throws ApiError
     */
    getAccountExperiments(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Experiments;
    }>;
    /**
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    activatePromoCode(formData: {
        code?: string;
        language?: string;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: PromoCodeStatus;
    }>;
    /**
     * Получение настроек текущего пользователя
     * @returns any Ok
     * @throws ApiError
     */
    getAccountSettings(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: UserSettings;
    }>;
    /**
     * Изменение настроек текущего пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    changeAccountSettings(formData: any): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: (UserSettings | string);
    }>;
    /**
     * @returns any Ok
     * @throws ApiError
     */
    getAccountStatus(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Status;
    }>;
    /**
     * Получение статуса пользователя с дополнителными полями
     * @returns any Ok
     * @throws ApiError
     */
    getRotorAccountStatus(): CancelablePromise<any>;
}
