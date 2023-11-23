import type { InvocationInfo } from '../models/InvocationInfo';
import type { SimilarTracks } from '../models/SimilarTracks';
import type { Supplement } from '../models/Supplement';
import type { Track } from '../models/Track';
import type { TrackDownloadInfo } from '../models/TrackDownloadInfo';
import type { TracksList } from '../models/TracksList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class TracksService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
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
     * Дизлайк
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    dislikeTracks(userId: number, formData: {
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
    /**
     * Получение треков
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    getTracks(formData: {
        /**
         * Уникальные идентификаторы треков
         */
        'track-ids'?: Array<string>;
        /**
         * С позициями
         */
        'with-positions'?: boolean;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Track>;
    }>;
    /**
     * Получение информации о доступных вариантах загрузки трека.
     * @param trackId
     * @returns any Ok
     * @throws ApiError
     */
    getDownloadInfo(trackId: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<TrackDownloadInfo>;
    }>;
    /**
     * Получение дополнительной информации о треке (Текст песни, видео, и т.д.).
     * Получение дополнительной информации о треке (Текст песни, видео, и т.д.).
     * @param trackId
     * @returns any Ok
     * @throws ApiError
     */
    getTrackSupplement(trackId: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Supplement;
    }>;
    /**
     * Получение похожих треков
     * Получение похожих треков
     * @param trackId
     * @returns any Ok
     * @throws ApiError
     */
    getSimilarTracks(trackId: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: SimilarTracks;
    }>;
    /**
     * Получение текста песни с таймкодами
     * @param trackId
     * @param format
     * @param timeStamp
     * @param sign
     * @returns any Ok
     * @throws ApiError
     */
    getTrackLyrics(trackId: string, format?: string, timeStamp?: string, sign?: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: any;
    }>;
    /**
     * Метод для отправки текущего состояния прослушиваемого трека
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    playAudio(formData: {
        /**
         * Уникальный идентификатор трека
         */
        'track-id'?: string;
        /**
         * Проигрывается ли трек из кеша
         */
        'from-cache'?: boolean;
        /**
         * Наименования клиента с которого происходит прослушивание
         */
        from: string;
        /**
         * Уникальный идентификатор проигрывания
         */
        'play-id'?: string;
        /**
         * Уникальный идентификатор пользователя
         */
        uid?: number;
        /**
         * Текущая дата и время в ISO
         */
        timestamp?: string;
        /**
         * Продолжительность трека в секундах
         */
        'track-length-seconds'?: number;
        /**
         * Продолжительность трека в секундах
         */
        'total-played-seconds'?: number;
        /**
         * Продолжительность трека в секундах
         */
        'end-position-seconds'?: number;
        /**
         * Уникальный идентификатор альбома
         */
        'album-id'?: string;
        /**
         * Уникальный идентификатор проигрывания
         */
        'playlist-id'?: string;
        /**
         * Текущая дата и время клиента в ISO
         */
        'client-now'?: string;
    }): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: string;
    }>;
}
