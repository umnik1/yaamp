import type { FullChartResult } from '../models/FullChartResult';
import type { InvocationInfo } from '../models/InvocationInfo';
import type { LandingResult } from '../models/LandingResult';
import type { NewPlaylistItem } from '../models/NewPlaylistItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class LandingService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * @param blocks
     * @returns any Ok
     * @throws ApiError
     */
    getLandingBlocks(blocks?: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: LandingResult;
    }>;
    /**
     * @param landingBlock
     * @returns any ok
     * @throws ApiError
     */
    getLandingBlock(landingBlock: 'new-playlists' | 'new-releases' | 'chart' | 'podcasts'): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: any;
    }>;
    /**
     * @returns any ok
     * @throws ApiError
     */
    getNewReleases(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            id: string;
            type: 'new-releases';
            typeForFrom: string;
            title: string;
            newReleases: Array<number>;
        };
    }>;
    /**
     * @returns any ok
     * @throws ApiError
     */
    getNewPodcasts(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            type: 'non-music_main_podcasts';
            typeForFrom: string;
            title: string;
            podcasts: Array<number>;
        };
    }>;
    /**
     * @returns any ok
     * @throws ApiError
     */
    getNewPlaylists(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            id: string;
            type: 'new-playlists';
            typeForFrom: string;
            title: string;
            newPlaylists: Array<NewPlaylistItem>;
        };
    }>;
    /**
     * @param chartType
     * @returns any Ok
     * @throws ApiError
     */
    getChart(chartType: 'russia' | 'world'): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: FullChartResult;
    }>;
}
