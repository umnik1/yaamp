import type { InvocationInfo } from '../models/InvocationInfo';
import type { Search } from '../models/Search';
import type { SearchType } from '../models/SearchType';
import type { Suggestions } from '../models/Suggestions';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class SearchService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Осуществление поиска по запросу и типу, получение результатов
     * @param text Текст запроса
     * @param page Номер страницы выдачи
     * @param type
     * @param nococrrect
     * @returns any Ok
     * @throws ApiError
     */
    search(text: string, page: number, type: SearchType, nococrrect?: boolean): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Search;
    }>;
    /**
     * @param part Часть поискового запроса
     * @returns any Ok
     * @throws ApiError
     */
    getSearchSuggest(part: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Suggestions;
    }>;
}
