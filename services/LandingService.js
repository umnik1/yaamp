"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandingService = void 0;
var LandingService = /** @class */ (function () {
    function LandingService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * @param blocks
     * @returns any Ok
     * @throws ApiError
     */
    LandingService.prototype.getLandingBlocks = function (blocks) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/landing3',
            query: {
                'blocks': blocks,
            },
        });
    };
    /**
     * @param landingBlock
     * @returns any ok
     * @throws ApiError
     */
    LandingService.prototype.getLandingBlock = function (landingBlock) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/landing3/{landingBlock}',
            path: {
                'landingBlock': landingBlock,
            },
        });
    };
    /**
     * @returns any ok
     * @throws ApiError
     */
    LandingService.prototype.getNewReleases = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/landing3/new-releases',
        });
    };
    /**
     * @returns any ok
     * @throws ApiError
     */
    LandingService.prototype.getNewPodcasts = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/landing3/podcasts',
        });
    };
    /**
     * @returns any ok
     * @throws ApiError
     */
    LandingService.prototype.getNewPlaylists = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/landing3/new-playlists',
        });
    };
    /**
     * @param chartType
     * @returns any Ok
     * @throws ApiError
     */
    LandingService.prototype.getChart = function (chartType) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/landing3/chart/{chartType}',
            path: {
                'chartType': chartType,
            },
        });
    };
    return LandingService;
}());
exports.LandingService = LandingService;
