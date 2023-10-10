"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlbumsService = void 0;
var AlbumsService = /** @class */ (function () {
    function AlbumsService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Получение альбома по идентификатору
     * @param albumId
     * @returns any Ok
     * @throws ApiError
     */
    AlbumsService.prototype.getAlbumById = function (albumId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/albums/{albumId}/',
            path: {
                'albumId': albumId,
            },
        });
    };
    /**
     * Получение списка альбомов пользователя.
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    AlbumsService.prototype.getAlbums = function (userId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/likes/albums',
            path: {
                'userId': userId,
            },
            errors: {
                405: "Method Not Allowed",
            },
        });
    };
    /**
     * Получение альбома с треками
     * @param albumId
     * @returns any Ok
     * @throws ApiError
     */
    AlbumsService.prototype.getAlbumsWithTracks = function (albumId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/albums/{albumId}/with-tracks',
            path: {
                'albumId': albumId,
            },
        });
    };
    /**
     * Получение альбомов по идентификаторам
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    AlbumsService.prototype.getAlbumsByIds = function (formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/albums',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    };
    return AlbumsService;
}());
exports.AlbumsService = AlbumsService;
