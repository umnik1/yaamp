"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultService = void 0;
var DefaultService = /** @class */ (function () {
    function DefaultService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    DefaultService.prototype.getSettings = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/settings',
        });
    };
    /**
     * @returns any Ok
     * @throws ApiError
     */
    DefaultService.prototype.getPermissionAlerts = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/permission-alerts',
        });
    };
    /**
     * @returns any Ok
     * @throws ApiError
     */
    DefaultService.prototype.getFeedWizardIsPassed = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/feed/wizard/is-passed',
        });
    };
    /**
     * @returns any Ok
     * @throws ApiError
     */
    DefaultService.prototype.getFeed = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/feed',
        });
    };
    /**
     * @returns any Ok
     * @throws ApiError
     */
    DefaultService.prototype.getGenres = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/genres',
        });
    };
    /**
     * Получение блоков книг и подкастов с главной страницы
     * @returns any Ok
     * @throws ApiError
     */
    DefaultService.prototype.getBooksAndPodcasts = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/non-music/calague',
        });
    };
    return DefaultService;
}());
exports.DefaultService = DefaultService;
