import type { InvocationInfo } from '../models/InvocationInfo';
import type { Playlist } from '../models/Playlist';
import type { PlaylistRecommendations } from '../models/PlaylistRecommendations';
import type { TracksList } from '../models/TracksList';
import type { VisibilityEnum } from '../models/VisibilityEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class UserService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Получение токена по логину и паролю
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    getToken(formData: {
        grant_type: 'password';
        client_id: '#########################';
        client_secret: '#########################';
        username: string;
        password: string;
    }): CancelablePromise<{
        access_token: string;
        expires_in: number;
        token_type: string;
        uid: number;
    }>;
    /**
     * Получение списка плейлистов пользователя.
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    getPlayLists(userId: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Playlist>;
    }>;
    /**
     * Получение треков с отметкой "Не рекомендовать"
     * @param userId Идентификатор пользователя
     * @param ifModifiedSinceRevision TODO
     * @returns any Ok
     * @throws ApiError
     */
    getDislikedTracksIds(userId: number, ifModifiedSinceRevision?: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: TracksList;
    }>;
    /**
     * Получение плейлиста по уникальному идентификатору
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @returns any Ok
     * @throws ApiError
     */
    getPlaylistById(userId: number, kind: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Playlist;
    }>;
    /**
     * Получение плейлистов по идентификаторам
     * @param userId Идентификатор пользователя
     * @param kinds
     * @param mixed
     * @param richTracks
     * @returns any Ok
     * @throws ApiError
     */
    getUserPlaylistsByIds(userId: number, kinds: string, mixed: boolean, richTracks: boolean): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Playlist>;
    }>;
    /**
     * Создание нового плейлиста
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    createPlaylist(userId: number, formData: {
        title: string;
        visibility: VisibilityEnum;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Playlist;
    }>;
    /**
     * Изменение названия плейлиста.
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @param formData
     * @returns any Изменение видимости плейлиста
     * @throws ApiError
     */
    renamePlaylist(userId: number, kind: number, formData: {
        value?: string;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Playlist;
    }>;
    /**
     * Удаление плейлиста
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @returns any Ok
     * @throws ApiError
     */
    deletePlaylist(userId: number, kind: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: string;
    }>;
    /**
     * Добавление треков в плейлист
     * Используй '{"diff":{"op":"insert","at":0,"tracks":[{"id":"20599729","albumId":"2347459"}]}}' - для добавления, {"diff":{"op":"delete","from":0,"to":1,"tracks":[{"id":"20599729","albumId":"2347459"}]}} - для удаления треков
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    changePlaylistTracks(userId: number, kind: number, formData: {
        diff?: string;
        revision?: string;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Playlist;
    }>;
    /**
     * Получение рекомендаций для плейлиста
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @returns any Ok
     * @throws ApiError
     */
    getRecommendations(userId: number, kind: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: PlaylistRecommendations;
    }>;
    /**
     * Изменение видимости плейлиста
     * Необходимо передать "public" или "private" в качестве значения
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @param formData
     * @returns any Изменение видимости плейлиста
     * @throws ApiError
     */
    changePlaylistVisibility(userId: number, kind: number, formData: {
        value?: VisibilityEnum;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Playlist;
    }>;
    /**
     * Пометить треки как "Мне нравится"
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    likeTracks(userId: number, formData: {
        'track-ids'?: Array<string>;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            revision?: number;
        };
    }>;
    /**
     * Удаление треков из списка "Мне нравится"
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    removeLikedTracks(userId: number, formData: {
        'track-ids'?: Array<string>;
    }): CancelablePromise<any>;
    /**
     * Получение треков с отметкой "Мне нравится"
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    getLikedTracksIds(userId: number): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: {
            library: TracksList;
        };
    }>;
}
