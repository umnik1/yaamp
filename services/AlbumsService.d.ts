import type { Album } from '../models/Album';
import type { InvocationInfo } from '../models/InvocationInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class AlbumsService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Получение альбома по идентификатору
     * @param albumId
     * @returns any Ok
     * @throws ApiError
     */
    getAlbumById(albumId: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Album;
    }>;
    /**
     * Получение альбома с треками
     * @param albumId
     * @returns any Ok
     * @throws ApiError
     */
    getAlbumsWithTracks(albumId: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Album;
    }>;
    /**
     * Получение списка альбомов пользователя.
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    getAlbumsLists(userId: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Playlist>;
    }>;
    /**
     * Получение альбомов по идентификаторам
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    getAlbumsByIds(formData: {
        'album-ids': string;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Album>;
    }>;
}
