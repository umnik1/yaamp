"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
var AccountService = /** @class */ (function () {
    function AccountService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    AccountService.prototype.getAccountExperiments = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/account/experiments',
        });
    };
    /**
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    AccountService.prototype.activatePromoCode = function (formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/account/consume-promo-code',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    };
    /**
     * Получение настроек текущего пользователя
     * @returns any Ok
     * @throws ApiError
     */
    AccountService.prototype.getAccountSettings = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/account/settings',
        });
    };
    /**
     * Изменение настроек текущего пользователя
     * @param formData
     * @returns any Ok
     * @throws ApiError
     */
    AccountService.prototype.changeAccountSettings = function (formData) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/account/settings',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                400: "Bad Request",
            },
        });
    };
    /**
     * @returns any Ok
     * @throws ApiError
     */
    AccountService.prototype.getAccountStatus = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/account/status',
            errors: {
                400: "Bad Request",
            },
        });
    };
    /**
     * Получение статуса пользователя с дополнителными полями
     * @returns any Ok
     * @throws ApiError
     */
    AccountService.prototype.getRotorAccountStatus = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/rotor/account/status',
            errors: {
                400: "Bad Request",
            },
        });
    };
    return AccountService;
}());
exports.AccountService = AccountService;
