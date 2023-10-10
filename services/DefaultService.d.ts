import type { BooksAndPodcastsResult } from '../models/BooksAndPodcastsResult';
import type { GeneratedPlaylistLandingBlock } from '../models/GeneratedPlaylistLandingBlock';
import type { Genre } from '../models/Genre';
import type { InvocationInfo } from '../models/InvocationInfo';
import type { PermissionAlerts } from '../models/PermissionAlerts';
import type { Settings } from '../models/Settings';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class DefaultService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * @returns any Ok
     * @throws ApiError
     */
    getSettings(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Settings;
    }>;
    /**
     * @returns any Ok
     * @throws ApiError
     */
    getPermissionAlerts(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: PermissionAlerts;
    }>;
    /**
     * @returns any Ok
     * @throws ApiError
     */
    getFeedWizardIsPassed(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            isWizardPassed?: boolean;
        };
    }>;
    /**
     * @returns any Ok
     * @throws ApiError
     */
    getFeed(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            canGetMoreEvents: boolean;
            days: Array<any>;
            generatedPlaylists: Array<GeneratedPlaylistLandingBlock>;
            headlines: Array<any>;
            isWizardPassed: boolean;
            pumpkin: boolean;
            today: string;
        };
    }>;
    /**
     * @returns any Ok
     * @throws ApiError
     */
    getGenres(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Genre>;
    }>;
    /**
     * Получение блоков книг и подкастов с главной страницы
     * @returns any Ok
     * @throws ApiError
     */
    getBooksAndPodcasts(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: BooksAndPodcastsResult;
    }>;
}
