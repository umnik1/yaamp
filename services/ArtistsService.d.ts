import type { Artist } from '../models/Artist';
import type { InvocationInfo } from '../models/InvocationInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class ArtistsService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Получение популярных треков для артиста
     * @param artistId
     * @returns any Ok
     * @throws ApiError
     */
    getPopularTracks(artistId: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            artist: Artist;
            tracks: Array<string>;
        };
    }>;
    /**
     * Получение списка артистов пользователя.
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    getArtistsLists(userId: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Playlist>;
    }>;
    /**
     * @param artistId
     * @returns any Ok
     * @throws ApiError
     */
    getArtistsBriefInfo(artistId: string): CancelablePromise<any>;
    /**
     * @param artistId
     * @param page
     * @param pageSize
     * @returns any Ok
     * @throws ApiError
     */
    getArtistTracks(artistId: string, page?: number, pageSize?: number): CancelablePromise<any>;
    /**
     * @param artistId
     * @param page
     * @param pageSize
     * @param sortBy
     * @returns any Ok
     * @throws ApiError
     */
    getArtistsDirectAlbums(artistId: string, page?: number, pageSize?: number, sortBy?: 'year' | 'rating'): CancelablePromise<any>;
}
