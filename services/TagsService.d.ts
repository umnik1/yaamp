import type { InvocationInfo } from '../models/InvocationInfo';
import type { TagResult } from '../models/TagResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class TagsService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * @param tagId
     * @returns any Ok
     * @throws ApiError
     */
    getPlaylistsIdsByTag(tagId: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: TagResult;
    }>;
}
