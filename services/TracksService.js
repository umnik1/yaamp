"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracksService = void 0;
var TracksService = /** @class */ (function () {
    function TracksService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Получение треков с отметкой "Не рекомендовать"
     * @param userId Идентификатор пользователя
     * @param ifModifiedSinceRevision TODO
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.getDislikedTracksIds = function (userId, ifModifiedSinceRevision) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/dislikes/tracks',
            path: {
                'userId': userId,
            },
            query: {
                'if_modified_since_revision': ifModifiedSinceRevision,
            },
        });
    };
    /**
     * Пометить треки как "Мне нравится"
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.likeTracks = function (userId, formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/likes/tracks/add-multiple',
            path: {
                'userId': userId,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                401: "Unauthorized",
            },
        });
    };
    /**
     * Дизлайк
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.dislikeTracks = function (userId, formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/dislikes/tracks/add-multiple',
            path: {
                'userId': userId,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                401: "Unauthorized",
            },
        });
    };
    /**
     * Удаление треков из списка "Мне нравится"
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.removeLikedTracks = function (userId, formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/likes/tracks/remove',
            path: {
                'userId': userId,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                401: "Unauthorized",
            },
        });
    };
    /**
     * Получение треков с отметкой "Мне нравится"
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.getLikedTracksIds = function (userId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/likes/tracks',
            path: {
                'userId': userId,
            },
            errors: {
                404: "Not Found",
            },
        });
    };
    /**
     * Получение треков
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.getTracks = function (formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/tracks/',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                400: "Bad Request",
            },
        });
    };
    /**
     * Получение информации о доступных вариантах загрузки трека.
     * @param trackId
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.getDownloadInfo = function (trackId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/tracks/{trackId}/download-info',
            path: {
                'trackId': trackId,
            },
        });
    };
    /**
     * Получение дополнительной информации о треке (Текст песни, видео, и т.д.).
     * Получение дополнительной информации о треке (Текст песни, видео, и т.д.).
     * @param trackId
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.getTrackSupplement = function (trackId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/tracks/{trackId}/supplement',
            path: {
                'trackId': trackId,
            },
        });
    };
    /**
     * Получение похожих треков
     * Получение похожих треков
     * @param trackId
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.getSimilarTracks = function (trackId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/tracks/{trackId}/similar',
            path: {
                'trackId': trackId,
            },
        });
    };
    /**
     * Получение текста песни с таймкодами
     * @param trackId
     * @param format
     * @param timeStamp
     * @param sign
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.getTrackLyrics = function (trackId, format, timeStamp, sign) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/tracks/{trackId}/lyrics',
            path: {
                'trackId': trackId,
            },
            query: {
                'format': format,
                'timeStamp': timeStamp,
                'sign': sign,
            },
        });
    };
    /**
     * Метод для отправки текущего состояния прослушиваемого трека
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    TracksService.prototype.playAudio = function (formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/play-audio',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                400: "Bad Request",
            },
        });
    };
    return TracksService;
}());
exports.TracksService = TracksService;
