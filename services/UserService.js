"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
var UserService = /** @class */ (function () {
    function UserService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Получение токена по логину и паролю
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.getToken = function (formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/token',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    };
    /**
     * Получение списка плейлистов пользователя.
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.getPlayLists = function (userId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/playlists/list',
            path: {
                'userId': userId,
            },
            errors: {
                405: "Method Not Allowed",
            },
        });
    };
    /**
     * Получение треков с отметкой "Не рекомендовать"
     * @param userId Идентификатор пользователя
     * @param ifModifiedSinceRevision TODO
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.getDislikedTracksIds = function (userId, ifModifiedSinceRevision) {
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
     * Получение плейлиста по уникальному идентификатору
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.getPlaylistById = function (userId, kind) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/playlists/{kind}',
            path: {
                'userId': userId,
                'kind': kind,
            },
        });
    };
    /**
     * Получение плейлистов по идентификаторам
     * @param userId Идентификатор пользователя
     * @param kinds
     * @param mixed
     * @param richTracks
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.getUserPlaylistsByIds = function (userId, kinds, mixed, richTracks) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/playlists',
            path: {
                'userId': userId,
            },
            query: {
                'kinds': kinds,
                'mixed': mixed,
                'rich-tracks': richTracks,
            },
        });
    };
    /**
     * Создание нового плейлиста
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.createPlaylist = function (userId, formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/playlists/create',
            path: {
                'userId': userId,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                400: "Bad Request",
                401: "Unauthorized",
            },
        });
    };
    /**
     * Изменение названия плейлиста.
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @param formData
     * @returns any Изменение видимости плейлиста
     * @throws ApiError
     */
    UserService.prototype.renamePlaylist = function (userId, kind, formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/playlists/{kind}/name',
            path: {
                'userId': userId,
                'kind': kind,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    };
    /**
     * Удаление плейлиста
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.deletePlaylist = function (userId, kind) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/playlists/{kind}/delete',
            path: {
                'userId': userId,
                'kind': kind,
            },
        });
    };
    /**
     * Добавление треков в плейлист
     * Используй '{"diff":{"op":"insert","at":0,"tracks":[{"id":"20599729","albumId":"2347459"}]}}' - для добавления, {"diff":{"op":"delete","from":0,"to":1,"tracks":[{"id":"20599729","albumId":"2347459"}]}} - для удаления треков
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.changePlaylistTracks = function (userId, kind, formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/playlists/{kind}/change-relative',
            path: {
                'userId': userId,
                'kind': kind,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                412: "Wrong revision or Failed to patch current playlist",
            },
        });
    };
    /**
     * Получение рекомендаций для плейлиста
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.getRecommendations = function (userId, kind) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/playlists/{kind}/recommendations',
            path: {
                'userId': userId,
                'kind': kind,
            },
        });
    };
    /**
     * Изменение видимости плейлиста
     * Необходимо передать "public" или "private" в качестве значения
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @param formData
     * @returns any Изменение видимости плейлиста
     * @throws ApiError
     */
    UserService.prototype.changePlaylistVisibility = function (userId, kind, formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/users/{userId}/playlists/{kind}/visibility',
            path: {
                'userId': userId,
                'kind': kind,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                400: "Bad Request",
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
    UserService.prototype.likeTracks = function (userId, formData) {
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
     * Удаление треков из списка "Мне нравится"
     * @param userId Идентификатор пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    UserService.prototype.removeLikedTracks = function (userId, formData) {
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
    UserService.prototype.getLikedTracksIds = function (userId) {
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
    return UserService;
}());
exports.UserService = UserService;
