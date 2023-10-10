"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RotorService = void 0;
var RotorService = /** @class */ (function () {
    function RotorService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Получение информации о станции и пользовательских настроек на неё
     * @param stationId ID радиостанции, для примера: user:onyourwave это моя волна
     * @returns any Ok
     * @throws ApiError
     */
    RotorService.prototype.getStationInfo = function (stationId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/rotor/station/{stationId}/info',
            path: {
                'stationId': stationId,
            },
        });
    };
    /**
     * Получение цепочки треков определённой станции
     * @param stationId ID радиостанции, для примера: user:onyourwave это моя волна
     * @param settings2 Использовать ли второй набор настроек. Все официальные клиенты выполняют запросы с `settings2 = True`.
     * @param queue Уникальной идентификатор трека, который только что был.
     * @returns any Ok
     * @throws ApiError
     */
    RotorService.prototype.getStationTracks = function (stationId, settings2, queue) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/rotor/station/{stationId}/tracks',
            path: {
                'stationId': stationId,
            },
            query: {
                'settings2': settings2,
                'queue': queue,
            },
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
    RotorService.prototype.getRotorAccountStatus = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/rotor/account/status',
            errors: {
                400: "Bad Request",
            },
        });
    };
    /**
     * Получение всех радиостанций с настройками пользователя
     * @param language Язык, на котором будет информация о станциях
     * @returns any Ok
     * @throws ApiError
     */
    RotorService.prototype.getStationsList = function (language) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/rotor/stations/list',
            query: {
                'language': language,
            },
        });
    };
    /**
     * Получение рекомендованных станций текущего пользователя
     * @returns any Ok
     * @throws ApiError
     */
    RotorService.prototype.getRotorStationsDashboard = function () {
        return this.httpRequest.request({
            method: 'GET',
            url: '/rotor/stations/dashboard',
        });
    };
    /**
     * Отправка ответной реакции на происходящее при прослушивании радио. Сообщения о начале прослушивания радио, начале и конце трека, его пропуска.
     * @param stationId Станция
     * @param requestBody
     * @param batchId Уникальный идентификатор партии треков. Возвращается при получении треков. Должен отсутствовать, для типа 'radioStarted'
     * @returns any Ok
     * @throws ApiError
     */
    RotorService.prototype.sendStationFeedback = function (stationId, requestBody, batchId) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/rotor/station/{stationId}/feedback',
            path: {
                'stationId': stationId,
            },
            query: {
                'batch-id': batchId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    };
    return RotorService;
}());
exports.RotorService = RotorService;
