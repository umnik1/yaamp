"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistsService = void 0;
var ArtistsService = /** @class */ (function () {
    function ArtistsService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Получение популярных треков для артиста
     * @param artistId
     * @returns any Ok
     * @throws ApiError
     */
    ArtistsService.prototype.getPopularTracks = function (artistId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/artists/{artistId}/track-ids-by-rating',
            path: {
                'artistId': artistId,
            },
        });
    };
    /**
     * @param artistId
     * @returns any Ok
     * @throws ApiError
     */
    ArtistsService.prototype.getArtistsBriefInfo = function (artistId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/artists/{artistId}/brief-info',
            path: {
                'artistId': artistId,
            },
        });
    };
    /**
     * Получение списка исполнителей пользователя.
     * @param userId Идентификатор пользователя
     * @returns any Ok
     * @throws ApiError
     */
    ArtistsService.prototype.getArtists = function (userId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/users/{userId}/likes/artists',
            path: {
                'userId': userId,
            },
            errors: {
                405: "Method Not Allowed",
            },
        });
    };
    /**
     * @param artistId
     * @param page
     * @param pageSize
     * @returns any Ok
     * @throws ApiError
     */
    ArtistsService.prototype.getArtistTracks = function (artistId, page, pageSize) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/artists/{artistId}/tracks',
            path: {
                'artistId': artistId,
            },
            query: {
                'page': page,
                'page-size': pageSize,
            },
        });
    };
    /**
     * @param artistId
     * @param page
     * @param pageSize
     * @param sortBy
     * @returns any Ok
     * @throws ApiError
     */
    ArtistsService.prototype.getArtistsDirectAlbums = function (artistId, page, pageSize, sortBy) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/artists/{artistId}/direct-albums',
            path: {
                'artistId': artistId,
            },
            query: {
                'page': page,
                'page-size': pageSize,
                'sort-by': sortBy,
            },
        });
    };
    return ArtistsService;
}());
exports.ArtistsService = ArtistsService;
