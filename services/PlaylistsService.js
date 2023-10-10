"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistsService = void 0;
var PlaylistsService = /** @class */ (function () {
    function PlaylistsService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Получение полной информации о плейлистах по их идентификатору
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    PlaylistsService.prototype.getPlaylistsByIds = function (formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/playlists/list',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                400: "Bad Request",
            },
        });
    };
    /**
     * Получение списка плейлистов пользователя.
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    PlaylistsService.prototype.getPlayLists = function (userId) {
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
     * Получение плейлиста по уникальному идентификатору
     * @param userId Идентификатор пользователя
     * @param kind Идентификатор плейлиста
     * @returns any Ok
     * @throws ApiError
     */
    PlaylistsService.prototype.getPlaylistById = function (userId, kind) {
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
    PlaylistsService.prototype.getUserPlaylistsByIds = function (userId, kinds, mixed, richTracks) {
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
    PlaylistsService.prototype.createPlaylist = function (userId, formData) {
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
    PlaylistsService.prototype.renamePlaylist = function (userId, kind, formData) {
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
    PlaylistsService.prototype.deletePlaylist = function (userId, kind) {
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
    PlaylistsService.prototype.changePlaylistTracks = function (userId, kind, formData) {
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
    PlaylistsService.prototype.getRecommendations = function (userId, kind) {
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
    PlaylistsService.prototype.changePlaylistVisibility = function (userId, kind, formData) {
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
    return PlaylistsService;
}());
exports.PlaylistsService = PlaylistsService;
